import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices/decorators";
import { Observable, of } from "rxjs";
import { tap, catchError } from "rxjs/operators";

import { AssetInventoryService, UpsertAssetInventoryParams } from "../../service/asset-inventory";

import { LoggerService } from "../../service/logger";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { GuardAssetInventory } from "./asset-inventory.controller.guard";
import { AssetInventoryEventPayload } from "./asset-inventory.controller.i";

// --------------------------------------------------

@Controller()
export class AssetInventoryController {
  constructor(
    private assetInventoryService: AssetInventoryService,
    private logger: LoggerService,
    private guardMqttMessage: GuardMqttMessage,
    private guardDeviceStatusUpdated: GuardAssetInventory,
  ) {}

  @EventPattern("/glory/g-connect/event/InventoryChanged")
  public handleAssetInventoryEvent$(@Payload() payload: Record<string, unknown>): Observable<any> {
    if (!this.guardMqttMessage.isMqttMessagePayload(payload)) {
      return of(null);
    }

    if (!this.guardDeviceStatusUpdated.isAssetInventoryEvent(payload.detail)) {
      return of(null);
    }

    const assetInventoryEvent: Readonly<AssetInventoryEventPayload> = payload as any;

    const params: UpsertAssetInventoryParams = {
      typeId: assetInventoryEvent.assetMetaData.typeId,
      assetId: assetInventoryEvent.assetMetaData.assetId,
      units: assetInventoryEvent.detail.cashUnits,
    };

    return this.assetInventoryService.upsertAssetInventory$(params).pipe(
      tap(() => this.logger.info(`Succeeded to process InventoryChanged event about ${params.typeId}:${params.assetId}`)),
      catchError((e: any) => {
        this.logger.error(`Failed to process InventoryChanged event about ${params.typeId}:${params.assetId}, error cause: ${e}`);
        return of(null);
      }),
    );
  }
}
