export enum EMessageType {
  Event = "Event",
  Command = "Command",
  Response = "Response",
  Action = "Action",
}

export enum EMessageName {
  CreateSession = "CreateSession",
  CloseSession = "CloseSession",
  DownloadPackage = "DownloadPackage",
  Install = "Install",
  RetrieveLog = "RetrieveLog",
  Reboot = "Reboot",
  SelfTest = "SelfTest",
}

export interface MqttMessageAssetMetadata {
  typeId: string;
  assetId: string;
  sessionId?: string;
  messageId?: string;
}

export interface MqttMessage<T> {
  type: EMessageType;
  name: EMessageName;
  version?: number;
  sender?: string;
  assetMetaData: MqttMessageAssetMetadata;
  detail: T;
}

export interface MqttReturnData<T> {
  topic: string;
  payload: MqttMessage<T>;
}

export interface MqttActionCreateSessionDetail {
  sessionId: string;
  topicPrefix: string;
}

export type MqttEventCreateSessionDetail = MqttActionCreateSessionDetail;
export type MqttActionCloseSessionDetail = MqttActionCreateSessionDetail;

export interface MqttCommandDownloadPackageDetail {
  packageId: string;
  protocol: string;
  url: string;
  username?: string;
  password?: string;
}

export interface MqttCommandInstallDetail {
  packageId: string;
}

export interface MqttCommandRetrieveLogDetail {
  type: string[];
  protocol: string;
  url: string;
  filename: string;
  username?: string;
  password?: string;
  from?: string;
  to?: string;
}

export interface SendCreateSessionParams {
  typeId: string;
  assetId: string;
  sessionId: string;
  topicPrefix: string;
}

export type SendCreateSessionActionParams = SendCreateSessionParams;
export type SendCloseSessionActionParams = SendCreateSessionParams;

export interface SendCloseSessionParams {
  typeId: string;
  assetId: string;
  sessionTopic: string;
  sessionId: string;
  messageId: string;
}

export interface DownloadPackageParams {
  typeId: string;
  assetId: string;
  sessionTopic: string;
  sessionId: string;
  messageId: string;
  packageId: string;
  protocol: string;
  url: string;
  username?: string;
  password?: string;
}

export interface InstallParams {
  typeId: string;
  assetId: string;
  sessionTopic: string;
  sessionId: string;
  messageId: string;
  packageId: string;
}

export interface UploadRetrieveLogParams {
  typeId: string;
  assetId: string;
  sessionTopic: string;
  sessionId: string;
  messageId: string;
  type: string[];
  protocol: string;
  url: string;
  filename: string;
  username?: string;
  password?: string;
}

export interface SendRebootParams {
  typeId: string;
  assetId: string;
  sessionTopic: string;
  sessionId: string;
  messageId: string;
}

export interface SendSelfTestParams {
  typeId: string;
  assetId: string;
  sessionTopic: string;
  sessionId: string;
  messageId: string;
}
