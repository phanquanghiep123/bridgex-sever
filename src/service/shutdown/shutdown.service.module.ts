import { Module } from "@nestjs/common";

import { LoggerServiceModule } from "../logger";

import { ShutdownService } from "./shutdown.service";

@Module({
  imports: [LoggerServiceModule],
  providers: [ShutdownService],
  exports: [ShutdownService],
})
export class ShutdownServiceModule {}
