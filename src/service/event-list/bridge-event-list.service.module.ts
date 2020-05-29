import { Module } from "@nestjs/common";
import { BridgeEventListService } from "./bridge-event-list.service";
import { EventListServiceModule } from "./event-list.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";

@Module({
  controllers: [],
  providers: [BridgeEventListService],
  imports: [EventListServiceModule, LoggerServiceModule],
  exports: [BridgeEventListService],
})
export class BridgeEventListServiceModule {}
