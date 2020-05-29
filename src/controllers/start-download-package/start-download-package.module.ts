import { Module } from "@nestjs/common";

import { StartDownloadPackageController } from "./start-download-package.controller";
import { GuardStartDownloadPackage } from "./start-download-package.controller.guard";
import { TasksServiceModule } from "../../service/tasks";
import { IbmCosServiceModule } from "../../service/ibm-cos";
import { MqttPublishServiceModule } from "../../service/mqtt-publish";
import { ConfigService } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";
import { HttpClientServiceModule } from "../../service/http-client";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { BridgeEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [StartDownloadPackageController],
  imports: [
    TasksServiceModule,
    IbmCosServiceModule,
    MqttPublishServiceModule,
    ConfigService,
    LoggerServiceModule,
    HttpClientServiceModule,
    AssetStatusServiceModule,
    BridgeEventListServiceModule,
  ],
  providers: [GuardStartDownloadPackage],
})
export class StartDownloadPackageControllerModule {}
