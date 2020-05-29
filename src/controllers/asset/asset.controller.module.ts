import { Module } from "@nestjs/common";

import { AssetController } from "./asset.controller";
import { GuardAsset } from "./asset.controller.guard";

import { AssetStatusServiceModule } from "../../service/asset-status";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [AssetController],
  imports: [AssetStatusServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardAsset],
})
export class AssetModule {
  constructor() {}
}
