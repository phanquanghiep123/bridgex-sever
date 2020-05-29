import { Module } from "@nestjs/common";

import { RebootController } from "./reboot.controller";
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

@Module({
  controllers: [RebootController],
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
  ],
  providers: [GuardMqttMessage],
})
export class RebootMqttModule {}
