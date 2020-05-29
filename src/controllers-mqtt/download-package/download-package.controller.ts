import { Controller } from "@nestjs/common";
import { EventPattern, Payload, Ctx } from "@nestjs/microservices/decorators";
import { MqttContext } from "@nestjs/microservices";
import { Observable, of, throwError, empty } from "rxjs";
import { map, mergeMap, tap, catchError, switchMap, finalize } from "rxjs/operators";
import { AxiosRequestConfig } from "axios";

import {
  TasksService,
  UpdateDownloadPackageTaskAsset,
  ETaskAssetStatus,
  DownloadPackageTask,
  ETaskStatus,
  UpdateDownloadPackageTask,
} from "../../service/tasks";
import { ConfigService } from "../../service/config";
import { LoggerService } from "../../service/logger";
import { HttpClientService } from "../../service/http-client";
import { GuardMqttMessage } from "../mqtt-message.guard";

import { EResult } from "../mqtt-message.i";
import { AssetStatusService, AssetKey } from "../../service/asset-status";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { BridgeEventListService, ETaskErrorResult } from "../../service/event-list";
import { MqttPublishService } from "../../service/mqtt-publish";
import { PostSchedulesBody } from "../../microservices/task-scheduler/controllers/task-scheduler/task-schedule.controller.i";

// --------------------------------------------------

@Controller()
export class DownloadPackageController {
  constructor(
    private taskService: TasksService,
    private configService: ConfigService,
    private logger: LoggerService,
    private httpClientService: HttpClientService,
    private guardMqttMessage: GuardMqttMessage,
    private assetStatusService: AssetStatusService,
    private bridgeEventListService: BridgeEventListService,
    private mqttPublishService: MqttPublishService,
  ) {}

  @EventPattern("/glory/g-connect-session/+/response/DownloadPackage")
  public handleDownlaodPackage$(@Payload() payload: Record<string, unknown>, @Ctx() context: MqttContext): Observable<any> {
    if (!payload) {
      return of(null);
    }

    if (!this.guardMqttMessage.isMqttMessagePayload(payload)) {
      return of(null);
    }

    if (!this.guardMqttMessage.isMqttResponsePayload(payload)) {
      return of(null);
    }

    return of(null).pipe(
      mergeMap(() => this.mqttPublishService.releaseRetain$(context.getTopic())),
      mergeMap(() => this.assetStatusService.getOwnerOrThis$(payload.assetMetaData)),
      mergeMap((rootAsset: AssetKey) =>
        this.taskService.getDownloadPackageTask$(payload.assetMetaData.messageId || "").pipe(
          mergeMap((downloadPackageTask: DownloadPackageTask) => {
            const asset = downloadPackageTask.assets.find(
              (asset) => asset.assetId === rootAsset.assetId && asset.typeId === rootAsset.typeId,
            );

            if (!asset || asset.status !== ETaskAssetStatus.InProgress) {
              return of(null);
            }

            const params: UpdateDownloadPackageTaskAsset = {
              ...rootAsset,
              taskId: downloadPackageTask.id,
              status: payload.result === EResult.Succeed ? ETaskAssetStatus.Complete : ETaskAssetStatus.DeviceError,
            };

            return of(null).pipe(
              mergeMap(() => this.taskService.updateDownloadPackageTaskAsset$(params)),
              tap(() =>
                this.logger.info(`Succeeded to process TaskAsset response about ${params.taskId}:${params.typeId}:${params.assetId}`),
              ),
              mergeMap(() => this.saveEventLog$(params)),
              mergeMap(() => this.closeSession$(payload.assetMetaData.sessionId ? payload.assetMetaData.sessionId : "")),
              mergeMap(() => this.updateDownloadPackageTaskStatus$(params.taskId)),
              mergeMap(() =>
                of(null).pipe(
                  mergeMap(() => this.checkCompleted$(params.taskId)),
                  mergeMap(() => this.taskService.getRelatedTaskId$(params.taskId)),
                  mergeMap((installTaskId: string) => this.immediateExecuteInstallTask$(installTaskId)),
                  finalize(() => null),
                ),
              ),
            );
          }),
        ),
      ),
      catchError((e: any) => {
        this.logger.error(
          `Failed to process TaskAsset response about ${payload.assetMetaData.messageId || ""}:${payload.assetMetaData.typeId}:${
            payload.assetMetaData.assetId
          }, error cause: ${e}`,
        );
        return of(null);
      }),
    );
  }

  public updateDownloadPackageTaskStatus$(taskId: string): Observable<null> {
    return this.taskService.getDownloadPackageTask$(taskId).pipe(
      mergeMap((task: DownloadPackageTask) => {
        if (task.status !== ETaskStatus.InProgress) {
          return of(null);
        }

        const status = task.assets.reduce<ETaskStatus>((r, a) => {
          const isInProgress = r === ETaskStatus.InProgress || a.status === ETaskAssetStatus.InProgress;
          const isFailure =
            r === ETaskStatus.Failure ||
            a.status === ETaskAssetStatus.ConnectionError ||
            a.status === ETaskAssetStatus.DeviceError ||
            a.status === ETaskAssetStatus.SystemError;
          return isInProgress ? ETaskStatus.InProgress : isFailure ? ETaskStatus.Failure : r;
        }, ETaskStatus.Complete);

        if (status === ETaskStatus.InProgress) {
          return of(null);
        }

        const params: UpdateDownloadPackageTask = {
          taskId,
          status,
        };
        return this.taskService
          .updateDownloadPackageTask$(params)
          .pipe(tap(() => this.logger.info(`Succeeded to update task status about ${taskId}:${status}`)));
      }),
      map(() => null),
    );
  }

  public closeSession$(sessionId: string): Observable<null> {
    if (!sessionId) {
      return of(null);
    }

    const port = this.configService.appConfig().port;
    const endPoint = `http://localhost:${port}/session-manager/sessions/${sessionId}`;
    const config: AxiosRequestConfig = {};

    return this.httpClientService.delete$(endPoint, config).pipe(
      tap(() => this.logger.info(`Succeeded to close session ${sessionId}`)),
      map(() => null),
      catchError((e) => {
        this.logger.warn(`Failure to close session ${sessionId}`);
        return throwError(e);
      }),
    );
  }

  public saveEventLog$(params: UpdateDownloadPackageTaskAsset): Observable<null> {
    let errorResult!: ETaskErrorResult;

    switch (params.status) {
      case ETaskAssetStatus.Complete:
        break;
      case ETaskAssetStatus.ConnectionError:
        errorResult = ETaskErrorResult.ConnectionError;
        break;
      case ETaskAssetStatus.SystemError:
        errorResult = ETaskErrorResult.SystemError;
        break;
      case ETaskAssetStatus.DeviceError:
        errorResult = ETaskErrorResult.DeviceError;
        break;
      default:
        return of(null);
    }

    return this.taskService.getDownloadPackageTask$(params.taskId).pipe(
      switchMap((task) => {
        const p = {
          taskId: params.taskId,
          typeId: params.typeId,
          assetId: params.assetId,
          packageName: task.package.name,
        };

        return !errorResult //
          ? this.bridgeEventListService.downloadPackageTask.insertSuccess$(p)
          : this.bridgeEventListService.downloadPackageTask.insertFail$({ ...p, errorResult });
      }),
      catchError((e) => {
        // event log should not affect main processing
        const error = new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for RetrieveLogTask", e);
        this.logger.error(error.toString(), { error, params });
        return of(null);
      }),
    );
  }

  public checkCompleted$(taskId: string): Observable<null> {
    return this.taskService.getDownloadPackageTask$(taskId).pipe(
      mergeMap((task: DownloadPackageTask) => {
        if (task.status !== ETaskStatus.Complete) {
          return empty();
        }

        return of(null);
      }),
    );
  }

  public immediateExecuteInstallTask$(taskId: string): Observable<null> {
    const port = this.configService.appConfig().port;
    const endPoint = `http://localhost:${port}/task-scheduler/schedules`;
    const data: PostSchedulesBody = {
      taskId,
      callbackUrl: `http://localhost:${port}/startInstall`,
    };
    const config = {};

    return this.httpClientService.post$(endPoint, data, config).pipe(
      tap(() => this.logger.info(`Succeeded to kick task ${taskId}`)),
      map(() => null),
      catchError((e) => {
        this.logger.warn(`Failure to kick task ${taskId}`, e);
        return of(null);
      }),
    );
  }
}
