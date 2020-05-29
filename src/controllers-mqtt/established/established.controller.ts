import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices/decorators";

import { Observable, of, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";

import { AssetVersionsService, PostParams } from "../../service/asset-versions";
import { LoggerService } from "../../service/logger";
import { AssetEventListService, EstablishedParams } from "../../service/event-list";
import { GuardMqttMessage } from "../mqtt-message.guard";

import { GuardEstablished } from "./established.controller.guard";
import { AssetSubparts, EstablishedEventPayload } from "./established.controller.i";

// --------------------------------------------------

@Controller()
export class EstablishedController {
  constructor(
    private assetVersionsService: AssetVersionsService,
    private eventListService: AssetEventListService,
    private logger: LoggerService,
    private guardMqttMessage: GuardMqttMessage,
    private guardEstablished: GuardEstablished,
  ) {}

  @EventPattern("/glory/g-connect/event/Established")
  public handleAssetVersion$(@Payload() payload: Record<string, unknown>): Observable<any> {
    if (!this.guardMqttMessage.isMqttMessagePayload(payload)) {
      return of(null);
    }

    if (!this.guardEstablished.isEstablishedEvent(payload.detail)) {
      return of(null);
    }

    this.logger.info(`/glory/g-connect/event/Established of ${payload.assetMetaData.typeId}-${payload.assetMetaData.assetId}`);

    return of(null).pipe(
      switchMap(() => {
        return this.assetVersionsService.post$(this.createAssetVersionsService(payload)).pipe(
          catchError((e) => {
            this.logger.error(`Failed to save Established, error cause: ${e}`);
            return throwError(e);
          }),
        );
      }),
      switchMap(() => {
        return this.eventListService.insertEstablished$(this.createInsertEstablished(payload)).pipe(
          catchError((e) => {
            this.logger.error(`Failed to save event of Established, error cause: ${e}`);
            return throwError(e);
          }),
        );
      }),
      catchError(() => of(null)),
    );
  }

  public createAssetVersionsService(input: EstablishedEventPayload): PostParams {
    return {
      typeId: input.assetMetaData.typeId,
      assetId: input.assetMetaData.assetId,
      subparts: input.detail.versions.map(
        (version): AssetSubparts => ({
          subpartId: version.name,
          subpartVersion: version.value || "",
        }),
      ),
    };
  }

  public createInsertEstablished(input: EstablishedEventPayload): EstablishedParams {
    return {
      typeId: input.assetMetaData.typeId,
      assetId: input.assetMetaData.assetId,
      versions: input.detail.versions,
    };
  }
}
