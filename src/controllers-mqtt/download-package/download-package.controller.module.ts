import { Module } from "@nestjs/common";

import { DownloadPackageController } from "./download-package.controller";
import { TasksServiceModule } from "../../service/tasks";
import { ConfigService } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";
import { HttpClientServiceModule } from "../../service/http-client";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { BridgeEventListServiceModule } from "../../service/event-list";
import { MqttPublishServiceModule } from "../../service/mqtt-publish";

@Module({
  controllers: [DownloadPackageController],
  imports: [
    TasksServiceModule,
    LoggerServiceModule,
    ConfigService,
    LoggerServiceModule,
    HttpClientServiceModule,
    AssetStatusServiceModule,
    BridgeEventListServiceModule,
    MqttPublishServiceModule,
  ],
  providers: [GuardMqttMessage],
})
export class DownloadPackageMqttModule {}
