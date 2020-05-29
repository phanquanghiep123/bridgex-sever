/*
 * interface of service
 */
export enum EEventSourceFilter {
  Asset = "asset",
  Bridge = "bridge",
  All = "all",
}

export interface GetEventListParams {
  typeId: string;
  assetId: string;
  filter: {
    text: string;
    eventSource: EEventSourceFilter;
  };
  limit: number;
  offset: number;
}

export enum EEventSource {
  Asset = "asset",
  Bridge = "bridge",
}

export interface EventList {
  items: EventListItem[];
  totalCount: number;
}

export interface EventListItem {
  date: Date;
  eventSource: EEventSource;
  subject: string;
  importance: EImportance;
}

export interface EventListItemRecord extends EventListItem {
  totalCount: string;
}

export interface EventParams {
  typeId: string;
  assetId: string;
}

export type AssetEventParams = EventParams;

export interface ConnectedParams extends AssetEventParams {
  ipAddress?: string;
}

export type DisconnectedParams = AssetEventParams;

export interface EstablishedParams extends AssetEventParams {
  versions?: Record<string, any>[];
}

export interface AssetStatusErrorParams extends AssetEventParams {
  errorCode: string;
  errorMessage?: string;
}

export interface FirmwareUpdatedParams extends AssetEventParams {
  packageList?: string[];
}

export enum ETaskType {
  DownloadPackage = "task_download_package",
  Install = "task_install",
  RetrieveLog = "task_log",
  Reboot = "task_reboot",
  SelfTest = "task_selftest",
}

export enum ETaskErrorResult {
  ConnectionError = "ConnectionError",
  DeviceError = "DeviceError",
  SystemError = "SystemError",
}

export interface TaskEventParams extends EventParams {
  taskId: string;
}

export type CreateTaskParams = TaskEventParams;
export type ExecuteTaskParams = TaskEventParams;
export type SuccessTaskParams = TaskEventParams;
export interface FailTaskParams extends TaskEventParams {
  errorResult: ETaskErrorResult;
}

export interface DownloadPackageTaskParams {
  packageName: string;
}

export interface InstallTaskParams {
  packageName: string;
}

export interface RetrieveLogTaskParams {
  logType: string;
}

export interface RebootTaskParams {
  memo: string;
}

export interface SelfTestTaskParams {
  memo: string;
}

/*
 * defined data by event-list-map/importance.yaml
 */

export enum EImportance {
  Information = "information",
  Error = "error",
}

export interface TaskImportanceMap {
  create: EImportance;
  execute: EImportance;
  success: EImportance;
  fail: EImportance;
}

export interface ImportanceMap {
  event: {
    connected: EImportance;
    disconnected: EImportance;
    established: EImportance;
    assetStatusError: EImportance;
    firmwareUpdated: EImportance;
  };
  task: {
    downloadPackage: TaskImportanceMap;
    install: TaskImportanceMap;
    logs: TaskImportanceMap;
    reboots: TaskImportanceMap;
    selftests: TaskImportanceMap;
  };
}

/*
 * defined data by event-list-map/subject.yaml
 */

export interface TaskSubjectMap {
  create: string;
  execute: string;
  success: string;
  fail: string;
}

export interface SubjectMap {
  event: {
    connected: string;
    disconnected: string;
    established: string;
    assetStatusError: string;
    firmwareUpdated: string;
  };
  task: {
    downloadPackage: TaskSubjectMap;
    install: TaskSubjectMap;
    logs: TaskSubjectMap;
    reboots: TaskSubjectMap;
    selftests: TaskSubjectMap;
  };
}
