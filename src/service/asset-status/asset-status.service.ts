import { Injectable } from "@nestjs/common";

import _fs from "fs";
import path from "path";

import { Observable, throwError, of, from } from "rxjs";
import { mergeMap, catchError, map, finalize, concatMap, toArray } from "rxjs/operators";

import {
  Asset,
  AssetStatus,
  GetAssetParams,
  UpsertAssetStatusParams,
  AssetStatusRecord,
  UpsertNoteParams,
  UpsertConnectionParams,
  GetAssetsParams,
  AssetRecord,
  AssetKey,
  EAssetStatus,
  GetAssetAvailability,
  GetAssetAvailabilityRecord,
} from "./asset-status.service.i";
import { IClient, IClientResponse } from "../postgres/postgres.service.i";
import { PostgresService } from "../postgres/postgres.service";
import { ConfigService } from "../config";
import { LoggerService } from "../logger/logger.service";
import { ErrorCode, BridgeXServerError } from "../utils";
import { GuardAssetStatusResponse } from "./asset-status.service.guard";

// ------------------------------
export const fs = { ..._fs };
// ------------------------------

@Injectable()
export class AssetStatusService {
  public readonly sqlDir = path.join(__dirname, `../../assets/sql`);

  public constructor(
    public postgres: PostgresService,
    public configService: ConfigService,
    public logger: LoggerService,
    private guard: GuardAssetStatusResponse,
  ) {}

  public upsertAssetStatus$(params: UpsertAssetStatusParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/upsert-asset-status.sql`;

    const placeHolder = [params.typeId, params.assetId, params.status, params.errorCode || ""];

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), (client: IClient) =>
      this.postgres.transactBySql$(client, sqlPath, placeHolder),
    );
  }

  public upsertNote$(params: UpsertNoteParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/upsert-asset-note.sql`;

    const placeHolder = [params.typeId, params.assetId, params.note];

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), (client: IClient) =>
      this.postgres.transactBySql$(client, sqlPath, placeHolder),
    );
  }

  public upsertConnection$(params: UpsertConnectionParams): Observable<null> {
    const sqlPath = {
      elementsTable: {
        upsert: `${this.sqlDir}/upsert-asset-ipaddress.sql`,
      },
      statusTable: {
        upsert: `${this.sqlDir}/upsert-asset-status.sql`,
      },
    };
    const placeHolder = {
      elementsTable: [params.typeId, params.assetId, params.ipAddress],
      statusTable: [
        params.typeId,
        params.assetId,
        params.status,
        "", // error_code
      ],
    };

    const transaction$ = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath.elementsTable.upsert, placeHolder.elementsTable).pipe(
        concatMap(() => client.queryByFile$<any>(sqlPath.statusTable.upsert, placeHolder.statusTable)),
        map(() => null),
        catchError((err) => throwError(ErrorCode.categorize(err))),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public get$(params: GetAssetParams): Observable<AssetStatus> {
    const sqlPath = `${this.sqlDir}/select-asset-status.sql`;

    const placeHolder = [params.typeId, params.assetId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$<AssetStatusRecord>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<AssetStatusRecord>) => {
        const rootAssets: AssetStatusRecord[] = res.records.filter((record) => !record.isSubAsset);
        const subAssets: AssetStatusRecord[] = res.records.filter((record) => record.isSubAsset);

        if (rootAssets.length < 1) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified parent asset can't be found");
        }

        if (rootAssets.length > 1) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified composite asset must be single");
        }

        return {
          ...this.convertToAssetStatus(rootAssets[0]),
          subAssets: subAssets.map((subAsset) => this.convertToAssetStatus(subAsset)),
        };
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public getOwnerOrThis$(params: AssetKey): Observable<AssetKey> {
    const sqlPath = `${this.sqlDir}/select-owner-asset.sql`;

    const placeHolder = [params.typeId, params.assetId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$<AssetKey>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<AssetKey>) => {
        if (res.count > 1) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified composite asset isn't unique");
        }
        if (res.count === 1) {
          return {
            typeId: res.records[0].typeId,
            assetId: res.records[0].assetId,
          };
        }

        return {
          typeId: params.typeId,
          assetId: params.assetId,
        };
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public getMany$(params: GetAssetParams[]): Observable<AssetStatus[]> {
    if (params.length === 0) {
      return of([]);
    }

    const sqlPath = `${this.sqlDir}/select-asset-status.sql`;

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) =>
        from(params).pipe(
          mergeMap((asset: GetAssetParams) => {
            const placeHolder = [asset.typeId, asset.assetId];

            return client.queryByFile$<AssetStatusRecord>(sqlPath, placeHolder).pipe(
              map((res: IClientResponse<AssetStatusRecord>) => {
                const rootAssets: AssetStatusRecord[] = res.records.filter((record) => !record.isSubAsset);

                if (rootAssets.length !== 1) {
                  return {
                    typeId: asset.typeId,
                    assetId: asset.assetId,
                    status: EAssetStatus.Missing,
                    subAssets: [],
                  };
                }

                const subAssets: AssetStatusRecord[] = res.records.filter((record) => record.isSubAsset);

                return {
                  ...this.convertToAssetStatus(rootAssets[0]),
                  subAssets: subAssets.map((subAsset) => this.convertToAssetStatus(subAsset)),
                };
              }),
            );
          }),
          toArray(),
          finalize(() => client.disconnect()),
        ),
      ),
      catchError((err) => {
        this.logger.info(err);
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  /**
   * Get asset detail
   */
  public getAsset$(params: GetAssetParams): Observable<Asset> {
    const sqlPath = `${this.sqlDir}/select-asset.sql`;
    const placeHolder = [params.typeId, params.assetId];
    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(concatMap(() => client.queryByFile$<Asset>(sqlPath, placeHolder)));
    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => transaction$(client).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<Asset>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "Specified asset can't be found");
        }

        if (!this.guard.isGetAssetResponse(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }

        return res.records[0];
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public getAssets$(params: GetAssetsParams): Observable<AssetRecord[]> {
    // TODO:: check isFilter !!(params.isFilter)
    const sqlPath = `${this.sqlDir}/select-assets.sql`;
    const placeHolder = [
      params.typeId,
      params.organization,
      params.location,
      params.region,
      params.text,
      params.limit,
      params.offset,
      params.status,
      `${params.sortName} ${params.sort}`,
    ];
    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(concatMap(() => client.queryByFile$<AssetRecord>(sqlPath, placeHolder)));
    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => transaction$(client).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<AssetRecord>) => {
        if (!this.guard.isGetAssetsResponse(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }
        return res.records;
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public convertToAssetStatus(record: AssetStatusRecord): AssetStatus {
    return {
      typeId: record.typeId,
      assetId: record.assetId,
      status: record.status,
      errorCode: record.errorCode ? record.errorCode : undefined,
    };
  }

  public getAssetAvailability$(): Observable<GetAssetAvailability[]> {
    const sqlPath = `${this.sqlDir}/select-asset-availability.sql`;

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$<GetAssetAvailabilityRecord>(sqlPath).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<GetAssetAvailabilityRecord>) => {
        if (!this.guard.isGetAssetAvailabilityRecords(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }
        return res.records.map(
          (record: GetAssetAvailabilityRecord): GetAssetAvailability => {
            return {
              status: record.status,
              count: Number(record.count),
            };
          },
        );
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }
}
