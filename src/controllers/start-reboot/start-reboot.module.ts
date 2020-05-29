import { Module } from "@nestjs/common";

import { StartRebootController } from "./start-reboot.controller";
import { GuardStartReboot } from "./start-reboot.controller.guard";
import { TasksServiceModule } from "../../service/tasks";
import { MqttPublishServiceModule } from "../../service/mqtt-publish";
import { ConfigService } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";
import { HttpClientServiceModule } from "../../service/http-client";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { BridgeEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [StartRebootController],
  imports: [
    TasksServiceModule,
    MqttPublishServiceModule,
    ConfigService,
    LoggerServiceModule,
    HttpClientServiceModule,
    AssetStatusServiceModule,
    BridgeEventListServiceModule,
  ],
  providers: [GuardStartReboot],
})
export class StartRebootControllerModule {}
