import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices/decorators";
import { Observable, of, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";

import { LoggerService } from "../../service/logger/logger.service";

import { GuardConnectionEvent } from "./connection.controller.guard";

import { AssetStatusService, UpsertConnectionParams } from "../../service/asset-status";

import { ConnectionEventPayload, EConnection, EAssetStatus } from "./connection.controller.i";

import { GuardMqttMessage } from "../mqtt-message.guard";
import { AssetEventListService, ConnectedParams, DisconnectedParams } from "../../service/event-list";

// --------------------------------------------------

@Controller()
export class ConnectionController {
  constructor(
    private assetStatus: AssetStatusService,
    private eventListService: AssetEventListService,
    private logger: LoggerService,
    private guardMqttMessage: GuardMqttMessage,
    private guardConnectedEvent: GuardConnectionEvent,
  ) {}

  @EventPattern("/glory/g-connect/event/Connection")
  public handleConnectionEvent$(@Payload() payload: Record<string, unknown>): Observable<any> {
    if (!this.guardMqttMessage.isMqttMessagePayload(payload)) {
      return of(null);
    }

    if (!this.guardConnectedEvent.isConnectionEvent(payload.detail)) {
      return of(null);
    }

    this.logger.info(`/glory/g-connect/event/Connection of ${payload.assetMetaData.typeId}-${payload.assetMetaData.assetId}`);

    return of(null).pipe(
      switchMap(() => {
        return this.assetStatus.upsertConnection$(this.createUpsertConnectionParams(payload)).pipe(
          catchError((e) => {
            this.logger.error(`Failed to save connection, error cause: ${e}`);
            return throwError(e);
          }),
        );
      }),
      switchMap(() => {
        if (payload.detail.connection === EConnection.Connected) {
          return this.eventListService.insertConnected$(this.createInsertConnectionParams(payload)).pipe(
            catchError((e) => {
              this.logger.error(`Failed to save event of ${EConnection.Connected}, error cause: ${e}`);
              return throwError(e);
            }),
          );
        }

        if (payload.detail.connection === EConnection.Disconnected) {
          return this.eventListService.insertDisconnected$(this.createInsertConnectionParams(payload)).pipe(
            catchError((e) => {
              this.logger.error(`Failed to save event of ${EConnection.Disconnected}, error cause: ${e}`);
              return throwError(e);
            }),
          );
        }

        return of(null);
      }),
      catchError(() => of(null)),
    );
  }

  public createUpsertConnectionParams(input: Readonly<ConnectionEventPayload>): UpsertConnectionParams {
    return {
      typeId: input.assetMetaData.typeId,
      assetId: input.assetMetaData.assetId,
      ipAddress: input.detail.ipAddress,
      status: input.detail.connection === EConnection.Disconnected ? EAssetStatus.Missing : EAssetStatus.Online,
    };
  }

  public createInsertConnectionParams(input: Readonly<ConnectionEventPayload>): ConnectedParams | DisconnectedParams {
    return {
      typeId: input.assetMetaData.typeId,
      assetId: input.assetMetaData.assetId,
      ipAddress: input.detail.ipAddress,
    };
  }
}
