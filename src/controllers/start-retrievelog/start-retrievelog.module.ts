import { Module } from "@nestjs/common";

import { StartRetrieveLogController } from "./start-retrievelog.controller";
import { GuardStartRetrieveLog } from "./start-retrievelog.controller.guard";
import { TasksServiceModule } from "../../service/tasks";
import { MqttPublishServiceModule } from "../../service/mqtt-publish";
import { ConfigService } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";
import { HttpClientServiceModule } from "../../service/http-client";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { BridgeEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [StartRetrieveLogController],
  imports: [
    TasksServiceModule,
    MqttPublishServiceModule,
    ConfigService,
    LoggerServiceModule,
    HttpClientServiceModule,
    AssetStatusServiceModule,
    BridgeEventListServiceModule,
  ],
  providers: [GuardStartRetrieveLog],
})
export class StartRetrieveLogControllerModule {}
