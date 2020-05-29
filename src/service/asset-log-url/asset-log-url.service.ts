import * as path from "path";

import { Injectable } from "@nestjs/common";

import { of, Observable, throwError } from "rxjs";
import { switchMap, map, catchError } from "rxjs/operators";

import { AWSError } from "aws-sdk";
import { AssetLogUrlServiceGetParams, AssetLogUrlServiceGetResponse } from "./asset-log-url.service.i";
import { TasksService } from "../tasks";
import { IbmCosService, IbmCosError } from "../ibm-cos";
import { ConfigService } from "../config";
import { LoggerService } from "../logger/logger.service";
import { BridgeXServerError, ErrorCode } from "../utils";

@Injectable()
export class AssetLogUrlService {
  public readonly sqlDir = path.join(__dirname, `../../assets/sql`);

  public constructor(
    public tasksService: TasksService,
    public ibmCosService: IbmCosService,
    public configService: ConfigService,
    public logger: LoggerService,
  ) {}

  public getAssetLogUrl(params: AssetLogUrlServiceGetParams): Observable<AssetLogUrlServiceGetResponse> {
    this.logger.info(`Enter AssetLogUrlService.getAssetLogUrl`);

    return of(null).pipe(
      switchMap(() => {
        this.logger.info("check existence of file in cos");

        const { assetLogsPrefix } = this.configService.objectStorageConfig();
        const cosKey = this.tasksService.toTaskLogCosKey(params, assetLogsPrefix, ".zip");

        return this.ibmCosService.headObject$(cosKey).pipe(
          map(() => cosKey),
          catchError((e: IbmCosError<AWSError>) =>
            throwError(new BridgeXServerError(ErrorCode.NOT_FOUND, "specified log file is not found", e)),
          ),
        );
      }),
      switchMap((objectName: string) => {
        this.logger.info("create signed url of log file");

        const expireSecond = this.configService.objectStorageConfig().logSignedUrlAvailableTime;
        return this.ibmCosService
          .getObjectUrl$(objectName, expireSecond)
          .pipe(
            catchError((e: IbmCosError<AWSError>) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "could not get signed url", e))),
          );
      }),
      map((signedUrl: string) => ({
        assetLogURL: signedUrl,
      })),
    );
  }
}
