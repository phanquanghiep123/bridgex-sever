import { Module } from "@nestjs/common";

import { AssetModule } from "./asset";
import { AssetFilterModule } from "./asset-filter";
import { AssetInventoryModule } from "./asset-inventory";
import { AssetStatusModule } from "./asset-status";
import { AssetVersionsModule } from "./asset-versions";
import { BulkAssetsGetManyModule } from "./bulk-assets-getmany";
import { BulkAssetsAvailabilityModule } from "./bulk-assets-availability";
import { EventsControllerModule } from "./events/events.controller.module";
import { PackageUploadCompletionControllerModule } from "./package-upload-completion";
import { PackageUploadFailureControllerModule } from "./package-upload-failure";
import { PackagesControllerModule } from "./packages";
import { StartDownloadPackageControllerModule } from "./start-download-package";
import { StartInstallControllerModule } from "./start-install";
import { StartRetrieveLogControllerModule } from "./start-retrievelog";
import { StartRebootControllerModule } from "./start-reboot";
import { StartSelfTestControllerModule } from "./start-selftest";
import { TasksControllerModule } from "./tasks";
import { AssetLogUrlModule } from "./asset-log-url";
import { BulkPackagesStatusModule } from "./bulk-packages-status";
import { BulkTasksStatusModule } from "./bulk-tasks-status";

// -------------------------------------

@Module({
  imports: [
    AssetModule,
    AssetFilterModule,
    AssetInventoryModule,
    AssetStatusModule,
    AssetVersionsModule,
    BulkAssetsGetManyModule,
    BulkAssetsAvailabilityModule,
    EventsControllerModule,
    PackageUploadCompletionControllerModule,
    PackageUploadFailureControllerModule,
    PackagesControllerModule,
    StartDownloadPackageControllerModule,
    StartInstallControllerModule,
    StartRetrieveLogControllerModule,
    StartRebootControllerModule,
    StartSelfTestControllerModule,
    TasksControllerModule,
    AssetLogUrlModule,
    BulkPackagesStatusModule,
    BulkTasksStatusModule,
  ],
})
export class RestControllerModule {}
