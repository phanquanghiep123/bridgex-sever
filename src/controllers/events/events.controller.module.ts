import { Module } from "@nestjs/common";

import { EventsController } from "./events.controller";
import { GuardEvents } from "./events.controller.guard";

import { EventListServiceModule } from "../../service/event-list";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [EventsController],
  imports: [EventListServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardEvents],
})
export class EventsControllerModule {
  constructor() {}
}
