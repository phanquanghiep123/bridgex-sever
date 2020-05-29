import { Module } from "@nestjs/common";

import { UserAuthService } from "./user-auth.service";
import { GuardUserAuthService } from "./user-auth.service.guard";
import { HttpClientServiceModule } from "../http-client";
import { ConfigServiceModule } from "../config/config.service.module";
import { LoggerServiceModule } from "../logger/logger.service.module";

@Module({
  providers: [UserAuthService, GuardUserAuthService],
  imports: [HttpClientServiceModule, ConfigServiceModule, LoggerServiceModule],
  exports: [UserAuthService],
})
export class UserAuthServiceModule {}
