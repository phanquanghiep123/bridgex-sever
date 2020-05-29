import { Module } from "@nestjs/common";
import { AssetEventListService } from "./asset-event-list.service";
import { EventListServiceModule } from "./event-list.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";

@Module({
  controllers: [],
  providers: [AssetEventListService],
  imports: [EventListServiceModule, LoggerServiceModule],
  exports: [AssetEventListService],
})
export class AssetEventListServiceModule {}
