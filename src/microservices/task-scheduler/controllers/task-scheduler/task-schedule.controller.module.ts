import { Module } from "@nestjs/common";

import { LoggerServiceModule } from "../../../../service/logger";

import { HttpClientServiceModule } from "../../../../service/http-client";

import { BearerTokenGuardModule } from "../../../../guards/bearer-token";

import { TaskScheduleController } from "./task-schedule.controller";

import { GuardTaskSchedule } from "./task-schedule.controller.guard";

// -------------------------------------------------

@Module({
  controllers: [TaskScheduleController],
  imports: [LoggerServiceModule, BearerTokenGuardModule, HttpClientServiceModule],
  providers: [GuardTaskSchedule],
})
export class TaskScheduleControllerModule {
  constructor() {}
}
