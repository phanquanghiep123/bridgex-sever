import moment from "moment";
import { DeploymentTaskAsset, DeploymentTaskPackage } from "../../controllers/tasks/tasks.controller.i";

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

export enum ETaskLogType {
  Business = "Business",
  Trace = "Trace",
}

export enum ERetrieveLogsStatus {
  Succeed = "Succeed",
  Error = "Error",
}

export enum ERebootStatus {
  Succeed = "Succeed",
  Accepted = "Accepted",
  Error = "Error",
}

export enum ESelfTestStatus {
  Succeed = "Succeed",
  Error = "Error",
}

export interface Task {
  id: string;
  name: string;
  taskType: ETaskType;
  status: ETaskStatus;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface GetTasks extends GetTask {
  relatedTaskId?: string;
  relatedTaskType?: string;
  downloadPackageTaskAssets?: DeploymentTaskAsset[];
  installTaskAssets?: DeploymentTaskAsset[];
  deploymentTaskPackages?: DeploymentTaskPackage;
  logTask?: LogTaskRecord;
  logTaskAssets?: LogTaskAssetRecord[];
  retrieveLogs?: RetriveLogsRecord[];
  rebootTask: RebootTaskRecord;
  rebootTaskAssets: RebootTaskAssetRecord[];
  selfTestTask: SelfTestTaskRecord;
  selfTestTaskAssets: SelfTestTaskAssetRecord[];
  totalCount: string;
}

export interface GetTask extends Task {
  installTaskAssets?: DeploymentTaskAssetRecord[];
  downloadPackageTaskAssets?: DeploymentTaskAssetRecord[];
  deploymentTaskPackages?: DeploymentTaskPackageRecord;
}

export interface DeploymentTaskPackageRecord {
  packageId?: string;
  name: string;
  summary?: string;
  date?: string;
}

export interface DeploymentTaskAssetRecord extends AssetIdentification {
  typeId: string;
  assetId: string;
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

export interface LogTaskAssetRecord {
  startedAt?: string;
  updatedAt?: string;
  assetId: string;
  typeId: string;
  status: ETaskAssetStatus;
  alias?: string;
  customerId?: string;
  locationId?: string;
  regionId?: string;
}

export interface RetriveLogsRecord {
  assetId: string;
  typeId: string;
  status: ERetrieveLogsStatus;
  errorCode: string;
  errorMessage: string;
  filePath: string;
  createdAt?: string;
}

export interface RebootTaskRecord {
  memo: string;
}

export interface RebootTaskAssetRecord {
  startedAt?: string;
  updatedAt?: string;
  assetId: string;
  typeId: string;
  status: ETaskAssetStatus;
  alias?: string;
  customerId?: string;
  locationId?: string;
  regionId?: string;
}

export interface SelfTestTaskRecord {
  memo: string;
}

export interface SelfTestTaskAssetRecord {
  startedAt?: string;
  updatedAt?: string;
  assetId: string;
  typeId: string;
  status: ETaskAssetStatus;
  alias?: string;
  customerId?: string;
  locationId?: string;
  regionId?: string;
}

export interface GetDepolymentTasksParam {
  limit?: string;
  offset?: string;
  text?: string;
  sortName?: string;
  sort?: string;
}

export interface DownloadPackageTaskRecord {
  taskId: string;
  name: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  packageId: string;
  packageName: string;
  packageStatus: string;
  packageComment: string;
  packageUploadUtc: string;
  packageUploadBy: string;
  packageSummary: string;
  packageDescription: string;
  packageModel: string;
  packageMemo: string;
  packageBucketName: string;
  packageObjectName: string;
  packageFtpFilePath: string;
  assetTypeId: string;
  assetId: string;
  assetStatus: string;
  assetStartedAt: string;
  assetUpdatedAt: string;
}

export interface DownloadPackageTask {
  id: string;
  name: string;
  status: ETaskStatus;
  createdBy: string;
  createdAt: moment.Moment;
  updatedAt: moment.Moment;
  package: DownloadPackageTaskPackage;
  assets: DownloadPackageTaskAsset[];
}

export interface DownloadPackageTaskPackage {
  id: string;
  name: string;
  model: string;
  ftpFilePath: string;
}

export interface DownloadPackageTaskAsset {
  typeId: string;
  assetId: string;
  status: ETaskAssetStatus;
  startedAt: moment.Moment;
  updatedAt: moment.Moment;
}

export interface InstallTaskRecord {
  taskId: string;
  name: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  packageId: string;
  packageName: string;
  packageStatus: string;
  packageComment: string;
  packageUploadUtc: string;
  packageUploadBy: string;
  packageSummary: string;
  packageDescription: string;
  packageModel: string;
  packageMemo: string;
  packageBucketName: string;
  packageObjectName: string;
  packageFtpFilePath: string;
  assetTypeId: string;
  assetId: string;
  assetStatus: string;
  assetStartedAt: string;
  assetUpdatedAt: string;
}

export interface InstallTask {
  id: string;
  name: string;
  status: ETaskStatus;
  createdBy: string;
  createdAt: moment.Moment;
  updatedAt: moment.Moment;
  package: InstallTaskPackage;
  assets: InstallTaskAsset[];
}

export interface InstallTaskPackage {
  id: string;
  name: string;
  model: string;
}

export interface InstallTaskAsset {
  typeId: string;
  assetId: string;
  status: ETaskAssetStatus;
  startedAt: moment.Moment;
  updatedAt: moment.Moment;
}

export interface GetLogTaskAssetParam {
  taskId: string;
  typeId: string;
  assetId: string;
}

export interface LogTask {
  id: number;
  taskId: string;
  status: ETaskStatus;
  logType: ETaskLogType;
  memo: string;
  createdAt: moment.Moment;
  updatedAt: moment.Moment;
  logs: LogTaskRetrievelog[];
  assets: LogTaskAsset[];
}

export interface LogTaskRetrievelog {
  id: number;
  taskId: string;
  assetId: string;
  typeId: string;
  status: ERetrieveLogsStatus;
  errorCode: string;
  errorMessage: string;
  filePath: string;
  createdAt: moment.Moment;
}

export interface LogTaskAsset {
  id: number;
  taskId: string;
  typeId: string;
  assetId: string;
  status: ETaskAssetStatus;
  startedAt: moment.Moment;
  updatedAt: moment.Moment;
}

export interface GetRebootTaskAssetParam {
  taskId: string;
  typeId: string;
  assetId: string;
}

export interface RebootTask {
  id: number;
  taskId: string;
  status: ETaskStatus;
  createdBy: string;
  memo: string;
  createdAt: moment.Moment;
  updatedAt: moment.Moment;
  assets: RebootTaskAsset[];
  reboots: RebootTaskReboot[];
}

export interface RebootTaskAsset {
  id: number;
  taskId: string;
  typeId: string;
  assetId: string;
  status: ETaskAssetStatus;
  startedAt: moment.Moment;
  updatedAt: moment.Moment;
}

export interface RebootTaskReboot {
  id: number;
  taskId: string;
  assetId: string;
  typeId: string;
  subAssetId: string;
  subTypeId: string;
  status: string;
  errorCode: string;
  errorMessage: string;
  createdAt: moment.Moment;
  updatedAt: moment.Moment;
}

export interface GetSelfTestTaskAssetParam {
  taskId: string;
  typeId: string;
  assetId: string;
}

export interface SelfTestTask {
  id: number;
  taskId: string;
  status: ETaskStatus;
  createdBy: string;
  memo: string;
  createdAt: moment.Moment;
  updatedAt: moment.Moment;
  assets: RebootTaskAsset[];
  selftests: SelfTestTaskSelfTest[];
}

export interface SelfTestTaskAsset {
  id: number;
  taskId: string;
  typeId: string;
  assetId: string;
  status: ETaskAssetStatus;
  startedAt: moment.Moment;
  updatedAt: moment.Moment;
}

export interface SelfTestTaskSelfTest {
  id: number;
  taskId: string;
  assetId: string;
  typeId: string;
  subAssetId: string;
  subTypeId: string;
  status: string;
  errorCode: string;
  errorMessage: string;
  createdAt: moment.Moment;
  updatedAt: moment.Moment;
}

/**
 * AssetIdentification interfaces
 */
export interface AssetIdentification {
  typeId: string;
  assetId: string;
}

export interface TaskAssetKey extends AssetIdentification {
  taskId: string;
}

export interface InsertTaskParams {
  taskId: string;
  name: string;
  status: ETaskStatus;
  createdBy: string;
  assets: InsertDeploymentTaskAsset[];
  packages: InsertDeploymentTaskPackage[];
}

export interface InsertDeploymentTaskPackage {
  taskId: string;
  packageId: string;
}

export interface InsertDeploymentTaskAsset extends TaskAssetKey {
  status: ETaskAssetStatus;
}

export interface InsertDownloadPackageTaskParams {
  taskId: string;
  name: string;
  status: ETaskStatus;
  createdBy: string;
  assets: InsertInstallTaskAsset[];
  packages: InsertInstallTaskPackage[];
}

export interface InsertInstallTaskPackage {
  packageId: string;
}

export interface InsertInstallTaskAsset extends AssetIdentification {
  status: ETaskAssetStatus;
}

export interface InsertInstallTaskParams {
  taskId: string;
  name: string;
  status: ETaskStatus;
  createdBy: string;
  assets: InsertInstallTaskAsset[];
  packages: InsertInstallTaskPackage[];
}

export interface InsertInstallTaskPackage {
  packageId: string;
}

export interface InsertInstallTaskAsset extends AssetIdentification {
  status: ETaskAssetStatus;
}

export interface InsertDeploymentRelationParams {
  downloadPackageId: string;
  installId: string;
}

export interface InsertLogTaskParams {
  taskId: string;
  status: ETaskStatus;
  logType: string;
  createdBy: string;
  memo: string;
  assets: InsertLogTaskAsset[];
}

export interface InsertLogTaskAsset extends AssetIdentification {
  status: ETaskAssetStatus;
}

export interface InsertRebootSelfTestTaskParams {
  taskId: string;
  status: ETaskStatus;
  createdBy: string;
  memo: string;
  assets: InsertRebootSelfTestTaskAsset[];
}

export interface InsertRebootSelfTestTaskAsset extends AssetIdentification {
  status: ETaskAssetStatus;
}

export interface InsertLogTaskRetrievelogParams extends TaskAssetKey {
  filePath: string;
}

export type GetRetrieveLogParams = TaskAssetKey;

export type BulkGetRetrieveLogParams = GetRetrieveLogParams[];

export interface InsertRetrievelogParams extends TaskAssetKey {
  status: string;
  errorCode?: string;
  errorMsg?: string;
}

export interface InsertRebootSelfTestParams {
  taskId: string;
  assetId: string;
  typeId: string;
  subAssetId: string;
  subTypeId: string;
  status?: string;
  errorCode?: string;
  errorMsg?: string;
}

export interface UpdateDownloadPackageTask {
  taskId: string;
  status?: ETaskStatus;
}

export interface UpdateDownloadPackageTaskAsset {
  taskId: string;
  typeId: string;
  assetId: string;
  status: ETaskAssetStatus;
  startedAt?: moment.Moment;
}

export interface UpdateInstallTask {
  taskId: string;
  status?: ETaskStatus;
}

export interface UpdateInstallTaskAsset {
  taskId: string;
  typeId: string;
  assetId: string;
  status: ETaskAssetStatus;
  startedAt?: moment.Moment;
}

export interface UpdateLogTask {
  taskId: string;
  status?: ETaskStatus;
}

export interface UpdateLogTaskAsset extends TaskAssetKey {
  status?: ETaskAssetStatus;
  startedAt?: moment.Moment;
}

export type UploadLogFileParams = TaskAssetKey;

export type GetAssetLogFilePath = TaskAssetKey;

export interface QueriedGetAssetLogUrl {
  taskStatus: ETaskStatus;
  taskAssetStatus: ETaskAssetStatus;
  ftpFilePath: string;
}

export interface RetrieveLogResultRecord extends TaskAssetKey {
  id: number;
  ftpFilePath: string;
  status: ERetrieveLogsStatus;
  errorCode?: string;
  errorMsg?: string;
  createdAt: string;
}

export interface UpdateRebootSelfTestTask {
  taskId: string;
  status?: ETaskStatus;
}

export interface UpdateRebootSelfTestTaskAsset {
  taskId: string;
  typeId: string;
  assetId: string;
  status?: ETaskAssetStatus;
  startedAt?: moment.Moment;
  updatedAt?: moment.Moment;
}

export interface UpdateRebootTaskSubAsset {
  taskId: string;
  typeId: string;
  assetId: string;
  subTypeId: string;
  subAssetId: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt?: moment.Moment;
  updatedAt?: moment.Moment;
}

export interface UpdateSelfTestTaskSubAsset {
  taskId: string;
  typeId: string;
  assetId: string;
  subTypeId: string;
  subAssetId: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt?: moment.Moment;
  updatedAt?: moment.Moment;
}

export interface TaskStatus {
  taskId: string;
  taskType: ETaskType;
  status: ETaskStatus;
  taskAssets: TaskAssetStatus[];
}

export interface TaskAssetStatus {
  typeId: string;
  assetId: string;
  status: ETaskAssetStatus;
}

export interface GetTaskStatusParams {
  taskId: string;
}
