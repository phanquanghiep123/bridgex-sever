import { Module } from "@nestjs/common";

import { BulkPackagesStatusController } from "./bulk-packages-status.controller";
import { GuardBulkPackagesStatus } from "./bulk-packages-status.controller.guard";

import { PackagesServiceModule } from "../../service/packages/packages.service.module";
import { ErrorInformationServiceModule } from "../../service/error-information";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [BulkPackagesStatusController],
  imports: [PackagesServiceModule, ErrorInformationServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardBulkPackagesStatus],
})
export class BulkPackagesStatusModule {
  constructor() {}
}
