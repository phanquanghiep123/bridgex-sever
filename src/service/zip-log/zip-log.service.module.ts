import { Module } from "@nestjs/common";
import { ZipLogService } from "./zip-log.service";
import { GuardZipLogService } from "./zip-log.service.guard";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { ZipServiceModule } from "../zip";

@Module({
  providers: [ZipLogService, GuardZipLogService],
  imports: [ZipServiceModule, LoggerServiceModule],
  exports: [ZipLogService],
})
export class ZipLogServiceModule {}
