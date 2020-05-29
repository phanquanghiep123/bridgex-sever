import { Controller, Get, Param, HttpCode, NotFoundException, HttpException, UseGuards } from "@nestjs/common";
import { Observable, throwError } from "rxjs";

import { LoggerService } from "../../service/logger";
import { GuardAssetVersions } from "./asset-versions.controller.guard";

import { GetAssetVersionsParams } from "./asset-versions.controller.i";
import { AssetVersionsService, AssetVersion } from "../../service/asset-versions";
import { tap, catchError } from "rxjs/operators";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

@Controller("/types/:typeId/assets/:assetId/versions")
@UseGuards(BearerTokenGuard)
export class AssetVersionsController {
  constructor(private assetVersionsService: AssetVersionsService, private guard: GuardAssetVersions, private logger: LoggerService) {}

  @Get()
  @HttpCode(200)
  public getAssetVersions(@Param("typeId") typeId: string, @Param("assetId") assetId: string): Observable<AssetVersion[]> {
    this.logger.info(`Enter GET /types/:typeId/assets/:assetId/versions`);

    const params: GetAssetVersionsParams = {
      typeId,
      assetId,
    };

    if (!this.guard.isGetAssetVersionsParams(params)) {
      return throwError(new NotFoundException("Invalid Request Path Params"));
    }

    return this.assetVersionsService.get$(params).pipe(
      tap(() => this.logger.info("Succeeded to get asset versions")),
      catchError((err: BridgeXServerError) => throwError(new HttpException(ErrorCode.categorize(err), err.code))),
    );
  }
}
