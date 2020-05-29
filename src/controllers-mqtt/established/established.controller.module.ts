import { Module } from "@nestjs/common";

import { EstablishedController } from "./established.controller";
import { AssetVersionsServiceModule } from "../../service/asset-versions";
import { LoggerServiceModule } from "../../service/logger";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { GuardEstablished } from "./established.controller.guard";
import { AssetEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [EstablishedController],
  imports: [AssetVersionsServiceModule, AssetEventListServiceModule, LoggerServiceModule],
  providers: [GuardMqttMessage, GuardEstablished],
})
export class EstablishedMqttModule {}
