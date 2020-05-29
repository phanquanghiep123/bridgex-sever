import { Module } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { PostgresServiceModule } from "../postgres/postgres.service.module";
import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { GuardTasksResponse } from "./tasks.service.guard";
@Module({
  controllers: [],
  providers: [TasksService, GuardTasksResponse],
  imports: [PostgresServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [TasksService],
})
export class TasksServiceModule {}
