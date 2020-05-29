import { Module } from "@nestjs/common";

import { LoggerServiceModule } from "../../../../service/logger";

import { BearerTokenGuardModule } from "../../../../guards/bearer-token";

import { MqttPublishServiceModule } from "../../../../service/mqtt-publish";

import { MqttSessionController } from "./mqtt-session.controller";

import { GuardMqttSession } from "./mqtt-session.controller.guard";

import { MqttSessionServiceModule } from "../../services/mqtt-session";

// -------------------------------------------------

@Module({
  controllers: [MqttSessionController],
  imports: [LoggerServiceModule, BearerTokenGuardModule, MqttSessionServiceModule, MqttPublishServiceModule],
  providers: [GuardMqttSession],
})
export class MqttSessionControllerModule {
  constructor() {}
}
