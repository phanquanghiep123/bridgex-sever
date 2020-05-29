import { Module } from "@nestjs/common";
import { PackagesService } from "./packages.service";
import { PostgresServiceModule } from "../postgres/postgres.service.module";
import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";

@Module({
  controllers: [],
  providers: [PackagesService],
  imports: [PostgresServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [PackagesService],
})
export class PackagesServiceModule {}
