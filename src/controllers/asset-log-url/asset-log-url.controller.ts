import { Controller, Get, Param, HttpCode, UseGuards, HttpException } from "@nestjs/common";
import { Observable, throwError } from "rxjs";

import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { AssetLogUrlService } from "../../service/asset-log-url/asset-log-url.service";

import { AssetLogUrlControllerGetParams, AssetLogUrlControllerGetResponse } from "./asset-log-url.controller.i";
import { AssetLogUrlServiceGetParams } from "../../service/asset-log-url/asset-log-url.service.i";
import { tap, catchError } from "rxjs/operators";
import { BridgeXServerError, ErrorCode } from "../../service/utils";

@Controller("/assetLogURL")
@UseGuards(BearerTokenGuard)
export class AssetLogUrlController {
  constructor(private logger: LoggerService, private service: AssetLogUrlService) {}

  @Get("/tasks/:taskId/types/:typeId/assets/:assetId")
  @HttpCode(200)
  public getAssetLogUrl(@Param() params: AssetLogUrlControllerGetParams): Observable<AssetLogUrlControllerGetResponse> {
    this.logger.info(`Enter GET /assetLogURL/tasks/:taskId/types/:typeId/assets/:assetId`, params);

    const serviceParams: AssetLogUrlServiceGetParams = params;

    return this.service.getAssetLogUrl(serviceParams).pipe(
      tap(() => this.logger.info("Succeeded to get asset log url")),
      catchError((err: BridgeXServerError) => {
        this.logger.info("Failed to get asset log url");
        return throwError(new HttpException(ErrorCode.categorize(err), err.code));
      }),
    );
  }
}
