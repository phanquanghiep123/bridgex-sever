import { Module } from "@nestjs/common";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { MqttPublishService } from "./mqtt-publish.service";
import { MqttClientServiceModule } from "../mqtt-client";

// ------------------------------------------------

@Module({
  providers: [MqttPublishService],
  imports: [LoggerServiceModule, MqttClientServiceModule],
  exports: [MqttPublishService],
})
export class MqttPublishServiceModule {}
