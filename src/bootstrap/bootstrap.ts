import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";

import { AppConfig } from "../environment/app";
import { MqttConfig } from "../environment/mqtt";
import { ShutdownService } from "../service/shutdown/shutdown.service";
import { logger } from "../service/logger";
import { CustomServerMqtt } from "../custom-servers/custom-server-mqtt";

export class App {
  public static async start(module: any) {
    const app = await NestFactory.create(module);
    await App.setup(app);
  }

  public static async setup(app: INestApplication) {
    // main app
    const appConfig = new AppConfig();
    app.useLogger(logger);
    app.use(logger.requestLogger(true));

    // graceful shutdown
    app.enableShutdownHooks();
    app.get(ShutdownService).configureGracefulShutdown(() => app.get(ShutdownService).teardown$(app));

    // mqtt server
    const mqttConfig = new MqttConfig();
    const microserviceMqtt = app.connectMicroservice({
      strategy: new CustomServerMqtt({
        ...mqttConfig,
      }),
    });

    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    microserviceMqtt.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.listen(appConfig.port);
    await app.startAllMicroservicesAsync();

    logger.info(
      `${appConfig.appName}:${appConfig.version} listening the port http://${process.env.HOSTNAME || "localhost"}:${appConfig.port}`,
    );
  }
}
