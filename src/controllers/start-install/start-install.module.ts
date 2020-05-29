import { Module } from "@nestjs/common";

import { StartInstallController } from "./start-install.controller";
import { GuardStartInstall } from "./start-install.controller.guard";
import { TasksServiceModule } from "../../service/tasks";
import { MqttPublishServiceModule } from "../../service/mqtt-publish";
import { ConfigService } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";
import { HttpClientServiceModule } from "../../service/http-client";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { BridgeEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [StartInstallController],
  imports: [
    TasksServiceModule,
    MqttPublishServiceModule,
    ConfigService,
    LoggerServiceModule,
    HttpClientServiceModule,
    AssetStatusServiceModule,
    BridgeEventListServiceModule,
  ],
  providers: [GuardStartInstall],
})
export class StartInstallControllerModule {}
