import { Module } from "@nestjs/common";

import { PackagesController } from "./packages.controller";
import { GuardPackages } from "./packages.controller.guard";

import { PackagesServiceModule } from "../../service/packages";
import { IbmCosServiceModule } from "../../service/ibm-cos";
import { UserAuthServiceModule } from "../../service/user-auth";
import { ConfigServiceModule } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";
import { FtpClientServiceModule } from "../../service/ftp-client/ftp-client.service.module";

@Module({
  controllers: [PackagesController],
  imports: [
    PackagesServiceModule,
    IbmCosServiceModule,
    UserAuthServiceModule,
    ConfigServiceModule,
    LoggerServiceModule,
    BearerTokenGuardModule,
    FtpClientServiceModule,
  ],
  providers: [GuardPackages],
})
export class PackagesControllerModule {
  constructor() {}
}
