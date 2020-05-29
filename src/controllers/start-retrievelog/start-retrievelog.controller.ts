import moment from "moment";

import { Controller, HttpCode, Body, HttpException, Post, BadRequestException } from "@nestjs/common";

import { throwError, of, from, Observable } from "rxjs";

import { tap, catchError, mergeMap, concatMap, toArray, map } from "rxjs/operators";

import { AxiosResponse, AxiosRequestConfig } from "axios";

import { MqttPublishService, UploadRetrieveLogParams } from "../../service/mqtt-publish";

import { ConfigService } from "../../service/config";

import { LoggerService } from "../../service/logger";

import { BridgeXServerError, ErrorCode } from "../../service/utils";

import { HttpClientService } from "../../service/http-client";

import { GuardStartRetrieveLog } from "./start-retrievelog.controller.guard";

import { SessionData } from "./start-retrievelog.controller.i";

import { TasksService, LogTask, LogTaskAsset, InsertLogTaskRetrievelogParams, ETaskStatus, ETaskAssetStatus } from "../../service/tasks";

import { AssetStatusService, AssetStatus, EAssetStatus } from "../../service/asset-status";

import { BridgeEventListService } from "../../service/event-list";

import * as EventListParams from "../../service/event-list";

// -----------------------------------------------------

interface UploadUrlInfo {
  type: string[];
  protocol: string;
  url: string;
  filename: string;
  username?: string;
  password?: string;
  from?: moment.Moment;
  to?: moment.Moment;
}

@Controller("/startRetrieveLog")
export class StartRetrieveLogController {
  constructor(
    private tasksService: TasksService,
    private mqttPublishService: MqttPublishService,
    private configService: ConfigService,
    private logger: LoggerService,
    private httpClientService: HttpClientService,
    private guard: GuardStartRetrieveLog,
    private assetStatusService: AssetStatusService,
    private bridgeEventListService: BridgeEventListService,
  ) {}

  @Post()
  @HttpCode(204)
  public post(@Body() body: any) {
    this.logger.info(`Enter POST /startRetrieveLog`);

    if (!this.guard.isPostBody(body)) {
      this.logger.info("Invalid request body", body);
      return throwError(new BadRequestException(`Cannot POST /startRetrieveLog`));
    }

    const taskId = body.taskId;

    return this.tasksService.getLogTask$(taskId).pipe(
      concatMap((task: LogTask) => {
        if (task.status !== ETaskStatus.Scheduled) {
          this.logger.warn(`Fail to start-retrievelog because the task log started already. ${taskId}`);
          return of(null);
        }
        return of(task).pipe(
          concatMap(() => this.tasksService.updateLogTaskToInprogress$(taskId)),
          tap(() => this.logger.info(`Succeeded to update Task log status to InProgress. ${taskId}`)),
          concatMap(() => this.assetStatusService.getMany$(task.assets)),
          concatMap((assetStatus) =>
            from(task.assets).pipe(
              concatMap((taskAsset: LogTaskAsset) => this.startRetrieveLog$(task, taskAsset, assetStatus)),
              toArray(),
            ),
          ),
          concatMap(() => this.updateLogTaskStatus$(taskId)),
          map(() => null),
        );
      }),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public startRetrieveLog$(task: LogTask, taskAsset: LogTaskAsset, assets: AssetStatus[]): Observable<null> {
    const targetAsset: AssetStatus = this.findTargetAsset(taskAsset, taskAsset.typeId, assets) as any;

    if (!targetAsset) {
      this.logger.warn(`Specified asset does not have "${taskAsset}" as a child asset`, targetAsset);
      return this.tasksService.updateLogTaskAsset$({ ...taskAsset, status: ETaskAssetStatus.SystemError }).pipe(
        concatMap(() =>
          this.saveEventLogFail$({
            taskId: taskAsset.taskId,
            typeId: taskAsset.typeId,
            assetId: taskAsset.assetId,
            logType: task.logType,
            errorResult: EventListParams.ETaskErrorResult.SystemError,
          }),
        ),
      );
    }

    if (targetAsset.status === EAssetStatus.Missing) {
      this.logger.warn(`Specified asset is not online`, taskAsset);
      return this.tasksService.updateLogTaskAsset$({ ...taskAsset, status: ETaskAssetStatus.ConnectionError }).pipe(
        concatMap(() =>
          this.saveEventLogFail$({
            taskId: taskAsset.taskId,
            typeId: taskAsset.typeId,
            assetId: taskAsset.assetId,
            logType: task.logType,
            errorResult: EventListParams.ETaskErrorResult.ConnectionError,
          }),
        ),
      );
    }

    return of(1).pipe(
      concatMap(() =>
        from(targetAsset.subAssets || []).pipe(
          concatMap((subAsset: AssetStatus) => this.uploadRetrieveLog$(task, subAsset)),
          toArray(),
          concatMap(() => this.saveEventLogExecute$({ ...taskAsset, logType: task.logType })),
        ),
      ),
      map(() => null),
    );
  }

  public findTargetAsset(taskAsset: LogTaskAsset, assetType: string, assets: AssetStatus[]): AssetStatus | null {
    const found = (assets || []).find((asset) => {
      return asset.assetId === taskAsset.assetId && asset.typeId === taskAsset.typeId;
    });

    if (!found) {
      return null;
    }
    if (found.typeId === assetType) {
      return found;
    }
    if (!found.subAssets) {
      return null;
    }

    return found.subAssets.find((asset) => asset.typeId === assetType) || null;
  }

  public getUploadRetrieveLogUrl$(task: LogTask, subAsset: AssetStatus): Observable<UploadUrlInfo> {
    const ftpConfig = this.configService.ftpConfig();
    const logType: string[] = task.logType.split(",");
    const info: UploadUrlInfo = {
      type: logType,
      protocol: ftpConfig.protocol,
      url: `{protocol}://{host}{port}/${task.taskId}/`
        .replace("{protocol}", ftpConfig.protocol)
        .replace("{host}", ftpConfig.host)
        .replace("{port}", ftpConfig.port && ftpConfig.port !== 21 ? `:${ftpConfig.port}` : ""),
      filename: `${subAsset.typeId}-${subAsset.assetId}.tar.gz`,
      username: ftpConfig.user,
      password: ftpConfig.pass,
    };
    return of(info);
  }

  public uploadRetrieveLog$(task: LogTask, subAsset: AssetStatus): Observable<null> {
    let insertLogTaskRetrievelogParams: InsertLogTaskRetrievelogParams;
    let uploadRetrieveLogParams: UploadRetrieveLogParams;

    return this.createSession$(subAsset.typeId, subAsset.assetId).pipe(
      concatMap((mqttSession) => {
        return this.getUploadRetrieveLogUrl$(task, subAsset).pipe(
          map((uploadUrlInfo: UploadUrlInfo) => {
            insertLogTaskRetrievelogParams = {
              taskId: task.taskId,
              assetId: subAsset.assetId,
              typeId: subAsset.typeId,
              filePath: `${uploadUrlInfo.url}${uploadUrlInfo.filename}`,
            };
            uploadRetrieveLogParams = {
              typeId: subAsset.typeId,
              assetId: subAsset.assetId,
              sessionTopic: mqttSession.topicPrefix,
              sessionId: mqttSession.sessionId,
              messageId: task.taskId,
              ...uploadUrlInfo,
            };
          }),
          concatMap(() => this.tasksService.insertTaskLogRetrievelog$(insertLogTaskRetrievelogParams)),
          concatMap(() => this.mqttPublishService.uploadRetrieveLogCommand$(uploadRetrieveLogParams)),
          tap(() => this.logger.info(`Succeeded to publish UploadRetrieveLog. ${task.taskId}:${subAsset.typeId}:${subAsset.assetId}`)),
        );
      }),
      map(() => null),
    );
  }

  public computeTaskStatus(assets: LogTaskAsset[]): ETaskStatus {
    const { scheduled, completed, wip } = assets.reduce(
      (cnt, v) => {
        return {
          scheduled: cnt.scheduled + (v.status === ETaskAssetStatus.Scheduled ? 1 : 0),
          completed: cnt.completed + (v.status === ETaskAssetStatus.Complete ? 1 : 0),
          wip: cnt.wip + (v.status === ETaskAssetStatus.InProgress ? 1 : 0),
        };
      },
      { scheduled: 0, completed: 0, wip: 0 },
    );

    if (scheduled === assets.length) {
      return ETaskStatus.Scheduled;
    }
    if (completed === assets.length) {
      return ETaskStatus.Complete;
    }
    if (wip || scheduled) {
      return ETaskStatus.InProgress;
    }

    return ETaskStatus.Failure;
  }

  public updateLogTaskStatus$(taskId: string): Observable<null> {
    return this.tasksService.getLogTask$(taskId).pipe(
      mergeMap((task: LogTask) => {
        if (task.status !== ETaskStatus.InProgress) {
          return of(null);
        }

        const status = this.computeTaskStatus(task.assets);

        if (status === ETaskStatus.InProgress || status === ETaskStatus.Scheduled) {
          return of(null);
        }

        return this.tasksService
          .updateLogTask$({ taskId, status })
          .pipe(tap(() => this.logger.info("Succeeded to update task log status", { taskId, from: task.status, to: status })));
      }),
      map(() => null),
    );
  }

  public createSession$(typeId: string, assetId: string): Observable<SessionData> {
    const port = this.configService.appConfig().port;
    const endPoint = `http://localhost:${port}/session-manager/sessions`;
    const data = {
      typeId,
      assetId,
    };
    const config: AxiosRequestConfig = {};

    return this.httpClientService.post$(endPoint, data, config).pipe(
      tap(() => this.logger.info(`Succeeded to create session ${typeId}:${assetId}`)),
      mergeMap((response: AxiosResponse<any>) => {
        if (!this.guard.isSessionData(response.data)) {
          this.logger.info("Invalid response from session-manager", response.data);
          return throwError(new BridgeXServerError(500, `Invalid response from session-manager`));
        }

        return of(response.data);
      }),
      catchError((e) => {
        this.logger.warn(`Failure to create session ${typeId}:${assetId}`, e);
        return throwError(e);
      }),
    );
  }

  public saveEventLogExecute$(params: EventListParams.CreateTaskParams & EventListParams.RetrieveLogTaskParams) {
    return this.bridgeEventListService.retrieveLogTask.insertExecute$(params).pipe(
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for Execute RetrieveLogTask", e))),
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        this.logger.error(e.toString(), { error: e, params });
        return of(null);
      }),
    );
  }

  public saveEventLogFail$(params: EventListParams.FailTaskParams & EventListParams.RetrieveLogTaskParams) {
    return this.bridgeEventListService.retrieveLogTask.insertFail$(params).pipe(
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for Fail RetrieveLogTask", e))),
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        this.logger.error(e.toString(), { error: e, params });
        return of(null);
      }),
    );
  }
}
