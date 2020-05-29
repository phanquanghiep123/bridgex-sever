import { Module } from "@nestjs/common";

import { AssetInventoryMqttModule } from "./asset-inventory";
import { AssetStatusUpdatedMqttModule } from "./asset-status-updated";
import { ConnectionMqttModule } from "./connection";
import { DownloadPackageMqttModule } from "./download-package";
import { EstablishedMqttModule } from "./established";
import { RetrieveLogMqttModule } from "./retrievelog";
import { FirmwareUpdatedMqttModule } from "./firmware-updated";
import { InstallMqttModule } from "./install";
import { RebootMqttModule } from "./reboot";
import { SelfTestMqttModule } from "./selftest";

// -------------------------------------

@Module({
  imports: [
    // mqtt
    AssetInventoryMqttModule,
    AssetStatusUpdatedMqttModule,
    ConnectionMqttModule,
    DownloadPackageMqttModule,
    InstallMqttModule,
    EstablishedMqttModule,
    RetrieveLogMqttModule,
    FirmwareUpdatedMqttModule,
    RebootMqttModule,
    SelfTestMqttModule,
  ],
})
export class MqttControllerModule {}
