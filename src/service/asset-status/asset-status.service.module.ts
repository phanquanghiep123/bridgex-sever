import { Module } from "@nestjs/common";
import { AssetStatusService } from "./asset-status.service";
import { PostgresServiceModule } from "../postgres/postgres.service.module";
import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { GuardAssetStatusResponse } from "./asset-status.service.guard";

@Module({
  controllers: [],
  providers: [AssetStatusService, GuardAssetStatusResponse],
  imports: [PostgresServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [AssetStatusService],
})
export class AssetStatusServiceModule {}
