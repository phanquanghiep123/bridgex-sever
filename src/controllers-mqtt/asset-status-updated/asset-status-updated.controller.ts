import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices/decorators";
import { Observable, of, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";

import { AssetStatusService, UpsertAssetStatusParams } from "../../service/asset-status";

import { LoggerService } from "../../service/logger";

import { GuardMqttMessage } from "../mqtt-message.guard";

import { GuardAssetUpdatedStatus } from "./asset-status-updated.controller.guard";

import { AssetStatusUpdatedEventPayload, EAssetStatus } from "./asset-status-updated.controller.i";
import { AssetStatusErrorParams, AssetEventListService } from "../../service/event-list";

// --------------------------------------------------

@Controller()
export class AssetStatusUpdatedController {
  constructor(
    private assetStatusService: AssetStatusService,
    private eventListService: AssetEventListService,
    private logger: LoggerService,
    private guardMqttMessage: GuardMqttMessage,
    private guardAssetStatusUpdated: GuardAssetUpdatedStatus,
  ) {}

  @EventPattern("/glory/g-connect/event/AssetStatusUpdated")
  public handleAssetStatusEvent$(@Payload() payload: Record<string, unknown>): Observable<null> {
    if (!this.guardMqttMessage.isMqttMessagePayload(payload)) {
      return of(null);
    }

    if (!this.guardAssetStatusUpdated.isAssetStatusUpdatedEvent(payload.detail)) {
      return of(null);
    }

    this.logger.info(`/glory/g-connect/event/AssetStatusUpdated of ${payload.assetMetaData.typeId}-${payload.assetMetaData.assetId}`);

    return of(null).pipe(
      switchMap(() => {
        return this.assetStatusService.upsertAssetStatus$(this.createUpsertAssetStatusParams(payload)).pipe(
          catchError((e) => {
            this.logger.error(`Failed to save asset status, error cause: ${e}`);
            return throwError(e);
          }),
        );
      }),
      switchMap(() => {
        if (payload.detail.status !== EAssetStatus.Error) {
          return of(null);
        }

        return this.eventListService.insertAssetStatusError$(this.createAssetStatusErrorParams(payload)).pipe(
          catchError((e) => {
            this.logger.error(`Failed to save event of asset status, error cause: ${e}`);
            return throwError(e);
          }),
        );
      }),
      catchError(() => of(null)),
    );
  }

  public createUpsertAssetStatusParams(input: AssetStatusUpdatedEventPayload): UpsertAssetStatusParams {
    return {
      typeId: input.assetMetaData.typeId,
      assetId: input.assetMetaData.assetId,
      status: input.detail.status,
      errorCode: input.detail.errorCode,
    };
  }

  public createAssetStatusErrorParams(input: AssetStatusUpdatedEventPayload): AssetStatusErrorParams {
    return {
      typeId: input.assetMetaData.typeId,
      assetId: input.assetMetaData.assetId,
      errorCode: input.detail.errorCode || "",
      errorMessage: input.detail.errorMsg,
    };
  }
}
