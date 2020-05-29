import { Controller, ValidationPipe } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices/decorators";

import { Observable, of, throwError } from "rxjs";
import { switchMap, catchError } from "rxjs/operators";

import { AssetEventListService, FirmwareUpdatedParams } from "../../service/event-list";
import { LoggerService } from "../../service/logger";

import { FirmwareUpdatedPayload } from "./firmware-updated.controller.i";

// --------------------------------------------------

@Controller()
export class FirmwareUpdatedController {
  constructor(private eventListService: AssetEventListService, private logger: LoggerService) {}

  @EventPattern("/glory/g-connect/event/FirmwareUpdated")
  public handleFirmwareUpdated$(@Payload(new ValidationPipe({ transform: true })) payload: FirmwareUpdatedPayload): Observable<any> {
    this.logger.info(`/glory/g-connect/event/FirmwareUpdated of ${payload.assetMetaData.typeId}-${payload.assetMetaData.assetId}`);

    return of(null).pipe(
      switchMap(() => {
        return this.eventListService.insertFirmwareUpdated$(this.createInsertFirmwareUpdated(payload)).pipe(
          catchError((e) => {
            this.logger.error(`Failed to save event of FirmwareUpdated, error cause: ${e}`);
            return throwError(e);
          }),
        );
      }),
      catchError(() => of(null)),
    );
  }

  public createInsertFirmwareUpdated(input: FirmwareUpdatedPayload): FirmwareUpdatedParams {
    return {
      typeId: input.assetMetaData.typeId,
      assetId: input.assetMetaData.assetId,
      packageList: input.detail.package,
    };
  }
}
