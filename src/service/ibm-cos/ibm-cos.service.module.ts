import { Module } from "@nestjs/common";
import { IbmCosService } from "./ibm-cos.service";
import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";

// -----------------------------------------------------

@Module({
  controllers: [],
  providers: [IbmCosService],
  imports: [ConfigServiceModule, LoggerServiceModule],
  exports: [IbmCosService],
})
export class IbmCosServiceModule {}
