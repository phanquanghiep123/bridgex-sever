import { Module } from "@nestjs/common";

import { BulkTasksStatusController } from "./bulk-tasks-status.controller";
import { GuardBulkTasksStatus } from "./bulk-tasks-status.controller.guard";

import { TasksServiceModule } from "../../service/tasks/tasks.service.module";
import { ErrorInformationServiceModule } from "../../service/error-information";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [BulkTasksStatusController],
  imports: [TasksServiceModule, ErrorInformationServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardBulkTasksStatus],
})
export class BulkTasksStatusModule {
  constructor() {}
}
