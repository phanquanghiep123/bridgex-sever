import { Module } from "@nestjs/common";
import { AssetInventoryController } from "./asset-inventory.controller";
import { GuardAssetInventory } from "./asset-inventory.controller.guard";

import { AssetInventoryServiceModule } from "../../service/asset-inventory";
import { ErrorInformationServiceModule } from "../../service/error-information";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [AssetInventoryController],
  imports: [AssetInventoryServiceModule, ErrorInformationServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardAssetInventory],
})
export class AssetInventoryModule {}
