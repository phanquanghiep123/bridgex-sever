import { Module } from "@nestjs/common";

import { AssetStatusController } from "./asset-status.controller";
import { GuardAssetStatus } from "./asset-status.controller.guard";

import { AssetStatusServiceModule } from "../../service/asset-status";
import { ErrorInformationServiceModule } from "../../service/error-information";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [AssetStatusController],
  imports: [AssetStatusServiceModule, ErrorInformationServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardAssetStatus],
})
export class AssetStatusModule {
  constructor() {}
}
