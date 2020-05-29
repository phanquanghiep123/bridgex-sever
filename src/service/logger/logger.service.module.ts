import { Module } from "@nestjs/common";
import { LoggerService, logger } from "./logger.service";

@Module({
  providers: [
    {
      provide: LoggerService,
      useValue: logger,
    },
  ],
  exports: [LoggerService],
})
export class LoggerServiceModule {}
