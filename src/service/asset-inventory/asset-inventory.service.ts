import { Injectable } from "@nestjs/common";

import _fs from "fs";
import path from "path";

import { Observable, of, throwError } from "rxjs";
import { concatMap, mergeMap, map, finalize, catchError } from "rxjs/operators";

import { UpsertAssetInventoryParams, GetAssetInventoryParams, AssetInventoryResponse, Inventory } from "./asset-inventory.service.i";
import { IClient, IClientResponse } from "../postgres/postgres.service.i";
import { PostgresService } from "../postgres/postgres.service";
import { ConfigService } from "../config";
import { LoggerService } from "../logger/logger.service";
import { ErrorCode, BridgeXServerError } from "../utils";

// ------------------------------
export const fs = { ..._fs };
// ------------------------------

@Injectable()
export class AssetInventoryService {
  public readonly sqlDir = path.join(__dirname, `../../assets/sql`);

  public constructor(public postgres: PostgresService, public configService: ConfigService, public logger: LoggerService) {}

  public upsertAssetInventory$(params: UpsertAssetInventoryParams): Observable<null> {
    const sqlPath = {
      inventoryTable: {
        upsert: `${this.sqlDir}/upsert-asset-inventory.sql`,
      },
    };

    const placeHolder = {
      inventoryTable: {
        upsert: [params.typeId, params.assetId, JSON.stringify(params.units)],
      },
    };

    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(concatMap(() => client.queryByFile$(sqlPath.inventoryTable.upsert, placeHolder.inventoryTable.upsert)));

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public getAssetsInventory$(params: GetAssetInventoryParams): Observable<AssetInventoryResponse> {
    const sqlPath = `${this.sqlDir}/select-assets-inventory.sql`;
    const placeHolder = [params.typeId, params.assetId];
    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(concatMap(() => client.queryByFile$<Inventory[]>(sqlPath, placeHolder)));

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => transaction$(client).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<Inventory>) => {
        if (res.count < 1) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "Specified asset can't be found");
        }

        return {
          typeId: params.typeId,
          assetId: params.assetId,
          subAssets: res.records.filter((record) => record.typeId !== params.typeId && record.assetId !== params.assetId),
        };
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }
}
