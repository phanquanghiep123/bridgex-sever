import { Module } from "@nestjs/common";

import { AssetTypeController, RegionController, CustomerController, LocationController } from "./asset-filter.controller";
import { GuardAssetFilter } from "./asset-filter.controller.guard";

import { AssetFilterServiceModule } from "../../service/asset-filter";
import { ErrorInformationServiceModule } from "../../service/error-information";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [AssetTypeController, RegionController, CustomerController, LocationController],
  imports: [AssetFilterServiceModule, ErrorInformationServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardAssetFilter],
})
export class AssetFilterModule {
  constructor() {}
}
