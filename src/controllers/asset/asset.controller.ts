import { Controller, Get, Param, HttpException, NotFoundException, HttpCode, UseGuards } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { tap, catchError, map } from "rxjs/operators";

import { Asset } from "./asset.controller.i";
import { GuardAsset } from "./asset.controller.guard";
import { AssetStatusService as AssetService, Asset as AssetData, EAssetStatus as EAssetStatusOfService } from "../../service/asset-status";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { EAssetStatus } from "../bulk-assets-getmany/bulk-assets-getmany.controller.i";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

@Controller("/types/:typeId/assets/:assetId")
@UseGuards(BearerTokenGuard)
export class AssetController {
  constructor(private assetService: AssetService, private guard: GuardAsset, private logger: LoggerService) {}

  @Get()
  @HttpCode(200)
  public getAsset(@Param("typeId") typeId: string, @Param("assetId") assetId: string): Observable<Asset> {
    this.logger.info(`Enter GET /types/:typeId/assets/:assetId`);

    const params = {
      typeId,
      assetId,
    };

    if (!this.guard.isGetAssetParams(params)) {
      return throwError(new NotFoundException(`Cannot GET /types/${typeId}/assets/${assetId}`));
    }

    return this.assetService.getAsset$(params).pipe(
      tap(() => this.logger.info("Succeeded to get asset ")),
      map((response: AssetData) => {
        const convert = (data: AssetData): Asset => {
          return {
            ...data,
            status: !data.status || data.status === EAssetStatusOfService.Online ? EAssetStatus.Missing : (data.status as any),
          };
        };
        return convert(response);
      }),
      catchError((err: BridgeXServerError) => throwError(new HttpException(ErrorCode.categorize(err), err.code))),
    );
  }
}
