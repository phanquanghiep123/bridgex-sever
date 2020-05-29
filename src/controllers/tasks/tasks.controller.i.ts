export interface PostDeploymentTaskBody {
  name: string;
  packages: string[];
  assets: AssetIdentification[];
}

export interface PostLogTaskBody {
  logType: string;
  memo: string;
  assets: AssetIdentification[];
}

export interface PostRebootSelfTestTaskBody {
  memo: string;
  assets: AssetIdentification[];
}

// --------------------------------------------
// General Task
//   will be the result of GET /tasks
// --------------------------------------------
export interface Task {
  id: string;
  name: string;
  taskType: ETaskType;
  status: ETaskStatus;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}
// --------------------------------------------
// Task Detail
//   will be the result of GET /tasks/:taskId
// --------------------------------------------
export interface TaskResponseBody extends Task {
  relatedTaskId?: string;
  relatedTaskType?: string;
  downloadPackageTaskAssets?: DeploymentTaskAsset[];
  installTaskAssets?: DeploymentTaskAsset[];
  deploymentTaskPackages?: DeploymentTaskPackage;
  logTask?: LogTaskRecord;
  logTaskAssets?: LogTaskAssetRecord[];
  retrieveLogs?: RetriveLogsRecord[];
  rebootTask?: RebootTaskRecord;
  rebootTaskAssets?: RebootTaskAssetRecord[];
  selfTestTask?: SelfTestTaskRecord;
  selfTestTaskAssets?: SelfTestTaskAssetRecord[];
}
export interface DeploymentTaskPackage {
  packageId?: string;
  name: string;
  summary?: string;
  date?: string;
}
export interface DeploymentTaskAsset extends AssetIdentification {
  status: ETaskAssetStatus;
  customerId?: string;
  locationId?: string;
  regionId?: string;
  alias?: string;
  startedAt?: string;
  updatedAt?: string;
}

export interface LogTaskRecord {
  logType: string;
  memo: string;
}

export interface LogTaskAssetRecord extends AssetIdentification {
  status: ETaskAssetStatus;
  customerId?: string;
  locationId?: string;
  regionId?: string;
  alias?: string;
  startedAt?: string;
  updatedAt?: string;
}

export interface RetriveLogsRecord extends AssetIdentification {
  status: ERetrieveLogsStatus;
  errorCode: string;
  errorMessage: string;
  filePath: string;
  createdAt?: string;
}

export interface RebootTaskRecord {
  memo: string;
}

export interface RebootTaskAssetRecord extends AssetIdentification {
  status: ETaskAssetStatus;
  customerId?: string;
  locationId?: string;
  regionId?: string;
  alias?: string;
  startedAt?: string;
  updatedAt?: string;
}

export interface SelfTestTaskRecord {
  memo: string;
}

export interface SelfTestTaskAssetRecord extends AssetIdentification {
  status: ETaskAssetStatus;
  customerId?: string;
  locationId?: string;
  regionId?: string;
  alias?: string;
  startedAt?: string;
  updatedAt?: string;
}

export enum ETaskType {
  DownloadPackage = "DownloadPackage",
  Install = "Install",
  Log = "RetrieveLog",
  Reboot = "Reboot",
  SelfTest = "SelfTest",
  Reset = "Reset",
}

export enum ETaskStatus {
  Scheduled = "Scheduled",
  InProgress = "InProgress",
  Failure = "Failure",
  Complete = "Complete",
}

export enum ETaskAssetStatus {
  Scheduled = "Scheduled",
  InProgress = "InProgress",
  Complete = "Complete",
  ConnectionError = "ConnectionError",
  DeviceError = "DeviceError",
  SystemError = "SystemError",
}

export enum ERetrieveLogsStatus {
  Succeed = "Succeed",
  Error = "Error",
}
/**
 * AssetIdentification interfaces
 */
export interface AssetIdentification {
  typeId: string;
  assetId: string;
}
