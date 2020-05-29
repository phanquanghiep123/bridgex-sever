import { Module } from "@nestjs/common";
import { AssetInventoryService } from "./asset-inventory.service";
import { PostgresServiceModule } from "../postgres/postgres.service.module";
import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";

@Module({
  controllers: [],
  providers: [AssetInventoryService],
  imports: [PostgresServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [AssetInventoryService],
})
export class AssetInventoryServiceModule {}
