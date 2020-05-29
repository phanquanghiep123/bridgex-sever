import { Module } from "@nestjs/common";
import { AssetFilterService } from "./asset-filter.service";
import { PostgresServiceModule } from "../postgres/postgres.service.module";
import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { GuardAssetFilterResponse } from "./asset-filter.service.guard";

@Module({
  controllers: [],
  providers: [AssetFilterService, GuardAssetFilterResponse],
  imports: [PostgresServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [AssetFilterService],
})
export class AssetFilterServiceModule {}
