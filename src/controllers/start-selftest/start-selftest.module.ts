import { Module } from "@nestjs/common";

import { StartSelfTestController } from "./start-selftest.controller";
import { GuardStartSelfTest } from "./start-selftest.controller.guard";
import { TasksServiceModule } from "../../service/tasks";
import { MqttPublishServiceModule } from "../../service/mqtt-publish";
import { ConfigService } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";
import { HttpClientServiceModule } from "../../service/http-client";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { BridgeEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [StartSelfTestController],
  imports: [
    TasksServiceModule,
    MqttPublishServiceModule,
    ConfigService,
    LoggerServiceModule,
    HttpClientServiceModule,
    AssetStatusServiceModule,
    BridgeEventListServiceModule,
  ],
  providers: [GuardStartSelfTest],
})
export class StartSelfTestControllerModule {}
