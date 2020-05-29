import { Module } from "@nestjs/common";

import { RetrieveLogController } from "./retrievelog.controller";
import { TasksServiceModule } from "../../service/tasks";
import { ConfigService } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";
import { HttpClientServiceModule } from "../../service/http-client";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { AssetStatusServiceModule } from "../../service/asset-status";
import { FtpClientServiceModule } from "../../service/ftp-client/ftp-client.service.module";
import { IbmCosServiceModule } from "../../service/ibm-cos";
import { BridgeEventListServiceModule } from "../../service/event-list";
import { MqttPublishServiceModule } from "../../service/mqtt-publish";
import { ZipLogServiceModule } from "../../service/zip-log";

@Module({
  controllers: [RetrieveLogController],
  imports: [
    TasksServiceModule,
    FtpClientServiceModule,
    IbmCosServiceModule,
    LoggerServiceModule,
    ConfigService,
    LoggerServiceModule,
    HttpClientServiceModule,
    AssetStatusServiceModule,
    BridgeEventListServiceModule,
    MqttPublishServiceModule,
    ZipLogServiceModule,
  ],
  providers: [GuardMqttMessage],
})
export class RetrieveLogMqttModule {}
