import { Module } from "@nestjs/common";

import { AssetStatusUpdatedController } from "./asset-status-updated.controller";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { LoggerServiceModule } from "../../service/logger";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { GuardAssetUpdatedStatus } from "./asset-status-updated.controller.guard";
import { AssetEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [AssetStatusUpdatedController],
  imports: [AssetStatusServiceModule, AssetEventListServiceModule, LoggerServiceModule],
  providers: [GuardMqttMessage, GuardAssetUpdatedStatus],
})
export class AssetStatusUpdatedMqttModule {}
