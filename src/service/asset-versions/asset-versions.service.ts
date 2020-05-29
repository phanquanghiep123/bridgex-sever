import { Injectable } from "@nestjs/common";
import path from "path";
import { Observable, throwError } from "rxjs";
import { mergeMap, catchError, map, finalize } from "rxjs/operators";
import { IClient, IClientResponse } from "../postgres/postgres.service.i";
import { PostgresService } from "../postgres/postgres.service";
import { ConfigService } from "../config";

import {
  GetParams,
  AssetVersion,
  AssetIdentification,
  AssetVersionRecord,
  VersionItem,
  PostParams,
  AssetSubparts,
} from "./asset-versions.service.i";
import { HttpClientService } from "../http-client";
import { LoggerService } from "../logger";
import { ErrorCode, BridgeXServerError } from "../utils";
import { AxiosRequestConfig } from "axios";
import { GuardAssetVersionsResponse } from "./asset-versions.service.guard";

// ------------------------------------------------------

export class VersionsConverter {
  public convertToAssetVersion(input: AssetVersionRecord[]): AssetVersion[] {
    const assets: AssetIdentification[] = this.convertToUniqueAsset(input);
    const converted: AssetVersion[] = [];
    assets.map((asset: AssetIdentification) => {
      converted.push({
        ...asset,
        versions: input
          .filter((record) => record.assetId === asset.assetId && record.typeId === asset.typeId)
          .map(
            (record: AssetVersionRecord): VersionItem => ({
              name: record.subpartName,
              version: record.subpartVersion,
            }),
          ),
      });
    });

    return converted;
  }

  public convertToUniqueAsset(records: AssetVersionRecord[]): AssetIdentification[] {
    const assets: AssetIdentification[] = records.map(
      (asset: AssetVersionRecord): AssetIdentification => ({
        typeId: asset.typeId,
        assetId: asset.assetId,
      }),
    );

    return [...new Set(assets.map((item) => JSON.stringify(item)))].map((i) => JSON.parse(i));
  }
}

@Injectable()
export class AssetVersionsService {
  public readonly sqlDir = path.join(__dirname, `../../assets/sql`);
  public constructor(
    public postgres: PostgresService,
    private configService: ConfigService,
    private httpClient: HttpClientService,
    private logger: LoggerService,
    private guard: GuardAssetVersionsResponse,
  ) {}

  public get$(params: GetParams): Observable<AssetVersion[]> {
    const sqlPath = `${this.sqlDir}/select-asset-versions.sql`;
    const placeHolder = [params.typeId, params.assetId];
    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) =>
        client.queryByFile$<AssetVersionRecord>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect())),
      ),
      map((res: IClientResponse<AssetVersionRecord>) => {
        if (!this.guard.isGetAssetVersionsResponse(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }

        if (res.count < 1) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "Specified asset can't be found");
        }

        const subAssets = res.records.filter((asset) => asset.typeId !== params.typeId && asset.assetId !== params.assetId);

        return new VersionsConverter().convertToAssetVersion(subAssets);
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public post$(params: PostParams): Observable<null> {
    const endPoint = `${this.configService.gConnectConfig().dasBaseUrl}/types/:typeId/assets/:assetId/subparts`
      .replace(":typeId", encodeURIComponent(params.typeId))
      .replace(":assetId", encodeURIComponent(params.assetId));
    const data: AssetSubparts[] = params.subparts;
    const config: AxiosRequestConfig = {};

    return this.httpClient.post$(endPoint, data, config).pipe(
      map(() => null),
      catchError((e) => {
        this.logger.error(e);
        return throwError(ErrorCode.categorize(e));
      }),
    );
  }
}
