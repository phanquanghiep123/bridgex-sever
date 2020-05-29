import { Controller } from "@nestjs/common";
import { EventPattern, Payload, Ctx } from "@nestjs/microservices/decorators";
import { MqttContext } from "@nestjs/microservices";
import { Observable, of, throwError } from "rxjs";
import { map, mergeMap, tap, catchError, switchMap } from "rxjs/operators";
import { AxiosRequestConfig } from "axios";

import {
  TasksService,
  ETaskStatus,
  ETaskAssetStatus,
  SelfTestTask,
  SelfTestTaskAsset,
  UpdateSelfTestTaskSubAsset,
  UpdateRebootSelfTestTask,
  UpdateRebootSelfTestTaskAsset,
} from "../../service/tasks";

import { ConfigService } from "../../service/config";

import { LoggerService } from "../../service/logger";

import { HttpClientService } from "../../service/http-client";

import { GuardMqttMessage } from "../mqtt-message.guard";

import { EResult } from "../mqtt-message.i";

import { AssetStatusService } from "../../service/asset-status";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { BridgeEventListService, ETaskErrorResult } from "../../service/event-list";
import { MqttPublishService } from "../../service/mqtt-publish";

// --------------------------------------------------

@Controller()
export class SelfTestController {
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

  @EventPattern("/glory/g-connect-session/+/response/SelfTest")
  public handleSelfTest$(@Payload() payload: Record<string, unknown>, @Ctx() context: MqttContext): Observable<any> {
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
      mergeMap((asset) =>
        this.taskService.getSelfTestTaskAsset$({ ...asset, taskId: payload.assetMetaData.messageId || "" }).pipe(
          tap((taskAsset) =>
            this.logger.info(`Get SelfTestTaskAsset ${taskAsset.taskId}:${taskAsset.typeId}:${taskAsset.assetId}:${taskAsset.status}`),
          ),
          mergeMap((taskAsset: SelfTestTaskAsset) => {
            if (taskAsset.status !== ETaskAssetStatus.InProgress) {
              return of(null);
            }

            const updateSelfTestParams: UpdateSelfTestTaskSubAsset = {
              taskId: payload.assetMetaData.messageId || "",
              typeId: asset.typeId,
              assetId: asset.assetId,
              subTypeId: payload.assetMetaData.typeId,
              subAssetId: payload.assetMetaData.assetId,
              status: payload.result,
              errorCode: payload.errorCode || "",
              errorMessage: payload.errorMsg || "",
            };

            const updateAssetParams: UpdateRebootSelfTestTaskAsset = {
              ...asset,
              taskId: payload.assetMetaData.messageId || "",
              status: payload.result === EResult.Succeed ? ETaskAssetStatus.Complete : ETaskAssetStatus.DeviceError,
            };

            return this.taskService.updateSelfTestTaskSubAsset$(updateSelfTestParams).pipe(
              mergeMap(() => this.taskService.updateSelfTestTaskAsset$(updateAssetParams)),
              mergeMap(() => this.saveEventLog$(updateAssetParams)),
              tap(() =>
                this.logger.info(
                  `Succeeded to process SelfTestTaskAsset response about ${updateAssetParams.taskId}:${updateAssetParams.typeId}:${updateAssetParams.assetId}`,
                ),
              ),
              mergeMap(() => this.closeSession$(payload.assetMetaData.sessionId ? payload.assetMetaData.sessionId : "")),
              mergeMap(() => this.updateSelfTestTaskStatus$(updateAssetParams.taskId)),
            );
          }),
          catchError((e: any) => {
            this.logger.error(
              `Failed to process SelfTestTaskAsset response about ${payload.assetMetaData.messageId || ""}:${asset.typeId}:${
                asset.assetId
              }, error cause: ${e}`,
            );
            return of(null);
          }),
        ),
      ),
    );
  }

  public updateSelfTestTaskStatus$(taskId: string): Observable<null> {
    return this.taskService.getSelfTestTask$(taskId).pipe(
      mergeMap((task: SelfTestTask) => {
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

        const found = (task.selftests || []).find((selftest) => {
          return selftest.status === "";
        });
        if (found) {
          return of(null);
        }

        const params: UpdateRebootSelfTestTask = {
          taskId,
          status,
        };
        return this.taskService
          .updateSelfTestTask$(params)
          .pipe(tap(() => this.logger.info(`Succeeded to update task selftest status about ${taskId}:${status}`)));
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

  public saveEventLog$(params: UpdateRebootSelfTestTaskAsset): Observable<null> {
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

    return this.taskService.getSelfTestTask$(params.taskId).pipe(
      switchMap((task) => {
        const p = {
          taskId: params.taskId,
          typeId: params.typeId,
          assetId: params.assetId,
          memo: task.memo,
        };

        return !errorResult //
          ? this.bridgeEventListService.selfTestTask.insertSuccess$(p)
          : this.bridgeEventListService.selfTestTask.insertFail$({ ...p, errorResult });
      }),
      catchError((e) => {
        // event log should not affect main processing
        const error = new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for SelfTestTask", e);
        this.logger.error(error.toString(), { error, params });
        return of(null);
      }),
    );
  }
}
