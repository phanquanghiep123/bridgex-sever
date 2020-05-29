import { Controller } from "@nestjs/common";
import { EventPattern, Payload, Ctx } from "@nestjs/microservices/decorators";
import { MqttContext } from "@nestjs/microservices";
import { Observable, of, throwError, fromEvent, race, bindNodeCallback, from } from "rxjs";
import { map, mergeMap, tap, catchError, switchMap, filter, toArray, finalize, concatMap, delay } from "rxjs/operators";
import { AxiosRequestConfig } from "axios";
import fs from "fs";
import rimraf from "rimraf";
import path from "path";

import {
  TasksService,
  ETaskStatus,
  ETaskAssetStatus,
  LogTask,
  UpdateLogTask,
  UpdateLogTaskAsset,
  TaskAssetKey,
  RetrieveLogResultRecord,
  ERetrieveLogsStatus,
} from "../../service/tasks";

import { ConfigService } from "../../service/config";
import { LoggerService } from "../../service/logger";
import { HttpClientService } from "../../service/http-client";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { AssetStatusService } from "../../service/asset-status";
import { IbmCosService } from "../../service/ibm-cos";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { BridgeEventListService, ETaskErrorResult } from "../../service/event-list";
import { MqttPublishService } from "../../service/mqtt-publish";
import { ZipLogService } from "../../service/zip-log";
import { FtpClientService } from "../../service/ftp-client/ftp-client.service";

// --------------------------------------------------
export const externals = {
  mkdir$: fs.promises.mkdir,
  createReadStream: fs.createReadStream,
  rimraf: bindNodeCallback(rimraf),
  random: Math.random,
};
// --------------------------------------------------

@Controller()
export class RetrieveLogController {
  constructor(
    private taskService: TasksService,
    private ibmCosService: IbmCosService,
    private configService: ConfigService,
    private logger: LoggerService,
    private httpClientService: HttpClientService,
    private ftpClientService: FtpClientService,
    private guardMqttMessage: GuardMqttMessage,
    private assetStatusService: AssetStatusService,
    private bridgeEventListService: BridgeEventListService,
    private mqttPublishService: MqttPublishService,
    private zipLogService: ZipLogService,
  ) {}

  /**
   * Handles RetrieveLog response from each sub-assets
   */
  @EventPattern("/glory/g-connect-session/+/response/RetrieveLog")
  public handleRetrieveLog$(@Payload() payload: Record<string, unknown>, @Ctx() context: MqttContext): Observable<any> {
    if (!payload) {
      return of(null);
    }

    if (!this.guardMqttMessage.isMqttMessagePayload(payload)) {
      return of(null);
    }

    if (!this.guardMqttMessage.isMqttResponsePayload(payload)) {
      return of(null);
    }

    const topicAndPayload = {
      topic: context.getTopic(),
      payload,
    };

    const metadata: TaskAssetKey = {
      taskId: payload.assetMetaData.messageId,
      typeId: payload.assetMetaData.typeId,
      assetId: payload.assetMetaData.assetId,
    };

    return of(null).pipe(
      delay(5000 * externals.random()), // TODO: avoid congested database access

      tap(() => this.logger.debug("RetrieveLogController.handleRetrieveLog$ enter", topicAndPayload)),

      // delete retained message
      mergeMap(() => this.mqttPublishService.releaseRetain$(topicAndPayload.topic)),

      // close mqtt session
      mergeMap(() => this.closeSession$(payload.assetMetaData.sessionId || "")),

      // save a response from a sub-asset
      mergeMap(() =>
        this.taskService.insertRetrievelog$({
          ...metadata,
          status: payload.result,
          errorCode: payload.errorCode || "",
          errorMsg: payload.errorMsg || "",
        }),
      ),

      // drop if all concerned assets did not completed yet under owner asset
      mergeMap(() => this.checkProgressOfEachAsset$(metadata)),

      // upload log files
      mergeMap((params) =>
        this.uploadLogFileToCos$(params.asset, params.results).pipe(
          // update owner asset status
          mergeMap(() => this.updateLogTaskAssetStatus$(params.asset, params.results)),
          catchError(() => this.updateLogTaskAssetStatus$(params.asset, params.results, ETaskAssetStatus.SystemError)),
          map(() => params),
        ),
      ),

      // following method is invoked only if all related assets completes tasks
      mergeMap((params) => this.updateLogTaskStatus$(params.asset.taskId)),

      tap(
        (result) => this.logger.debug("RetrieveLogController.handleRetrieveLog$ exit", { ...topicAndPayload, result }),
        (error) => this.logger.debug("RetrieveLogController.handleRetrieveLog$ exit with error", { ...topicAndPayload, error }),
      ),
    );
  }

  /**
   * Checks progress of each sub-asset or the targetAsset itself if the targetAsset does not have sub-assets
   * asset of returned data indicates an owner asset of targetAsset or targetAsset itself
   * results of return data contains sub-assets' results of targetAsset or targetAsset's result
   */
  public checkProgressOfEachAsset$(targetAsset: TaskAssetKey): Observable<{ asset: TaskAssetKey; results: RetrieveLogResultRecord[] }> {
    return this.assetStatusService.getOwnerOrThis$(targetAsset).pipe(
      mergeMap((ownerAsset) =>
        this.assetStatusService.get$(ownerAsset).pipe(
          // targetAsset is an independent asset if obtained assetStatus does not have subAssets
          map((assetStatus) => (assetStatus.subAssets && assetStatus.subAssets.length ? assetStatus.subAssets : [assetStatus])),

          // get RetrieveLog result of all concerned assets
          mergeMap((assets) => {
            const keys = assets.map((elm) => ({
              taskId: targetAsset.taskId,
              typeId: elm.typeId,
              assetId: elm.assetId,
            }));
            return this.taskService.bulkGetRetrieveLogResults$(keys).pipe(map((results) => ({ assets, results })));
          }),
          tap(({ assets, results }) =>
            this.logger.debug("RetrieveLogController.checkProgressOfEachAsset$ before filter", {
              targetAsset,
              assets,
              results,
            }),
          ),
          // drop if all concerned assets did not completed yet
          filter(({ assets, results }) => {
            if (results.length !== assets.length) {
              return false;
            }

            const res = assets.reduce((p, c) => p.filter((v) => !(v.typeId === c.typeId && v.assetId === c.assetId)), [...results]);
            return res.length === 0;
          }),
          map(({ results }) => {
            return {
              asset: { ...ownerAsset, taskId: targetAsset.taskId },
              results,
            };
          }),
        ),
      ),
      tap(
        (result) => this.logger.debug("RetrieveLogController.checkProgressOfEachAsset$ exit", { result }),
        (error) => this.logger.warn("RetrieveLogController.checkProgressOfEachAsset$ exit with error", { error }),
      ),
    );
  }

  public updateLogTaskAssetStatus$(
    asset: TaskAssetKey,
    results: RetrieveLogResultRecord[],
    assetStatus?: ETaskAssetStatus,
  ): Observable<any> {
    const subAssetStatus = results.reduce<ERetrieveLogsStatus>(
      (pre, result) => (pre === ERetrieveLogsStatus.Succeed ? pre : result.status),
      ERetrieveLogsStatus.Error,
    );

    let status = subAssetStatus === ERetrieveLogsStatus.Error ? ETaskAssetStatus.DeviceError : ETaskAssetStatus.Complete;

    if (assetStatus && status === ETaskAssetStatus.Complete) {
      status = assetStatus;
    }

    return this.taskService.updateLogTaskAsset$({ ...asset, status });
  }

  public updateLogTaskStatus$(taskId: string): Observable<null> {
    return this.taskService.getLogTask$(taskId).pipe(
      mergeMap((task: LogTask) => {
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

        const params: UpdateLogTask = {
          taskId,
          status,
        };
        return this.taskService
          .updateLogTask$(params)
          .pipe(tap(() => this.logger.info(`Succeeded to update task log status about ${taskId}:${status}`)));
      }),
      tap(
        (result) => this.logger.debug("RetrieveLogController.updateLogTaskStatus$ exit", { result }),
        (error) => this.logger.warn("RetrieveLogController.updateLogTaskStatus$ exit with error", { error }),
      ),

      catchError((e: any) => {
        this.logger.error("Failed to process LogTaskAsset response", { error: e, taskId });
        return of(null);
      }),
      map(() => null),
    );
  }

  public uploadLogFileToCos$(asset: TaskAssetKey, results: RetrieveLogResultRecord[]): Observable<null> {
    this.logger.info("Enter RetrieveLogController.uploadLogFileToCos$");
    const workDir = path.join(
      this.configService.persistentVolumeConfig().validatePackageTmpDir,
      "retrievelog",
      `${asset.taskId}_${asset.typeId}_${asset.assetId}`,
    );

    return of(null).pipe(
      // create working dir
      switchMap(() => externals.mkdir$(workDir, { recursive: true })),

      // download log files and make archive
      switchMap(() => this.archiveAssetLogs$(workDir, asset, results)),
      tap((res) =>
        this.logger.debug("RetrieveLogController.uploadLogFileToCos$ this.archiveAssetLogs$(workDir, asset, results)", {
          res,
        }),
      ),

      // upload archived file to COS
      switchMap((archiveFilePath) => {
        this.logger.info("upload log file to cos");
        const { assetLogsPrefix } = this.configService.objectStorageConfig();
        const cosKey = this.taskService.toTaskLogCosKey(asset, assetLogsPrefix, ".zip");

        return this.upload$(archiveFilePath, cosKey).pipe(
          tap((res) =>
            this.logger.debug("RetrieveLogController.uploadLogFileToCos$ return this.upload$(archiveFilePath, cosKey)", {
              res,
            }),
          ),
        );
      }),

      map(() => null),
      catchError((e: any) => {
        const serviceParams: UpdateLogTask = {
          taskId: asset.taskId,
          status: ETaskStatus.Failure,
        };

        return this.taskService
          .updateLogTask$(serviceParams)
          .pipe(catchError(() => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Failed to upload log file to cos", e))));
      }),

      tap(
        (result) => this.logger.debug("RetrieveLogController.uploadLogFileToCos$ exit", { result }),
        (error) => this.logger.warn("RetrieveLogController.uploadLogFileToCos$ exit with error", { error }),
      ),

      // delete working dir
      finalize(() => externals.rimraf(workDir)),
    );
  }

  public archiveAssetLogs$(workDir: string, asset: TaskAssetKey, results: RetrieveLogResultRecord[]): Observable<string> {
    return of(null).pipe(
      // download packages from FTP for all sub-assets
      switchMap(() =>
        from(results).pipe(
          concatMap((result) => {
            if (result.status !== ERetrieveLogsStatus.Succeed) {
              return of({
                typeId: result.typeId,
                assetId: result.assetId,
                status: result.status,
                filePath: "",
              });
            }

            const ftpKey = this.ftpClientService.convertUrlToFTPKey(result.ftpFilePath);

            // remove dir from path string and join path
            // (e.g.)
            //   slash:      /path/to/log-file.tar.gz => path_to_log-file.tar.gz
            //   backslash:  \path\to\log-file.tar.gz => path_to_log-file.tar.gz
            const destFileName = ftpKey.replace(/^(\\+|\/+)/, "").replace(/(\\|\/)/g, "_");
            const destFilePath = path.join(workDir, destFileName);

            return of(null).pipe(
              switchMap(() => this.ftpClientService.getObjectStream$(ftpKey)),
              switchMap((ftpReadStream) => this.ftpClientService.saveStreamInFile$(ftpReadStream, destFilePath, fs.writeFile)),
              map(() => ({
                typeId: result.typeId,
                assetId: result.assetId,
                status: result.status,
                filePath: destFilePath,
              })),
            );
          }),
          toArray(),
        ),
      ),

      // archive downloaded packages and META.yaml
      switchMap((fileInfoList) =>
        this.zipLogService.zip$({
          dstDir: workDir,
          dstFileName: "tmp.zip",
          asset: {
            typeId: asset.typeId,
            assetId: asset.assetId,
          },
          retrieveLogInfo: fileInfoList,
        }),
      ),
      tap(
        (result) => this.logger.debug("RetrieveLogController.archiveAssetLogs$ exit", { result }),
        (error) => this.logger.warn("RetrieveLogController.archiveAssetLogs$ exit with error", { error }),
      ),
    );
  }

  // create log file in the specified path
  // this function is expected to use when calling s3 putObject
  // because s3 putObject is not supporting ftp stream, this create fs stream and send it to putObject
  public upload$(tmpFile: string, cosKey: string): Observable<string> {
    return of(null).pipe(
      switchMap(() => {
        const stream = externals.createReadStream(tmpFile);

        return race(
          this.ibmCosService.putObject$(cosKey, stream),
          fromEvent(stream, "error").pipe(switchMap((e: any) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Failed to ", e)))),
        ).pipe(
          toArray(),
          map(() => cosKey),
          finalize(() => stream.emit("close")),
        );
      }),
      tap(
        (result) => this.logger.debug("RetrieveLogController.upload$ exit", { result }),
        (error) => this.logger.warn("RetrieveLogController.upload$ exit with error", { error }),
      ),
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
        this.logger.warn(`Failure to close session ${sessionId}`, { sessionId, error: e });
        return of(null);
      }),
    );
  }

  public saveEventLog$(params: UpdateLogTaskAsset): Observable<null> {
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

    return this.taskService.getLogTask$(params.taskId).pipe(
      switchMap((task) => {
        const p = {
          taskId: params.taskId,
          typeId: params.typeId,
          assetId: params.assetId,
          logType: task.logType,
        };

        return !errorResult //
          ? this.bridgeEventListService.retrieveLogTask.insertSuccess$(p)
          : this.bridgeEventListService.retrieveLogTask.insertFail$({ ...p, errorResult });
      }),
      catchError((e) => {
        // event log should not affect main processing
        const error = new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for RetrieveLogTask", e);
        this.logger.error(error.toString(), { error, params });
        return of(null);
      }),
      tap(
        (result) => this.logger.debug("RetrieveLogController.saveEventLog$ exit", { result }),
        (error) => this.logger.warn("RetrieveLogController.saveEventLog$ exit with error", { error }),
      ),
    );
  }
}
