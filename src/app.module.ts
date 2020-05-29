import { Module } from "@nestjs/common";

import { ShutdownServiceModule } from "./service/shutdown/shutdown.service.module";
import { MqttSessionControllerModule } from "./microservices/session-manager/controllers/mqtt-session";
import { TaskScheduleControllerModule } from "./microservices/task-scheduler/controllers/task-scheduler";
import { MqttControllerModule } from "./controllers-mqtt/mqtt-controller.module";
import { RestControllerModule } from "./controllers/rest-controller.module";

@Module({
  imports: [
    // REST API
    RestControllerModule,

    // graceful shutdown
    ShutdownServiceModule,

    // ------------------------
    // microservices
    // ------------------------

    // MqttControllerModule
    MqttControllerModule,

    // session
    MqttSessionControllerModule,

    // task scheduler
    TaskScheduleControllerModule,
  ],
})
export class AppModule {}
