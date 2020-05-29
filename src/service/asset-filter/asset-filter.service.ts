import { Injectable } from "@nestjs/common";

import _fs from "fs";
import path from "path";

import { Observable, throwError, of } from "rxjs";
import { mergeMap, catchError, map, finalize, concatMap } from "rxjs/operators";

import { GetLocationParams, AssetTypeRecord, RegionRecord, CustomerRecord, LocationRecord } from "./asset-filter.service.i";
import { IClient, IClientResponse } from "../postgres/postgres.service.i";
import { PostgresService } from "../postgres/postgres.service";
import { ConfigService } from "../config";
import { LoggerService } from "../logger/logger.service";
import { ErrorCode, BridgeXServerError } from "../utils";
import { GuardAssetFilterResponse } from "./asset-filter.service.guard";

// ------------------------------
export const fs = { ..._fs };
// ------------------------------

@Injectable()
export class AssetFilterService {
  public readonly sqlDir = path.join(__dirname, `../../assets/sql`);

  public constructor(
    public postgres: PostgresService,
    public configService: ConfigService,
    public logger: LoggerService,
    private guard: GuardAssetFilterResponse,
  ) {}

  public getAssetType$(): Observable<AssetTypeRecord[]> {
    const sqlPath = `${this.sqlDir}/select-asset-type-master-asset.sql`;
    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(concatMap(() => client.queryByFile$<AssetTypeRecord>(sqlPath)));
    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => transaction$(client).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<AssetTypeRecord>) => {
        if (res.count === 0) {
          return [];
        }
        if (!this.guard.isGetAssetTypeResponse(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }
        return res.records;
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public getRegion$(): Observable<RegionRecord[]> {
    const sqlPath = `${this.sqlDir}/select-region_master.sql`;
    const transaction$ = (client: IClient): Observable<any> => of(null).pipe(concatMap(() => client.queryByFile$<RegionRecord>(sqlPath)));
    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => transaction$(client).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<RegionRecord>) => {
        if (res.count === 0) {
          return [];
        }
        if (!this.guard.isGetRegionResponse(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }
        return res.records;
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public getCustomer$(): Observable<CustomerRecord[]> {
    const sqlPath = `${this.sqlDir}/select-company.sql`;
    const transaction$ = (client: IClient): Observable<any> => of(null).pipe(concatMap(() => client.queryByFile$<CustomerRecord>(sqlPath)));
    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => transaction$(client).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<CustomerRecord>) => {
        if (res.count === 0) {
          return [];
        }
        if (!this.guard.isGetCustomerResponse(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }
        return res.records;
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public getLocation$(params: GetLocationParams): Observable<LocationRecord[]> {
    const sqlPath = `${this.sqlDir}/select-company-locations.sql`;
    const placeHolder = [params.customerId];
    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(concatMap(() => client.queryByFile$<LocationRecord>(sqlPath, placeHolder)));
    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => transaction$(client).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<LocationRecord>) => {
        if (res.count === 0) {
          return [];
        }
        if (!this.guard.isGetLocationResponse(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }
        return res.records;
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }
}
