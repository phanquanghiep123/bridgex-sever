import { Injectable } from "@nestjs/common";
import _path from "path";
import fs from "fs";
import moment from "moment";
import { Observable, throwError, of, from } from "rxjs";
import { mergeMap, finalize, catchError, map, concatMap, toArray, switchMap } from "rxjs/operators";
import { IClient, IClientResponse, PostgresService } from "../postgres";
import { ConfigService } from "../config";
import { LoggerService } from "../logger";
import { ErrorCode, BridgeXServerError } from "../utils";
import {
  ETaskStatus,
  ETaskAssetStatus,
  GetTasks,
  GetDepolymentTasksParam,
  DownloadPackageTask,
  DownloadPackageTaskAsset,
  InsertDownloadPackageTaskParams,
  UpdateDownloadPackageTask,
  UpdateDownloadPackageTaskAsset,
  GetLogTaskAssetParam,
  LogTask,
  LogTaskRetrievelog,
  LogTaskAsset,
  InsertLogTaskParams,
  InsertRebootSelfTestTaskParams,
  InsertLogTaskRetrievelogParams,
  InsertRetrievelogParams,
  UpdateLogTask,
  UpdateLogTaskAsset,
  QueriedGetAssetLogUrl,
  GetAssetLogFilePath,
  BulkGetRetrieveLogParams,
  RetrieveLogResultRecord,
  TaskAssetKey,
  InsertInstallTaskParams,
  InsertDeploymentRelationParams,
  DownloadPackageTaskRecord,
  InstallTask,
  InstallTaskRecord,
  InstallTaskAsset,
  UpdateInstallTaskAsset,
  UpdateInstallTask,
  GetTask,
  TaskStatus,
  GetTaskStatusParams,
  GetRebootTaskAssetParam,
  RebootTask,
  RebootTaskAsset,
  RebootTaskReboot,
  GetSelfTestTaskAssetParam,
  SelfTestTask,
  SelfTestTaskAsset,
  SelfTestTaskSelfTest,
  InsertRebootSelfTestParams,
  UpdateRebootSelfTestTask,
  UpdateRebootSelfTestTaskAsset,
  UpdateRebootTaskSubAsset,
  UpdateSelfTestTaskSubAsset,
} from "./tasks.service.i";
import { GuardTasksResponse } from "./tasks.service.guard";
import { Request } from "express";

// ------------------------------
export const path = { ..._path };
export const externals = {
  readFileSync: fs.readFileSync,
};
// ------------------------------

@Injectable()
export class TasksService {
  public readonly sqlDir = path.join(__dirname, `../../assets/sql`);
  private readonly dateFormat = "YYYY-MM-DD HH:mm:ss";

  public constructor(
    public postgres: PostgresService,
    public configService: ConfigService,
    public logger: LoggerService,
    private guard: GuardTasksResponse,
  ) {}

  public get$(params: GetDepolymentTasksParam): Observable<GetTasks[]> {
    const sqlPath = `${this.sqlDir}/select-tasks.sql`;

    const placeHolder = [params.limit, params.offset, params.text, `${params.sortName} ${params.sort}`];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$<GetTasks>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<GetTasks>) => {
        if (res.count === 0) {
          return [];
        }
        if (!this.guard.isGetTasksResponse(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }

        return res.records;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getTask$(params: { taskId: string }): Observable<GetTask> {
    const sqlPath = `${this.sqlDir}/select-task.sql`;

    const placeHolder = [params.taskId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$<GetTask>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<GetTask>) => {
        if (res.count !== 1) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task can't be found");
        }
        if (!this.guard.isGetTaskResponse(res.records[0])) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }

        return res.records[0];
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  // Currently, this function's sql related only between Install and DownloadPackage
  // In the future, If any related task is added, this function will be abstructed
  public getRelatedTaskId$(taskId: string): Observable<string> {
    const sqlPath = `${this.sqlDir}/select-related-task-id.sql`;

    const placeHolder = [taskId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) =>
        client.queryByFile$<{ relatedTaskId: string }>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect())),
      ),
      map((res: IClientResponse<{ relatedTaskId: string }>) => {
        if (res.count !== 1) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }

        return res.records[0].relatedTaskId;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getDownloadPackageTask$(taskId: string): Observable<DownloadPackageTask> {
    const sqlPath = `${this.sqlDir}/select-task-download-package.sql`;

    const placeHolder = [taskId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) =>
        client.queryByFile$<DownloadPackageTaskRecord>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect())),
      ),
      map((res: IClientResponse<DownloadPackageTaskRecord>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }

        const task: DownloadPackageTask = {
          id: res.records[0].taskId,
          name: res.records[0].name,
          status: res.records[0].status as ETaskStatus,
          createdBy: res.records[0].createdBy,
          createdAt: moment.utc(res.records[0].createdAt),
          updatedAt: moment.utc(res.records[0].updatedAt),
          package: {
            id: res.records[0].packageId,
            name: res.records[0].packageName,
            model: res.records[0].packageModel,
            ftpFilePath: res.records[0].packageFtpFilePath,
          },
          assets: res.records.map(
            (record): DownloadPackageTaskAsset => {
              return {
                typeId: record.assetTypeId,
                assetId: record.assetId,
                status: record.assetStatus as ETaskAssetStatus,
                startedAt: moment.utc(record.assetStartedAt),
                updatedAt: moment.utc(record.assetUpdatedAt),
              };
            },
          ),
        };

        return task;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getInstallTask$(taskId: string): Observable<InstallTask> {
    const sqlPath = `${this.sqlDir}/select-task-install.sql`;

    const placeHolder = [taskId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$<InstallTaskRecord>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<InstallTaskRecord>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }

        const task: InstallTask = {
          id: res.records[0].taskId,
          name: res.records[0].name,
          status: res.records[0].status as ETaskStatus,
          createdBy: res.records[0].createdBy,
          createdAt: moment.utc(res.records[0].createdAt),
          updatedAt: moment.utc(res.records[0].updatedAt),
          package: {
            id: res.records[0].packageId,
            name: res.records[0].packageName,
            model: res.records[0].packageModel,
          },
          assets: res.records.map(
            (record): InstallTaskAsset => {
              return {
                typeId: record.assetTypeId,
                assetId: record.assetId,
                status: record.assetStatus as ETaskAssetStatus,
                startedAt: moment.utc(record.assetStartedAt),
                updatedAt: moment.utc(record.assetUpdatedAt),
              };
            },
          ),
        };

        return task;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getLogTask$(taskId: string): Observable<LogTask> {
    const sqlPath = `${this.sqlDir}/select-task-log.sql`;

    const placeHolder = [taskId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<any>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }
        const log: LogTask = {
          id: +res.records[0].id,
          taskId: res.records[0].taskId,
          status: res.records[0].status,
          logType: res.records[0].logType,
          memo: res.records[0].memo,
          createdAt: res.records[0].createdAt,
          updatedAt: res.records[0].updatedAt,
          logs: res.records.map(
            (record): LogTaskRetrievelog => {
              return {
                id: +record.id,
                taskId: record.taskId,
                typeId: record.logAssetTypeId,
                assetId: record.logAssetId,
                filePath: record.logFtpFilePath,
                status: record.logStatus,
                errorCode: record.logErrorCode,
                errorMessage: record.logErrorMsg,
                createdAt: record.logCreatedAt,
              };
            },
          ),
          assets: res.records.map(
            (record): LogTaskAsset => {
              return {
                id: +record.id,
                taskId: record.taskId,
                typeId: record.assetTypeId,
                assetId: record.assetId,
                status: record.assetStatus,
                startedAt: record.assetStartedAt,
                updatedAt: record.assetUpdatedAt,
              };
            },
          ),
        };
        return log;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getLogTaskAsset$(params: GetLogTaskAssetParam): Observable<LogTaskAsset> {
    const sqlPath = `${this.sqlDir}/select-task-log-asset.sql`;

    const placeHolder = [params.taskId, params.typeId, params.assetId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<any>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }
        const taskAsset: LogTaskAsset = {
          id: res.records[0].id,
          taskId: res.records[0].taskId,
          typeId: res.records[0].typeId,
          assetId: res.records[0].assetId,
          status: res.records[0].status,
          startedAt: res.records[0].startedAt,
          updatedAt: res.records[0].updatedAt,
        };

        return taskAsset;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getRebootTask$(taskId: string): Observable<RebootTask> {
    const sqlPath = `${this.sqlDir}/select-task-reboot.sql`;

    const placeHolder = [taskId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<any>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }
        const reboot: RebootTask = {
          id: +res.records[0].id,
          taskId: res.records[0].taskId,
          status: res.records[0].status,
          createdBy: res.records[0].createdBy,
          memo: res.records[0].memo,
          createdAt: res.records[0].createdAt,
          updatedAt: res.records[0].updatedAt,
          assets: res.records.map(
            (record): RebootTaskAsset => {
              return {
                id: +record.id,
                taskId: record.taskId,
                typeId: record.assetTypeId,
                assetId: record.assetId,
                status: record.assetStatus,
                startedAt: record.assetStartedAt,
                updatedAt: record.assetUpdatedAt,
              };
            },
          ),
          reboots: res.records.map(
            (record): RebootTaskReboot => {
              return {
                id: +record.id,
                taskId: record.taskId,
                typeId: record.rebootTypeId,
                assetId: record.rebootAssetId,
                subTypeId: record.rebootSubTypeId,
                subAssetId: record.rebootSubAssetId,
                status: record.rebootStatus,
                errorCode: record.rebootErrorCode,
                errorMessage: record.rebootErrorMsg,
                createdAt: record.rebootCreatedAt,
                updatedAt: record.rebootUpdatedAt,
              };
            },
          ),
        };
        return reboot;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getRebootTaskAsset$(params: GetRebootTaskAssetParam): Observable<RebootTaskAsset> {
    const sqlPath = `${this.sqlDir}/select-task-reboot-asset.sql`;

    const placeHolder = [params.taskId, params.typeId, params.assetId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<any>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }
        const taskAsset: RebootTaskAsset = {
          id: res.records[0].id,
          taskId: res.records[0].taskId,
          typeId: res.records[0].typeId,
          assetId: res.records[0].assetId,
          status: res.records[0].status,
          startedAt: res.records[0].startedAt,
          updatedAt: res.records[0].updatedAt,
        };

        return taskAsset;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getSelfTestTask$(taskId: string): Observable<SelfTestTask> {
    const sqlPath = `${this.sqlDir}/select-task-selftest.sql`;

    const placeHolder = [taskId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<any>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }
        const selftest: SelfTestTask = {
          id: +res.records[0].id,
          taskId: res.records[0].taskId,
          status: res.records[0].status,
          createdBy: res.records[0].createdBy,
          memo: res.records[0].memo,
          createdAt: res.records[0].createdAt,
          updatedAt: res.records[0].updatedAt,
          assets: res.records.map(
            (record): SelfTestTaskAsset => {
              return {
                id: +record.id,
                taskId: record.taskId,
                typeId: record.assetTypeId,
                assetId: record.assetId,
                status: record.assetStatus,
                startedAt: record.assetStartedAt,
                updatedAt: record.assetUpdatedAt,
              };
            },
          ),
          selftests: res.records.map(
            (record): SelfTestTaskSelfTest => {
              return {
                id: +record.id,
                taskId: record.taskId,
                typeId: record.selftestTypeId,
                assetId: record.selftestAssetId,
                subTypeId: record.selftestSubTypeId,
                subAssetId: record.selftestSubAssetId,
                status: record.selftestStatus,
                errorCode: record.selftestErrorCode,
                errorMessage: record.selftestErrorMsg,
                createdAt: record.selftestCreatedAt,
                updatedAt: record.selftestUpdatedAt,
              };
            },
          ),
        };
        return selftest;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getSelfTestTaskAsset$(params: GetSelfTestTaskAssetParam): Observable<SelfTestTaskAsset> {
    const sqlPath = `${this.sqlDir}/select-task-selftest-asset.sql`;

    const placeHolder = [params.taskId, params.typeId, params.assetId];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.queryByFile$(sqlPath, placeHolder).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<any>) => {
        if (res.count === 0) {
          throw new BridgeXServerError(ErrorCode.NOT_FOUND, "not found");
        }
        const taskAsset: SelfTestTaskAsset = {
          id: res.records[0].id,
          taskId: res.records[0].taskId,
          typeId: res.records[0].typeId,
          assetId: res.records[0].assetId,
          status: res.records[0].status,
          startedAt: res.records[0].startedAt,
          updatedAt: res.records[0].updatedAt,
        };

        return taskAsset;
      }),
      catchError((err) => {
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public insertDownloadPackageTask$(params: InsertDownloadPackageTaskParams): Observable<null> {
    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(
        switchMap(() => {
          const sqlPath = `${this.sqlDir}/insert-task-download-package.sql`;
          const placeHolder = [params.taskId, params.name, params.packages[0].packageId, params.status, params.createdBy];

          return client.queryByFile$<any>(sqlPath, placeHolder);
        }),
        switchMap(() => {
          if (params.assets.length < 1) {
            return of(null);
          }

          return from(params.assets).pipe(
            concatMap((asset) => {
              const sqlPath = `${this.sqlDir}/insert-task-download-package-assets.sql`;
              const placeHolder = [params.taskId, asset.assetId, asset.typeId, asset.status];

              return client.queryByFile$(sqlPath, placeHolder);
            }),
            toArray(),
          );
        }),
        map(() => null),
        catchError((e: any) => throwError(ErrorCode.categorize(e))),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public insertInstallTask$(params: InsertInstallTaskParams): Observable<null> {
    const transaction$ = (client: IClient): Observable<null> =>
      of(null).pipe(
        switchMap(() => {
          const sqlPath = `${this.sqlDir}/insert-task-install.sql`;
          const placeHolder = [params.taskId, params.name, params.packages[0].packageId, params.status, params.createdBy];

          return client.queryByFile$<any>(sqlPath, placeHolder);
        }),
        switchMap(() => {
          if (params.assets.length < 1) {
            return of(null);
          }

          return from(params.assets).pipe(
            concatMap((asset) => {
              const sqlPath = `${this.sqlDir}/insert-task-install-assets.sql`;
              const placeHolder = [params.taskId, asset.assetId, asset.typeId, asset.status];

              return client.queryByFile$(sqlPath, placeHolder);
            }),
            toArray(),
          );
        }),
        map(() => null),
        catchError((e: any) => throwError(ErrorCode.categorize(e))),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public insertDeploymentRelation$(params: InsertDeploymentRelationParams): Observable<null> {
    const transaction$ = (client: IClient): Observable<null> =>
      of(null).pipe(
        switchMap(() => {
          const sqlPath = `${this.sqlDir}/insert-task-relation.sql`;
          const placeHolder = [params.downloadPackageId, params.installId];

          return client.queryByFile$<any>(sqlPath, placeHolder);
        }),
        map(() => null),
        catchError((e: any) => throwError(ErrorCode.categorize(e))),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public insertLogTask$(params: InsertLogTaskParams): Observable<null> {
    const sqlPath = {
      taskLogTable: {
        insert: `${this.sqlDir}/insert-task-log.sql`,
      },
      taskLogAssetsTable: {
        insert: `${this.sqlDir}/insert-task-log-assets.sql`,
      },
    };

    const placeHolder = {
      taskLogTable: {
        insert: [params.taskId, params.status, params.logType, params.createdBy, params.memo],
      },
      taskLogAssetsTable: {
        insert: params.assets.map((asset) => [params.taskId, asset.assetId, asset.typeId, asset.status]),
      },
    };
    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(
        concatMap(() => client.queryByFile$<any>(sqlPath.taskLogTable.insert, placeHolder.taskLogTable.insert)),
        concatMap(() =>
          from(placeHolder.taskLogAssetsTable.insert).pipe(
            concatMap((asset) => client.queryByFile$(sqlPath.taskLogAssetsTable.insert, asset)),
          ),
        ),
        toArray(),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public insertRebootSelfTestTask$(req: Request, params: InsertRebootSelfTestTaskParams): Observable<null> {
    const sqlPath = {
      taskTable: {
        insert: req.path.match(/reboot/) ? `${this.sqlDir}/insert-task-reboot.sql` : `${this.sqlDir}/insert-task-selftest.sql`,
      },
      taskAssetsTable: {
        insert: req.path.match(/reboot/)
          ? `${this.sqlDir}/insert-task-reboot-assets.sql`
          : `${this.sqlDir}/insert-task-selftest-assets.sql`,
      },
    };

    const placeHolder = {
      taskTable: {
        insert: [params.taskId, params.status, params.createdBy, params.memo],
      },
      taskAssetsTable: {
        insert: params.assets.map((asset) => [params.taskId, asset.assetId, asset.typeId, asset.status]),
      },
    };
    const transaction$ = (client: IClient): Observable<any> =>
      of(null).pipe(
        concatMap(() => client.queryByFile$<any>(sqlPath.taskTable.insert, placeHolder.taskTable.insert)),
        concatMap(() =>
          from(placeHolder.taskAssetsTable.insert).pipe(concatMap((asset) => client.queryByFile$(sqlPath.taskAssetsTable.insert, asset))),
        ),
        toArray(),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction$);
  }

  public insertTaskLogRetrievelog$(params: InsertLogTaskRetrievelogParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/insert-task-log-retrievelogs.sql`;

    const placeHolder = [params.taskId, params.assetId, params.typeId, params.filePath];

    const transaction = (client: IClient): Observable<null> => client.queryByFile$<any>(sqlPath, placeHolder).pipe(map(() => null));

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public bulkGetRetrieveLogResults$(params: BulkGetRetrieveLogParams): Observable<RetrieveLogResultRecord[]> {
    if (!params || !params.length) {
      return of([]);
    }

    const sqlPath = path.join(this.sqlDir, "bulk-select-task-log-retrievelogs.sql");
    const sqlBase = externals.readFileSync(sqlPath, "utf8");

    const wherePlaceholder = "${WHERE_PLACEHOLDER}";
    const whereStatement = params
      .map((_, i) => `( tl.task_id = $${i * 3 + 1} AND tlr.type_id = $${i * 3 + 2} AND tlr.asset_id = $${i * 3 + 3} )`)
      .join(" OR ");
    const sql = sqlBase.replace(wherePlaceholder, whereStatement);

    const queryParams: string[] = params.reduce((p, c) => [...p, c.taskId, c.typeId, c.assetId], [] as string[]);

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) => client.query$<RetrieveLogResultRecord>(sql, queryParams).pipe(finalize(() => client.disconnect()))),
      map((res: IClientResponse<RetrieveLogResultRecord>) => res.records),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public insertRetrievelog$(params: InsertRetrievelogParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/insert-retrievelogs.sql`;

    const placeHolder = [params.taskId, params.assetId, params.typeId, params.status, params.errorCode, params.errorMsg];

    const transaction = (client: IClient): Observable<null> => client.queryByFile$<any>(sqlPath, placeHolder).pipe(map(() => null));

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public insertReboot$(params: InsertRebootSelfTestParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/insert-reboots.sql`;

    const placeHolder = [
      params.taskId,
      params.assetId,
      params.typeId,
      params.subAssetId,
      params.subTypeId,
      params.status,
      params.errorCode,
      params.errorMsg,
    ];

    const transaction = (client: IClient): Observable<null> => client.queryByFile$<any>(sqlPath, placeHolder).pipe(map(() => null));

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public insertSelfTest$(params: InsertRebootSelfTestParams): Observable<null> {
    const sqlPath = `${this.sqlDir}/insert-selftests.sql`;

    const placeHolder = [
      params.taskId,
      params.assetId,
      params.typeId,
      params.subAssetId,
      params.subTypeId,
      params.status,
      params.errorCode,
      params.errorMsg,
    ];

    const transaction = (client: IClient): Observable<null> => client.queryByFile$<any>(sqlPath, placeHolder).pipe(map(() => null));

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateDownloadPackageTaskToInprogress$(task: DownloadPackageTask): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-download-package.sql`;

    const placeHolder = [task.id, ETaskAssetStatus.InProgress];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task is a duplicate");
          }
          return null;
        }),
        mergeMap(() =>
          from(task.assets).pipe(
            mergeMap((taskAsset: DownloadPackageTaskAsset) => {
              const params: UpdateDownloadPackageTaskAsset = {
                taskId: task.id,
                typeId: taskAsset.typeId,
                assetId: taskAsset.assetId,
                status: ETaskAssetStatus.InProgress,
                startedAt: moment.utc(),
              };
              return this.updateDownloadPackageTaskAsset$(params);
            }),
            toArray(),
          ),
        ),
        map(() => null),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateDownloadPackageTask$(params: UpdateDownloadPackageTask): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-download-package.sql`;

    const placeHolder = [params.taskId, params.status];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateDownloadPackageTaskAsset$(params: UpdateDownloadPackageTaskAsset): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-download-package-asset.sql`;

    const placeHolder = [
      params.taskId,
      params.typeId,
      params.assetId,
      params.status,
      params.startedAt ? moment(params.startedAt).format(this.dateFormat) : null,
    ];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task asset is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task asset is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateInstallTaskToInprogress$(task: InstallTask): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-install.sql`;

    const placeHolder = [task.id, ETaskAssetStatus.InProgress];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count !== 1) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task is not found");
          }
          return null;
        }),
        mergeMap(() =>
          from(task.assets).pipe(
            mergeMap((taskAsset: DownloadPackageTaskAsset) => {
              const params: UpdateInstallTaskAsset = {
                taskId: task.id,
                typeId: taskAsset.typeId,
                assetId: taskAsset.assetId,
                status: ETaskAssetStatus.InProgress,
                startedAt: moment.utc(),
              };
              return this.updateInstallTaskAsset$(params);
            }),
            toArray(),
          ),
        ),
        map(() => null),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateInstallTask$(params: UpdateInstallTask): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-install.sql`;

    const placeHolder = [params.taskId, params.status];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateInstallTaskAsset$(params: UpdateInstallTaskAsset): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-install-asset.sql`;

    const placeHolder = [
      params.taskId,
      params.typeId,
      params.assetId,
      params.status,
      params.startedAt ? moment(params.startedAt).format(this.dateFormat) : null,
    ];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task asset is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task asset is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateLogTaskToInprogress$(taskId: string): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-log.sql`;

    const placeHolder = [taskId, ETaskAssetStatus.InProgress];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task log is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task log is a duplicate");
          }
          return null;
        }),
        mergeMap(() => this.getLogTask$(taskId)),
        mergeMap((task: LogTask) =>
          from(task.assets).pipe(
            mergeMap((taskAsset: LogTaskAsset) => {
              const params: UpdateLogTaskAsset = {
                taskId: taskAsset.taskId,
                typeId: taskAsset.typeId,
                assetId: taskAsset.assetId,
                status: ETaskAssetStatus.InProgress,
                startedAt: moment.utc(),
              };
              return this.updateLogTaskAsset$(params);
            }),
            toArray(),
          ),
        ),
        map(() => null),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateLogTask$(params: UpdateLogTask): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-log.sql`;

    const placeHolder = [params.taskId, params.status];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task log is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task log is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateLogTaskAsset$(params: UpdateLogTaskAsset): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-log-asset.sql`;

    const placeHolder = [
      params.taskId,
      params.typeId,
      params.assetId,
      params.status,
      params.startedAt ? moment(params.startedAt).format(this.dateFormat) : null,
    ];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task log asset is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task log asset is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public getAssetLogFilePath$(params: GetAssetLogFilePath) {
    const sqlPath = `${this.sqlDir}/select-asset-log-file-path.sql`;
    const placeHolder = [params.taskId, params.typeId, params.assetId];

    return this.postgres.controlTransaction$<IClientResponse<QueriedGetAssetLogUrl>>(
      this.configService.postgresConfig(),
      (client: IClient): Observable<any> => client.queryByFile$(sqlPath, placeHolder),
    );
  }

  public toTaskLogCosKey(asset: TaskAssetKey, prefix = "", ext = ""): string {
    return `${prefix}/${asset.taskId}/${asset.typeId}-${asset.assetId}${ext}`;
  }

  public updateRebootTaskToInprogress$(taskId: string): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-reboot.sql`;

    const placeHolder = [taskId, ETaskStatus.InProgress];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task reboot is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task reboot is a duplicate");
          }
          return null;
        }),
        mergeMap(() => this.getRebootTask$(taskId)),
        mergeMap((task: RebootTask) =>
          from(task.assets).pipe(
            mergeMap((taskAsset: RebootTaskAsset) => {
              const params: UpdateRebootSelfTestTaskAsset = {
                taskId: taskAsset.taskId,
                typeId: taskAsset.typeId,
                assetId: taskAsset.assetId,
                status: ETaskAssetStatus.InProgress,
                startedAt: moment.utc(),
              };
              return this.updateRebootTaskAsset$(params);
            }),
            toArray(),
          ),
        ),
        map(() => null),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateRebootTask$(params: UpdateRebootSelfTestTask): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-reboot.sql`;

    const placeHolder = [params.taskId, params.status];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task reboot is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task reboot is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateRebootTaskAsset$(params: UpdateRebootSelfTestTaskAsset): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-reboot-asset.sql`;

    const placeHolder = [
      params.taskId,
      params.typeId,
      params.assetId,
      params.status,
      params.startedAt ? moment(params.startedAt).format(this.dateFormat) : null,
    ];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task reboot asset is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task reboot asset is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateRebootTaskSubAsset$(params: UpdateRebootTaskSubAsset): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-reboots-subasset.sql`;

    const placeHolder = [
      params.taskId,
      params.typeId,
      params.assetId,
      params.subTypeId,
      params.subAssetId,
      params.status,
      params.errorCode,
      params.errorMessage,
      moment.utc(),
    ];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified reboots sub asset is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified reboots sub asset is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateSelfTestTaskToInprogress$(taskId: string): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-selftest.sql`;

    const placeHolder = [taskId, ETaskStatus.InProgress];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task self test is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task self test is a duplicate");
          }
          return null;
        }),
        mergeMap(() => this.getSelfTestTask$(taskId)),
        mergeMap((task: SelfTestTask) =>
          from(task.assets).pipe(
            mergeMap((taskAsset: SelfTestTaskAsset) => {
              const params: UpdateRebootSelfTestTaskAsset = {
                taskId: taskAsset.taskId,
                typeId: taskAsset.typeId,
                assetId: taskAsset.assetId,
                status: ETaskAssetStatus.InProgress,
                startedAt: moment.utc(),
              };
              return this.updateSelfTestTaskAsset$(params);
            }),
            toArray(),
          ),
        ),
        map(() => null),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateSelfTestTask$(params: UpdateRebootSelfTestTask): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-selftest.sql`;

    const placeHolder = [params.taskId, params.status];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task self test is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task self test is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateSelfTestTaskAsset$(params: UpdateRebootSelfTestTaskAsset): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-task-selftest-asset.sql`;

    const placeHolder = [
      params.taskId,
      params.typeId,
      params.assetId,
      params.status,
      params.startedAt ? moment(params.startedAt).format(this.dateFormat) : null,
    ];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified task self test asset is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified task self test asset is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public updateSelfTestTaskSubAsset$(params: UpdateSelfTestTaskSubAsset): Observable<null> {
    const sqlPath = `${this.sqlDir}/update-selftests-subasset.sql`;

    const placeHolder = [
      params.taskId,
      params.typeId,
      params.assetId,
      params.subTypeId,
      params.subAssetId,
      params.status,
      params.errorCode,
      params.errorMessage,
      moment.utc(),
    ];

    const transaction = (client: IClient): Observable<null> =>
      client.queryByFile$<any>(sqlPath, placeHolder).pipe(
        map((records: IClientResponse<any>) => {
          if (records.count === 0) {
            throw new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified selftests sub asset is not found");
          }
          if (records.count > 1) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "The specified selftests sub asset is a duplicate");
          }
          return null;
        }),
      );

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), transaction);
  }

  public getTasksStatus$(params: GetTaskStatusParams[]): Observable<TaskStatus[]> {
    if (params.length === 0) {
      return of([]);
    }

    const sqlPath = `${this.sqlDir}/select-tasks-status.sql`;

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) =>
        from(params).pipe(
          concatMap((taskStatus: GetTaskStatusParams) => {
            const placeHolder = [taskStatus.taskId];
            return client.queryByFile$<TaskStatus>(sqlPath, placeHolder).pipe(
              map((res: IClientResponse<TaskStatus>) => {
                return {
                  taskId: res.records[0].taskId,
                  taskType: res.records[0].taskType,
                  status: res.records[0].status,
                  taskAssets: res.records[0].taskAssets,
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
}
