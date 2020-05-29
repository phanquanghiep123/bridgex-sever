import { Module } from "@nestjs/common";
import { EventListService } from "./event-list.service";
import { PostgresServiceModule } from "../postgres/postgres.service.module";
import { ConfigServiceModule } from "../config/config.service.module";
import { GuardEventListService } from "./event-list.service.guard";
import { LoggerServiceModule } from "../logger/logger.service.module";

@Module({
  controllers: [],
  providers: [EventListService, GuardEventListService],
  imports: [PostgresServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [EventListService],
})
export class EventListServiceModule {}
