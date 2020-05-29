import { Module } from "@nestjs/common";
import { PackageValidationService } from "./package-validation.service";
import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { PackageValidationServiceGuard } from "./package-validation.service.guard";
import { UnzipServiceModule } from "../unzip/unzip.service.module";

@Module({
  controllers: [],
  providers: [PackageValidationService, PackageValidationServiceGuard],
  imports: [ConfigServiceModule, LoggerServiceModule, UnzipServiceModule],
  exports: [PackageValidationService],
})
export class PackageValidationServiceModule {}
