import { Module, Global } from "@nestjs/common";

import { MqttSessionService } from "./mqtt-session.service";

// -------------------------------------------------

@Global()
@Module({
  providers: [MqttSessionService],
  exports: [MqttSessionService],
})
export class MqttSessionServiceModule {}
