import { Module } from "@nestjs/common";

import { PackageUploadFailureController } from "./package-upload-failure.controller";
import { GuardPackageUploadFailure } from "./package-upload-failure.controller.guard";

import { PackagesServiceModule } from "../../service/packages";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [PackageUploadFailureController],
  imports: [PackagesServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardPackageUploadFailure],
})
export class PackageUploadFailureControllerModule {
  constructor() {}
}
