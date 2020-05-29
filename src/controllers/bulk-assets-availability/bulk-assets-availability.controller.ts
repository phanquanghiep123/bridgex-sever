import { Controller, Get, UseGuards, HttpException } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { AssetAvailability, EAssetStatus } from "./bulk-assets-availability.controller.i";
import { AssetStatusService, EAssetStatus as EAssetStatusOfService, GetAssetAvailability } from "../../service/asset-status";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

@Controller("/bulk/assets/availability/")
@UseGuards(BearerTokenGuard)
export class BulkAssetsAvailabilityController {
  constructor(private assetStatusService: AssetStatusService, private logger: LoggerService) {}

  @Get()
  public get(): Observable<AssetAvailability[]> {
    this.logger.info("Enter GET /bulk/assets/availability/");

    return this.assetStatusService.getAssetAvailability$().pipe(
      map((records: GetAssetAvailability[]) =>
        records.reduce(
          (r: AssetAvailability[], data: GetAssetAvailability): AssetAvailability[] =>
            r.map((input: AssetAvailability) => this.addCount(input, data)),
          [
            { status: EAssetStatus.Good, count: 0 },
            { status: EAssetStatus.Error, count: 0 },
            { status: EAssetStatus.Missing, count: 0 },
          ],
        ),
      ),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public addCount(input: AssetAvailability, data: GetAssetAvailability) {
    return input.status === this.getEAssetStatus(data.status) ? { ...input, count: input.count + data.count } : input;
  }

  public getEAssetStatus(assetStatusOfService: EAssetStatusOfService): EAssetStatus {
    switch (assetStatusOfService) {
      case EAssetStatusOfService.Good: {
        return EAssetStatus.Good;
      }
      case EAssetStatusOfService.Error: {
        return EAssetStatus.Error;
      }
      case EAssetStatusOfService.Missing:
      case EAssetStatusOfService.Online:
      default: {
        return EAssetStatus.Missing;
      }
    }
  }
}
