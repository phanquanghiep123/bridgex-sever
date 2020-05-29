import { Module } from "@nestjs/common";

import { LoggerServiceModule } from "../../service/logger";
import { AssetVersionsServiceModule } from "../../service/asset-versions";

import { AssetVersionsController } from "./asset-versions.controller";
import { GuardAssetVersions } from "./asset-versions.controller.guard";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [AssetVersionsController],
  imports: [AssetVersionsServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardAssetVersions],
})
export class AssetVersionsModule {
  constructor() {}
}
