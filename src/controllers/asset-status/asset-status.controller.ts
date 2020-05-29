import {
  Controller,
  Get,
  Param,
  HttpException,
  NotFoundException,
  HttpCode,
  Put,
  Body,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { tap, catchError, map } from "rxjs/operators";

import { AssetStatus, PutAssetStatusBody } from "./asset-status.controller.i";
import { GuardAssetStatus } from "./asset-status.controller.guard";
import {
  AssetStatusService,
  AssetStatus as AssetStatusData,
  UpsertNoteParams,
  EAssetStatus as EAssetStatusOfService,
} from "../../service/asset-status";
import { ErrorInformationService } from "../../service/error-information";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { EAssetStatus } from "../bulk-assets-getmany/bulk-assets-getmany.controller.i";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

@Controller("/types/:typeId/assets/:assetId")
@UseGuards(BearerTokenGuard)
export class AssetStatusController {
  constructor(
    private assetStatusService: AssetStatusService,
    private errorInformationService: ErrorInformationService,
    private guard: GuardAssetStatus,
    private logger: LoggerService,
  ) {}

  @Get("status")
  @HttpCode(200)
  public getAsset(@Param("typeId") typeId: string, @Param("assetId") assetId: string): Observable<AssetStatus> {
    this.logger.info(`Enter GET /types/:typeId/assets/:assetId/status`);

    const params = {
      typeId,
      assetId,
    };

    if (!this.guard.isGetAssetStatusParams(params)) {
      return throwError(new NotFoundException(`Cannot GET /types/${typeId}/assets/${assetId}/status`));
    }

    return this.assetStatusService.get$(params).pipe(
      tap(() => this.logger.info("Succeeded to get asset status")),
      map((response: AssetStatusData) => {
        const convert = (data: AssetStatusData): AssetStatus => {
          return {
            typeId: data.typeId,
            assetId: data.assetId,
            status: !data.status || data.status === EAssetStatusOfService.Online ? EAssetStatus.Missing : (data.status as any),
            errorCode: data.errorCode,
            errorMessage: data.errorCode ? this.errorInformationService.getErrorMessage(data.typeId, data.errorCode) : undefined,
            subAssets: data.subAssets ? data.subAssets.map((d) => convert(d)) : undefined,
          };
        };
        return convert(response);
      }),
      catchError((err: BridgeXServerError) => throwError(new HttpException(ErrorCode.categorize(err), err.code))),
    );
  }

  @Put()
  @HttpCode(204)
  public putAsset(@Param("typeId") typeId: string, @Param("assetId") assetId: string, @Body() body: PutAssetStatusBody): Observable<null> {
    this.logger.info(`Enter PUT /types/:typeId/assets/:assetId`);

    const params = {
      typeId,
      assetId,
    };

    if (!this.guard.isPutAssetStatusParams(params)) {
      return throwError(new NotFoundException(`Cannot PUT /types/${typeId}/assets/${assetId}`));
    }

    if (!this.guard.isPutAssetStatusBody(body)) {
      return throwError(new BadRequestException(`Cannot PUT /types/${typeId}/assets/${assetId}`));
    }

    const putParams: UpsertNoteParams = {
      typeId,
      assetId,
      note: body.note,
    };

    return this.assetStatusService.upsertNote$(putParams).pipe(
      tap(() => this.logger.info("Succeeded to put asset status")),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }
}
