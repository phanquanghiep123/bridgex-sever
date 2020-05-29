import { Module } from "@nestjs/common";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { ZipService } from "./zip.service";

@Module({
  providers: [ZipService],
  imports: [LoggerServiceModule],
  exports: [ZipService],
})
export class ZipServiceModule {}
