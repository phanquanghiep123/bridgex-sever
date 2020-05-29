import { Module } from "@nestjs/common";

import { AssetInventoryController } from "./asset-inventory.controller";
import { AssetInventoryServiceModule } from "../../service/asset-inventory";
import { LoggerServiceModule } from "../../service/logger";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { GuardAssetInventory } from "./asset-inventory.controller.guard";

@Module({
  controllers: [AssetInventoryController],
  imports: [AssetInventoryServiceModule, LoggerServiceModule],
  providers: [GuardMqttMessage, GuardAssetInventory],
})
export class AssetInventoryMqttModule {}
