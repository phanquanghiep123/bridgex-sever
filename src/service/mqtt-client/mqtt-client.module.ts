import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { LoggerServiceModule } from "../logger/logger.service.module";
import { MqttClientService } from "./mqtt-client.service";
import { MqttConfig } from "../../environment/mqtt";

// ----------------------------------------------

@Module({
  providers: [MqttClientService],
  imports: [
    LoggerServiceModule,
    ClientsModule.register([
      {
        name: "MqttService",
        transport: Transport.MQTT,
        options: new MqttConfig(),
      },
    ]),
  ],
  exports: [MqttClientService],
})
export class MqttClientServiceModule {}
