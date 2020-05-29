import { Module, Global, HttpModule } from "@nestjs/common";

import { ConfigServiceModule } from "../../service/config";
import { LoggerServiceModule } from "../../service/logger";

@Global()
export class HttpExtendedModule extends HttpModule {}

@Module({
  imports: [HttpExtendedModule, ConfigServiceModule, LoggerServiceModule],
})
export class BearerTokenGuardModule {
  constructor() {}
}
