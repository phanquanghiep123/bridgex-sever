import { Module } from "@nestjs/common";
import { AssetVersionsService } from "./asset-versions.service";
import { ConfigServiceModule } from "../config/config.service.module";
import { HttpClientServiceModule } from "../http-client";
import { LoggerServiceModule } from "../logger";
import { PostgresServiceModule } from "../postgres/postgres.service.module";
import { GuardAssetVersionsResponse } from "./asset-versions.service.guard";

@Module({
  providers: [AssetVersionsService, GuardAssetVersionsResponse],
  imports: [PostgresServiceModule, HttpClientServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [AssetVersionsService],
})
export class AssetVersionsServiceModule {}
