import { Controller } from "@nestjs/common";
import { EventPattern, Payload, Ctx } from "@nestjs/microservices/decorators";
import { MqttContext } from "@nestjs/microservices";
import { Observable, of, throwError } from "rxjs";
import { map, mergeMap, tap, catchError, switchMap } from "rxjs/operators";
import { AxiosRequestConfig } from "axios";

import { TasksService, ETaskAssetStatus, ETaskStatus, InstallTask, UpdateInstallTaskAsset, UpdateInstallTask } from "../../service/tasks";
import { ConfigService } from "../../service/config";
import { LoggerService } from "../../service/logger";
import { HttpClientService } from "../../service/http-client";
import { GuardMqttMessage } from "../mqtt-message.guard";

import { EResult } from "../mqtt-message.i";
import { AssetStatusService, AssetKey } from "../../service/asset-status";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { BridgeEventListService, ETaskErrorResult } from "../../service/event-list";
import { MqttPublishService } from "../../service/mqtt-publish";

// --------------------------------------------------

@Controller()
export class InstallController {
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

  @EventPattern("/glory/g-connect-session/+/response/Install")
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

    this.logger.info("", payload);

    return of(null).pipe(
      mergeMap(() => this.mqttPublishService.releaseRetain$(context.getTopic())),
      mergeMap(() => this.assetStatusService.getOwnerOrThis$(payload.assetMetaData)),
      mergeMap((rootAsset: AssetKey) =>
        this.taskService.getInstallTask$(payload.assetMetaData.messageId || "").pipe(
          mergeMap((task: InstallTask) => {
            const asset = task.assets.find((asset) => asset.assetId === rootAsset.assetId && asset.typeId === rootAsset.typeId);

            if (!asset || asset.status !== ETaskAssetStatus.InProgress) {
              return of(null);
            }

            const params: UpdateInstallTaskAsset = {
              ...rootAsset,
              taskId: task.id,
              status: payload.result === EResult.Succeed ? ETaskAssetStatus.Complete : ETaskAssetStatus.DeviceError,
            };

            return this.taskService.updateInstallTaskAsset$(params).pipe(
              tap(() =>
                this.logger.info(`Succeeded to process TaskAsset response about ${params.taskId}:${params.typeId}:${params.assetId}`),
              ),
              mergeMap(() => this.saveEventLog$(params)),
              mergeMap(() => this.closeSession$(payload.assetMetaData.sessionId ? payload.assetMetaData.sessionId : "")),
              mergeMap(() => this.updateInstallTaskStatus$(params.taskId)),
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

  public updateInstallTaskStatus$(taskId: string): Observable<null> {
    return this.taskService.getInstallTask$(taskId).pipe(
      mergeMap((task: InstallTask) => {
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

        const params: UpdateInstallTask = {
          taskId,
          status,
        };
        return this.taskService
          .updateInstallTask$(params)
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

  public saveEventLog$(params: UpdateInstallTaskAsset): Observable<null> {
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

    return this.taskService.getInstallTask$(params.taskId).pipe(
      switchMap((task) => {
        const p = {
          taskId: params.taskId,
          typeId: params.typeId,
          assetId: params.assetId,
          packageName: task.package.name,
        };

        return !errorResult //
          ? this.bridgeEventListService.installTask.insertSuccess$(p)
          : this.bridgeEventListService.installTask.insertFail$({ ...p, errorResult });
      }),
      catchError((e) => {
        // event log should not affect main processing
        const error = new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for Install", e);
        this.logger.error(error.toString(), { error, params });
        return of(null);
      }),
    );
  }
}
