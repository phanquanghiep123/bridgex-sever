import { Module, HttpModule } from "@nestjs/common";
import { LoggerServiceModule } from "../logger/logger.service.module";
import { HttpClientService } from "./http-client.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
    LoggerServiceModule,
  ],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientServiceModule {}
