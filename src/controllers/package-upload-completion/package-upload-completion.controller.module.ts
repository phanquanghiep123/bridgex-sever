import { Module } from "@nestjs/common";

import { PackageUploadCompletionController } from "./package-upload-completion.controller";
import { GuardPackageUploadCompletion } from "./package-upload-completion.controller.guard";

import { PackagesServiceModule } from "../../service/packages";
import { IbmCosServiceModule } from "../../service/ibm-cos";
import { PackageValidationServiceModule } from "../../service/package-validation";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";
import { FtpClientServiceModule } from "../../service/ftp-client/ftp-client.service.module";
import { ConfigServiceModule } from "../../service/config";

@Module({
  controllers: [PackageUploadCompletionController],
  imports: [
    PackagesServiceModule,
    IbmCosServiceModule,
    PackageValidationServiceModule,
    LoggerServiceModule,
    BearerTokenGuardModule,
    FtpClientServiceModule,
    ConfigServiceModule,
  ],
  providers: [GuardPackageUploadCompletion],
})
export class PackageUploadCompletionControllerModule {
  constructor() {}
}
