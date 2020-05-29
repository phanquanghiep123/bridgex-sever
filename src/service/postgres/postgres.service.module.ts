import { Module } from "@nestjs/common";
import { PostgresService } from "./postgres.service";
import { LoggerServiceModule } from "../logger/logger.service.module";

@Module({
  providers: [PostgresService],
  imports: [LoggerServiceModule],
  exports: [PostgresService],
})
export class PostgresServiceModule {}
