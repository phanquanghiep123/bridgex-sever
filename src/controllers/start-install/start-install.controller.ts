import { Controller, HttpCode, Body, HttpException, Post, BadRequestException } from "@nestjs/common";

import { throwError, of, from, Observable } from "rxjs";

import { catchError, map, tap, switchMap, concatMap, toArray, mergeMap } from "rxjs/operators";

import { AxiosResponse, AxiosRequestConfig } from "axios";

import { TasksService, ETaskStatus, InstallTask, InstallTaskAsset, InstallTaskPackage, ETaskAssetStatus } from "../../service/tasks";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { AssetStatusService, AssetStatus, EAssetStatus } from "../../service/asset-status";
import { BridgeEventListService } from "../../service/event-list";
import { MqttPublishService, InstallParams } from "../../service/mqtt-publish";
import { SessionData } from "../start-download-package/start-download-package.controller.i";
import * as EventListParams from "../../service/event-list";
import { ConfigService } from "../../service/config";
import { HttpClientService } from "../../service/http-client";

import { GuardStartInstall } from "./start-install.controller.guard";

// -----------------------------------------------------

@Controller("/startInstall")
export class StartInstallController {
  constructor(
    private tasksService: TasksService,
    private mqttPublishService: MqttPublishService,
    private configService: ConfigService,
    private logger: LoggerService,
    private httpClientService: HttpClientService,
    private guard: GuardStartInstall,
    private assetStatusService: AssetStatusService,
    private eventListService: BridgeEventListService,
  ) {}

  @Post()
  @HttpCode(204)
  public post(@Body() body: { taskId: string }) {
    this.logger.info(`Enter POST /startInstall`);

    if (!this.guard.isPostBody(body)) {
      this.logger.info("Invalid request body", body);
      return throwError(new BadRequestException(`Cannot POST /startInstall`));
    }

    return this.tasksService.getInstallTask$(body.taskId).pipe(
      switchMap((task: InstallTask) => {
        if (task.status !== ETaskStatus.Scheduled) {
          this.logger.warn(`Fail to start-install because the task started already. ${task.id}`);
          return of(null);
        }

        return of(task).pipe(
          switchMap(() => this.tasksService.updateInstallTaskToInprogress$(task)),
          tap(() => this.logger.info(`Succeeded to update Task status to InProgress. ${task.id}`)),
          switchMap(() => this.assetStatusService.getMany$(task.assets)),
          switchMap((assets: AssetStatus[]) => {
            return from(task.assets).pipe(
              concatMap((taskAsset: InstallTaskAsset) => {
                return this.install$(task.id, taskAsset, assets, task.package);
              }),
              toArray(),
            );
          }),
          map(() => null),
        );
      }),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public findTargetAsset(taskAsset: InstallTaskAsset, assetType: string, assets: AssetStatus[]): AssetStatus | null {
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

  public install$(taskId: string, taskAsset: InstallTaskAsset, assets: AssetStatus[], pkg: InstallTaskPackage): Observable<null> {
    const targetAsset: AssetStatus = this.findTargetAsset(taskAsset, pkg.model, assets) as any;

    if (!targetAsset) {
      this.logger.warn(`Specified asset does not have "${pkg.model}" as a child asset`, targetAsset);

      return this.tasksService
        .updateInstallTaskAsset$({
          typeId: taskAsset.typeId,
          assetId: taskAsset.assetId,
          taskId,
          status: ETaskAssetStatus.SystemError,
        })
        .pipe(
          mergeMap(() =>
            this.saveEventLogFail$({
              taskId,
              typeId: taskAsset.typeId,
              assetId: taskAsset.assetId,
              packageName: pkg.name,
              errorResult: EventListParams.ETaskErrorResult.SystemError,
            }),
          ),
        );
    }
    if (targetAsset.status === EAssetStatus.Missing) {
      this.logger.warn(`Specified asset is not online`, targetAsset);
      return this.tasksService
        .updateInstallTaskAsset$({
          typeId: taskAsset.typeId,
          assetId: taskAsset.assetId,
          taskId,
          status: ETaskAssetStatus.ConnectionError,
        })
        .pipe(
          mergeMap(() =>
            this.saveEventLogFail$({
              taskId,
              typeId: taskAsset.typeId,
              assetId: taskAsset.assetId,
              packageName: pkg.name,
              errorResult: EventListParams.ETaskErrorResult.ConnectionError,
            }),
          ),
        );
    }

    return this.createSession$(targetAsset.typeId, targetAsset.assetId).pipe(
      mergeMap((mqttSession) => {
        const installParams: InstallParams = {
          typeId: targetAsset.typeId,
          assetId: targetAsset.assetId,
          sessionTopic: mqttSession.topicPrefix,
          sessionId: mqttSession.sessionId,
          packageId: pkg.id,
          messageId: taskId,
        };
        return this.mqttPublishService.installCommand$(installParams);
      }),
      mergeMap(() => this.saveEventLogExecute$({ ...taskAsset, taskId, packageName: pkg.name })),
      tap(() => this.logger.info(`Succeeded to publish DownloadPackage. ${taskId}:${targetAsset.typeId}:${targetAsset.assetId}`)),
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

  public saveEventLogExecute$(params: EventListParams.CreateTaskParams & EventListParams.DownloadPackageTaskParams): Observable<null> {
    return this.eventListService.installTask.insertExecute$(params).pipe(
      catchError((e) => {
        // event log should not affect main processing
        const error = new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for Execute DeploymentTask", e);
        this.logger.error(error.toString(), { error: error, params });
        return of(null);
      }),
    );
  }

  public saveEventLogFail$(params: EventListParams.FailTaskParams & EventListParams.DownloadPackageTaskParams): Observable<null> {
    return this.eventListService.installTask.insertFail$(params).pipe(
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        const error = new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for Fail DeploymentTask", e);
        this.logger.error(error.toString(), { error: error, params });
        return of(null);
      }),
    );
  }
}
