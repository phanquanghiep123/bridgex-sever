import { Module } from "@nestjs/common";

import { BulkAssetsAvailabilityController } from "./bulk-assets-availability.controller";
import { AssetStatusServiceModule } from "../../service/asset-status/asset-status.service.module";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [BulkAssetsAvailabilityController],
  imports: [AssetStatusServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [],
})
export class BulkAssetsAvailabilityModule {
  constructor() {}
}
