import { Controller, HttpCode, Body, HttpException, Post, BadRequestException } from "@nestjs/common";

import { throwError, of, from, Observable, zip } from "rxjs";

import { tap, catchError, mergeMap, toArray, map, concatMap } from "rxjs/operators";

import { AxiosResponse, AxiosRequestConfig } from "axios";

import {
  TasksService,
  DownloadPackageTask,
  DownloadPackageTaskAsset,
  ETaskStatus,
  ETaskAssetStatus,
  DownloadPackageTaskPackage,
} from "../../service/tasks";

// import {
//   IbmCosService,
// } from "../../service/ibm-cos";

import { MqttPublishService, DownloadPackageParams } from "../../service/mqtt-publish";

import { ConfigService } from "../../service/config";

import { LoggerService } from "../../service/logger";

import { GuardStartDownloadPackage } from "./start-download-package.controller.guard";

import { BridgeXServerError, ErrorCode } from "../../service/utils";

import { HttpClientService } from "../../service/http-client";

import { SessionData } from "./start-download-package.controller.i";

import { AssetStatusService, AssetStatus, EAssetStatus } from "../../service/asset-status";
import { BridgeEventListService } from "../../service/event-list";
import * as EventListParams from "../../service/event-list";

// -----------------------------------------------------

interface DownloadUrlInfo {
  protocol: string;
  url: string;
  username?: string;
  password?: string;
}

@Controller("/startDownloadPackage")
export class StartDownloadPackageController {
  constructor(
    private tasksService: TasksService,
    // private ibmCosService: IbmCosService,
    private mqttPublishService: MqttPublishService,
    private configService: ConfigService,
    private logger: LoggerService,
    private httpClientService: HttpClientService,
    private guard: GuardStartDownloadPackage,
    private assetStatusService: AssetStatusService,
    private eventListService: BridgeEventListService,
  ) {}

  @Post()
  @HttpCode(204)
  public post(@Body() body: { taskId: string }) {
    this.logger.info(`Enter POST /startDownloadPackage`);

    if (!this.guard.isPostBody(body)) {
      this.logger.info("Invalid request body", body);
      return throwError(new BadRequestException(`Cannot POST /startDownloadPackage`));
    }

    return this.tasksService.getDownloadPackageTask$(body.taskId).pipe(
      mergeMap((task: DownloadPackageTask) => {
        if (task.status !== ETaskStatus.Scheduled) {
          this.logger.warn(`Fail to start-download-package because the task started already. ${task.id}`);
          return of(null);
        }

        return of(task).pipe(
          mergeMap(() => this.tasksService.updateDownloadPackageTaskToInprogress$(task)),
          tap(() => this.logger.info(`Succeeded to update Task status to InProgress. ${task.id}`)),
          mergeMap(() => zip(this.getDownloadPackageUrl$(task.package), this.assetStatusService.getMany$(task.assets))),
          mergeMap(([downloadUrlInfo, assets]) =>
            from(task.assets).pipe(
              concatMap((taskAsset: DownloadPackageTaskAsset) => {
                return this.downloadPackage$(task.id, taskAsset, downloadUrlInfo, assets, task.package);
              }),
              toArray(),
            ),
          ),
          map(() => null),
        );
      }),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public getDownloadPackageUrl$(pkg: DownloadPackageTaskPackage): Observable<DownloadUrlInfo> {
    // *****
    // the follow code is when Asset download package from FTP server.
    // *****
    const ftpConfig = this.configService.ftpConfig();
    const info: DownloadUrlInfo = {
      protocol: ftpConfig.protocol,
      url: `{protocol}://{host}{port}/${pkg.ftpFilePath}`
        .replace("{protocol}", ftpConfig.protocol)
        .replace("{host}", ftpConfig.host)
        .replace("{port}", ftpConfig.port && ftpConfig.port !== 21 ? `:${ftpConfig.port}` : ""),
      username: ftpConfig.user,
      password: ftpConfig.pass,
    };
    return of(info);

    // *****
    // the follow code is when Asset download package from object storage server.
    // *****
    // return this.ibmCosService.getObjectUrl$(task.package.objectName).pipe(
    //   map((packageDownloadUrl) => {
    //     return {
    //       protocol: "https",
    //       url: packageDownloadUrl,
    //       username: undefined,
    //       password: undefined,
    //     };
    //   }),
    // );
  }

  public findTargetAsset(taskAsset: DownloadPackageTaskAsset, assetType: string, assets: AssetStatus[]): AssetStatus | null {
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

  public downloadPackage$(
    taskId: string,
    taskAsset: DownloadPackageTaskAsset,
    downloadUrlInfo: DownloadUrlInfo,
    assets: AssetStatus[],
    pkg: DownloadPackageTaskPackage,
  ): Observable<null> {
    const targetAsset: AssetStatus = this.findTargetAsset(taskAsset, pkg.model, assets) as any;

    if (!targetAsset) {
      this.logger.warn(`Specified asset does not have "${pkg.model}" as a child asset`, targetAsset);

      return this.tasksService
        .updateDownloadPackageTaskAsset$({
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
        .updateDownloadPackageTaskAsset$({
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
        const downloadPackageParams: DownloadPackageParams = {
          typeId: targetAsset.typeId,
          assetId: targetAsset.assetId,
          sessionTopic: mqttSession.topicPrefix,
          sessionId: mqttSession.sessionId,
          packageId: pkg.id,
          messageId: taskId,
          ...downloadUrlInfo,
        };
        return this.mqttPublishService.downloadPackageCommand$(downloadPackageParams);
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
    return this.eventListService.downloadPackageTask.insertExecute$(params).pipe(
      catchError((e) => {
        // event log should not affect main processing
        const error = new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for Execute DeploymentTask", e);
        this.logger.error(error.toString(), { error: error, params });
        return of(null);
      }),
    );
  }

  public saveEventLogFail$(params: EventListParams.FailTaskParams & EventListParams.DownloadPackageTaskParams): Observable<null> {
    return this.eventListService.downloadPackageTask.insertFail$(params).pipe(
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        const error = new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for Fail DeploymentTask", e);
        this.logger.error(error.toString(), { error: error, params });
        return of(null);
      }),
    );
  }
}
