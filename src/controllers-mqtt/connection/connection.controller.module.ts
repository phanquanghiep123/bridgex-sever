import { Module } from "@nestjs/common";

import { ConnectionController } from "./connection.controller";
import { LoggerServiceModule } from "../../service/logger/logger.service.module";
import { GuardConnectionEvent } from "./connection.controller.guard";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { AssetEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [ConnectionController],
  imports: [AssetStatusServiceModule, AssetEventListServiceModule, LoggerServiceModule],
  providers: [GuardMqttMessage, GuardConnectionEvent],
})
export class ConnectionMqttModule {}
