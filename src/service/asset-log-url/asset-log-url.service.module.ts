import { Module } from "@nestjs/common";

import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";

import { AssetLogUrlService } from "./asset-log-url.service";
import { IbmCosServiceModule } from "../ibm-cos";
import { TasksServiceModule } from "../tasks";

@Module({
  providers: [AssetLogUrlService],
  imports: [TasksServiceModule, IbmCosServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [AssetLogUrlService],
})
export class AssetLogUrlServiceModule {}
