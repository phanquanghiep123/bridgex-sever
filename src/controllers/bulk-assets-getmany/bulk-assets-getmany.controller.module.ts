import { Module } from "@nestjs/common";

import { BulkAssetsGetManyController } from "./bulk-assets-getmany.controller";
import { GuardBulkAssetsGetMany } from "./bulk-assets-getmany.controller.guard";

import { AssetStatusServiceModule } from "../../service/asset-status/asset-status.service.module";
import { ErrorInformationServiceModule } from "../../service/error-information";
import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

@Module({
  controllers: [BulkAssetsGetManyController],
  imports: [AssetStatusServiceModule, ErrorInformationServiceModule, LoggerServiceModule, BearerTokenGuardModule],
  providers: [GuardBulkAssetsGetMany],
})
export class BulkAssetsGetManyModule {
  constructor() {}
}
