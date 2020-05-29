import { Module } from "@nestjs/common";

import { FirmwareUpdatedController } from "./firmware-updated.controller";
import { LoggerServiceModule } from "../../service/logger";
import { AssetEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [FirmwareUpdatedController],
  imports: [AssetEventListServiceModule, LoggerServiceModule],
})
export class FirmwareUpdatedMqttModule {}
