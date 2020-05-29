import { Module } from "@nestjs/common";
import { ErrorInformationService } from "./error-information.service";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { GuardErrorInformationMap } from "./error-information.service.guard";

@Module({
  controllers: [],
  providers: [ErrorInformationService, GuardErrorInformationMap],
  imports: [LoggerServiceModule],
  exports: [ErrorInformationService],
})
export class ErrorInformationServiceModule {}
