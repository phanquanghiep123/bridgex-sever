import { Module } from "@nestjs/common";
import { LoggerServiceModule } from "../logger";
import { ConfigServiceModule } from "../config";
import { FtpClientService } from "./ftp-client.service";

@Module({
  imports: [LoggerServiceModule, ConfigServiceModule],
  providers: [FtpClientService],
  exports: [FtpClientService],
})
export class FtpClientServiceModule {}
