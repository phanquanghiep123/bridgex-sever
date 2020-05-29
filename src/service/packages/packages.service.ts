import { Injectable } from "@nestjs/common";
import _path from "path";
import { Observable, throwError, from, of } from "rxjs";
import { mergeMap, finalize, catchError, map, concatMap, toArray } from "rxjs/operators";
import { readFileSync } from "fs";

import {
  UpdateStatusParams,
  InsertPackageParams,
  UpdatePackageParams,
  Package,
  GetPackageParams,
  PackageRecord,
  UpdateMetadataParams,
  GetPackageStatusParams,
  PackageStatus,
  EPackageStatus,
  PackageName,
} from "./packages.service.i";
import { IClient, IClientResponse, PostgresService } from "../postgres";
import { ConfigService } from "../config";
import { LoggerService } from "../logger";
import { ErrorCode, BridgeXServerError } from "../utils";

// ------------------------------
export const path = { ..._path };
export const externals = { readFileSync };
// ------------------------------

@Injectable()
export class PackagesService {
  public readonly sqlDir = path.join(__dirname, `../../assets/sql`);

  public constructor(public postgres: PostgresService, public configService: ConfigService, public logger: LoggerService) {}

  public getPackageWithoutElements$(packageId: string): Observable<Package> {
    const sqlPath = `${this.sqlDir}/select-package-without-elements.sql`;

    const placeHolder = [packageId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$<Package>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<Package>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified package is not found");
        }
        if (res.count > 1) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified package isn't unique");
        }

        return res.records[0];
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public getPackagesStatus$(params: GetPackageStatusParams[]): Observable<PackageStatus[]> {
    if (params.length === 0) {
      return of([]);
    }

    const sqlPath = `${this.sqlDir}/select-packages-status.sql`;

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) =>
        from(params).pipe(
          concatMap((packageStatus: GetPackageStatusParams) => {
            const placeHolder = [packageStatus.packageId];
            return client.queryByFile$<PackageStatus>(sqlPath, placeHolder).pipe(
              map((res: IClientResponse<PackageStatus>) => {
                if (res.count === 0) {
                  return {
                    packageId: packageStatus.packageId,
                    status: EPackageStatus.Failure,
                  };
                } else {
                  return res.records[0];
                }
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

  public insertPackage$(params: InsertPackageParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/insert-package.sql`;
    const placeHolder = [
      params.packageId,
      params.name,
      params.status,
      params.comment,
      params.uploadBy,
      params.summary,
      params.description,
      params.model,
      params.memo,
      params.bucketName,
      params.objectName,
      params.ftpFilePath,
    ];

    const transaction$ = (client: IClient): Observable<null> => client.queryByFile$<any>(sqlPath, placeHolder).pipe(map(() => null));

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public updateStatus$(params: UpdateStatusParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-package.sql`;

    const placeHolder = [
      params.packageId,
      params.status,
      null, // summary,
      null, // description,
      null, // model,
      null, // memo,
      null, // ftpFilePath,
      false, // deleteFlag,
    ];

    const transaction$ = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((res: IClientResponse<any>) => {
          if (res.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified package is not found");
          }
          if (res.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified package is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public updatePackage$(params: UpdatePackageParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-package.sql`;

    const placeHolder = [
      params.packageId,
      null, // status
      null, // summary,
      null, // description,
      null, // model,
      params.memo,
      null, // ftpFilePath,
      false, // deleteFlag
    ];

    const transaction$ = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((res: IClientResponse<any>) => {
          if (res.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified package is not found");
          }
          if (res.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified package is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public get$(params: GetPackageParams): Observable<PackageRecord[]> {
    const sqlPath = `${this.sqlDir}/select-package.sql`;

    const placeHolder = [params.limit, params.offset, params.status, params.text, `${params.sortName} ${params.sort}`];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$<PackageRecord>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<PackageRecord>) => {
        return res.records;
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public getMany$(packageIds: string[]): Observable<PackageName[]> {
    if (!packageIds || !packageIds.length) {
      return of([]);
    }

    // please replace sql if bulk getMany is needed
    // currently we only need name and id.  by kento ueda @2020-04-13
    const sqlPath = path.join(this.sqlDir, "select-package-names.sql");
    const sqlBase = externals.readFileSync(sqlPath, "utf8");

    const whereStatement = packageIds.map((_, index) => `packages.package_id = $${index + 1}`).join(" OR ");
    const wherePlaceholder = "${WHERE_PLACEHOLDER}";

    const sql = sqlBase.replace(wherePlaceholder, whereStatement);

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.query$<PackageName>(sql, packageIds).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<PackageName>) => res.records),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public updataMetadata$(params: UpdateMetadataParams): Observable<null> {
    const sqlPath = {
      packagesTable: {
        update: `${this.sqlDir}/update-package.sql`,
      },
      elementsTable: {
        insert: `${this.sqlDir}/insert-package-elements.sql`,
      },
    };

    const placeHolder = {
      package: [
        params.packageId,
        params.status,
        params.summary,
        params.description,
        params.model,
        null, // memo
        params.ftpFilePath,
        false, // deleteFlag
      ],
      elements: params.elements.reduce((r, element) => {
        r.push([params.packageId, element.key, element.value]);
        return r;
      }, [] as any[][]),
    };

    const transaction$ = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath.packagesTable.update, placeHolder.package).pipe(
        map((res: IClientResponse<any>) => {
          if (res.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified package is not found");
          }
          if (res.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified package is a duplicate");
          }
          return null;
        }),
        concatMap(() =>
          from(placeHolder.elements).pipe(
            concatMap((element) => client.queryByFile$(sqlPath.elementsTable.insert, element)),
            toArray(),
          ),
        ),
        map(() => null),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public deletePackage$(packageId: string): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-package.sql`;
    const placeHolder = [
      packageId,
      null, // status
      null, // summary,
      null, // description,
      null, // model,
      null, // memo,
      null, // ftpFilePath,
      true, // deleteFlag
    ];
    const transaction$ = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((res: IClientResponse<any>) => {
          if (res.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified package is not found");
          }
          if (res.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified package is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }
}
