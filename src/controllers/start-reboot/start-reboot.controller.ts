import { Controller, HttpCode, Body, HttpException, Post, BadRequestException } from "@nestjs/common";

import { throwError, of, from, Observable } from "rxjs";

import { tap, catchError, mergeMap, concatMap, toArray, map } from "rxjs/operators";

import { AxiosResponse, AxiosRequestConfig } from "axios";

import { MqttPublishService, SendRebootParams } from "../../service/mqtt-publish";

import { ConfigService } from "../../service/config";

import { LoggerService } from "../../service/logger";

import { BridgeXServerError, ErrorCode } from "../../service/utils";

import { HttpClientService } from "../../service/http-client";

import { GuardStartReboot } from "./start-reboot.controller.guard";

import { SessionData } from "./start-reboot.controller.i";

import { TasksService, RebootTask, RebootTaskAsset, InsertRebootSelfTestParams, ETaskStatus, ETaskAssetStatus } from "../../service/tasks";

import { AssetStatusService, AssetStatus, EAssetStatus } from "../../service/asset-status";

import { BridgeEventListService } from "../../service/event-list";

import * as EventListParams from "../../service/event-list";

// -----------------------------------------------------

@Controller("/startReboot")
export class StartRebootController {
  constructor(
    private tasksService: TasksService,
    private mqttPublishService: MqttPublishService,
    private configService: ConfigService,
    private logger: LoggerService,
    private httpClientService: HttpClientService,
    private guard: GuardStartReboot,
    private assetStatusService: AssetStatusService,
    private bridgeEventListService: BridgeEventListService,
  ) {}

  @Post()
  @HttpCode(204)
  public post(@Body() body: any) {
    this.logger.info(`Enter POST /startReboot`);

    if (!this.guard.isPostBody(body)) {
      this.logger.info("Invalid request body", body);
      return throwError(new BadRequestException(`Cannot POST /startReboot`));
    }

    const taskId = body.taskId;

    return this.tasksService.getRebootTask$(taskId).pipe(
      concatMap((task: RebootTask) => {
        if (task.status !== ETaskStatus.Scheduled) {
          this.logger.warn(`Fail to start-reboot because the task reboot started already. ${taskId}`);
          return of(null);
        }
        return of(task).pipe(
          concatMap(() => this.tasksService.updateRebootTaskToInprogress$(taskId)),
          tap(() => this.logger.info(`Succeeded to update task reboot status to InProgress. ${taskId}`)),
          concatMap(() => this.assetStatusService.getMany$(task.assets)),
          concatMap((assetStatus: any) =>
            from(task.assets).pipe(
              concatMap((taskAsset: RebootTaskAsset) => this.startReboot$(task, taskAsset, assetStatus)),
              toArray(),
            ),
          ),
          concatMap(() => this.updateRebootTaskStatus$(taskId)),
          map(() => null),
        );
      }),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public startReboot$(task: RebootTask, taskAsset: RebootTaskAsset, assets: AssetStatus[]): Observable<null> {
    const targetAsset: AssetStatus = this.findTargetAsset(taskAsset, taskAsset.typeId, assets) as any;

    if (!targetAsset) {
      this.logger.warn(`Specified asset does not have "${taskAsset}" as a child asset`, targetAsset);
      return this.tasksService.updateRebootTaskAsset$({ ...taskAsset, status: ETaskAssetStatus.SystemError }).pipe(
        concatMap(() =>
          this.saveEventLogFail$({
            taskId: taskAsset.taskId,
            typeId: taskAsset.typeId,
            assetId: taskAsset.assetId,
            memo: task.memo,
            errorResult: EventListParams.ETaskErrorResult.SystemError,
          }),
        ),
      );
    }

    if (targetAsset.status === EAssetStatus.Missing) {
      this.logger.warn(`Specified asset is not online`, taskAsset);
      return this.tasksService.updateRebootTaskAsset$({ ...taskAsset, status: ETaskAssetStatus.ConnectionError }).pipe(
        concatMap(() =>
          this.saveEventLogFail$({
            taskId: taskAsset.taskId,
            typeId: taskAsset.typeId,
            assetId: taskAsset.assetId,
            memo: task.memo,
            errorResult: EventListParams.ETaskErrorResult.ConnectionError,
          }),
        ),
      );
    }

    return of(1).pipe(
      concatMap(() =>
        from(targetAsset.subAssets || []).pipe(
          concatMap((subAsset: AssetStatus) => this.sendReboot$(task, taskAsset, subAsset)),
          toArray(),
          concatMap(() => this.saveEventLogExecute$({ ...taskAsset, memo: task.memo })),
        ),
      ),
      map(() => null),
    );
  }

  public findTargetAsset(taskAsset: RebootTaskAsset, assetType: string, assets: AssetStatus[]): AssetStatus | null {
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

  public sendReboot$(task: RebootTask, taskAsset: RebootTaskAsset, subAsset: AssetStatus): Observable<null> {
    let insertRebootSelfTestParams: InsertRebootSelfTestParams;
    let sendRebootParams: SendRebootParams;

    return this.createSession$(subAsset.typeId, subAsset.assetId).pipe(
      map((mqttSession) => {
        insertRebootSelfTestParams = {
          taskId: task.taskId,
          assetId: taskAsset.assetId,
          typeId: taskAsset.typeId,
          subAssetId: subAsset.assetId,
          subTypeId: subAsset.typeId,
          status: "",
          errorCode: "",
          errorMsg: "",
        };
        sendRebootParams = {
          typeId: subAsset.typeId,
          assetId: subAsset.assetId,
          sessionTopic: mqttSession.topicPrefix,
          sessionId: mqttSession.sessionId,
          messageId: task.taskId,
        };
      }),
      concatMap(() => this.tasksService.insertReboot$(insertRebootSelfTestParams)),
      concatMap(() => this.mqttPublishService.sendRebootCommand$(sendRebootParams)),
      tap(() => this.logger.info(`Succeeded to publish Reboot. ${task.taskId}:${subAsset.typeId}:${subAsset.assetId}`)),
      map(() => null),
    );
  }

  public computeTaskStatus(assets: RebootTaskAsset[]): ETaskStatus {
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

  public updateRebootTaskStatus$(taskId: string): Observable<null> {
    return this.tasksService.getRebootTask$(taskId).pipe(
      mergeMap((task: RebootTask) => {
        if (task.status !== ETaskStatus.InProgress) {
          return of(null);
        }

        const status = this.computeTaskStatus(task.assets);

        if (status === ETaskStatus.InProgress || status === ETaskStatus.Scheduled) {
          return of(null);
        }

        return this.tasksService
          .updateRebootTask$({ taskId, status })
          .pipe(tap(() => this.logger.info("Succeeded to update task reboot status", { taskId, from: task.status, to: status })));
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

  public saveEventLogExecute$(params: EventListParams.CreateTaskParams & EventListParams.RebootTaskParams) {
    return this.bridgeEventListService.rebootTask.insertExecute$(params).pipe(
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event reboot for Execute RebootTask", e))),
      catchError((e: BridgeXServerError) => {
        // event reboot should not affect main processing
        this.logger.error(e.toString(), { error: e, params });
        return of(null);
      }),
    );
  }

  public saveEventLogFail$(params: EventListParams.FailTaskParams & EventListParams.RebootTaskParams) {
    return this.bridgeEventListService.rebootTask.insertFail$(params).pipe(
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event reboot for Fail RebootTask", e))),
      catchError((e: BridgeXServerError) => {
        // event reboot should not affect main processing
        this.logger.error(e.toString(), { error: e, params });
        return of(null);
      }),
    );
  }
}
