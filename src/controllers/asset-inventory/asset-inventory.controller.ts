import { Controller, Get, HttpCode, Param, HttpException, NotFoundException, UseGuards } from "@nestjs/common";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { GuardAssetInventory } from "./asset-inventory.controller.guard";
import { LoggerService } from "../../service/logger";

import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { tap, map, catchError } from "rxjs/operators";
import { throwError } from "rxjs";
import { AssetInventoryService, AssetInventoryResponse } from "../../service/asset-inventory";

@Controller("/types/:typeId/assets/:assetId/inventory")
@UseGuards(BearerTokenGuard)
export class AssetInventoryController {
  constructor(private guard: GuardAssetInventory, private logger: LoggerService, private assetInventoryService: AssetInventoryService) {}
  @Get()
  @HttpCode(200)
  public getAssetsInventory(@Param("typeId") typeId: string, @Param("assetId") assetId: string) {
    this.logger.info("Enter GET /types/:typeId/assets/:assetId/inventory");
    const params = {
      typeId,
      assetId,
    };
    if (!this.guard.isGetAssetInventoryParams(params)) {
      return throwError(new NotFoundException(`Cannot GET /types/${typeId}/assets/${assetId}/inventory`));
    }

    return this.assetInventoryService.getAssetsInventory$(params).pipe(
      tap(() => this.logger.info("Succeeded to get asset status")),
      map((res: AssetInventoryResponse) => {
        const convert = (data: AssetInventoryResponse): AssetInventoryResponse => ({
          ...data,
          subAssets: data.subAssets
            ? data.subAssets.map((inventory) => ({
                ...inventory,
                cashUnits: inventory.cashUnits
                  ? inventory.cashUnits.map((cashUnit) => ({
                      unit: cashUnit.unit,
                      capacity: cashUnit.capacity,
                      status: cashUnit.status,
                      denominations: cashUnit.denominations
                        ? cashUnit.denominations.map((denomi) => ({
                            count: denomi.count,
                            currencyCode: denomi.currencyCode,
                            faceValue: denomi.faceValue,
                          }))
                        : [],
                    }))
                  : [],
              }))
            : [],
        });
        return convert(res);
      }),
      catchError((err: BridgeXServerError) => throwError(new HttpException(ErrorCode.categorize(err), err.code))),
    );
  }
}
