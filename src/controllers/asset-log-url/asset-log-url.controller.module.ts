import { Module } from "@nestjs/common";

import { LoggerServiceModule } from "../../service/logger";
import { BearerTokenGuardModule } from "../../guards/bearer-token/bearer-token.module";

import { AssetLogUrlController } from "./asset-log-url.controller";
import { AssetLogUrlServiceModule } from "../../service/asset-log-url/asset-log-url.service.module";

@Module({
  controllers: [AssetLogUrlController],
  imports: [LoggerServiceModule, BearerTokenGuardModule, AssetLogUrlServiceModule],
})
export class AssetLogUrlModule {}
