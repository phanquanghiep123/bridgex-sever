import { Module } from "@nestjs/common";

import { TasksController } from "./tasks.controller";
import { GuardTasks } from "./tasks.controller.guard";

import { TasksServiceModule } from "../../service/tasks";
import { UserAuthServiceModule } from "../../service/user-auth";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

import { ConfigServiceModule } from "../../service/config";
import { HttpClientServiceModule } from "../../service/http-client";
import { PackagesServiceModule } from "../../service/packages";
import { BridgeEventListServiceModule } from "../../service/event-list";

@Module({
  controllers: [TasksController],
  imports: [
    TasksServiceModule,
    UserAuthServiceModule,
    LoggerServiceModule,
    BearerTokenGuardModule,
    ConfigServiceModule,
    HttpClientServiceModule,
    PackagesServiceModule,
    BridgeEventListServiceModule,
  ],
  providers: [GuardTasks],
})
export class TasksControllerModule {
  constructor() {}
}
