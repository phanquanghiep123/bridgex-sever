import { Module } from "@nestjs/common";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { UnzipService } from "./unzip.service";

@Module({
  providers: [UnzipService],
  imports: [LoggerServiceModule],
  exports: [UnzipService],
})
export class UnzipServiceModule {}
