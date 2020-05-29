import { IsString, IsOptional } from "class-validator";

// this interface will be removed, when nestjs guard about mqtt subscriber is introduced.
export interface MqttMessagePayload<T> {
  type: EMessageType;
  name: EMessageName;
  version: number;
  sender?: string;
  assetMetaData: AssetMetaData;
  detail: T;
}

export interface MqttResponsePayload<T> extends MqttMessagePayload<T> {
  assetMetaData: AssetMetaDataForResponse;
  result: EResult;
  errorCode: string;
  errorMsg: string;
}

export enum EMessageType {
  Event = "Event",
  Command = "Command",
  Response = "Response",
}

export enum EMessageName {
  Connection = "Connection",
  AssetStatusUpdated = "AssetStatusUpdated",
  Established = "Established",
  DownloadPackage = "DownloadPackage",
  Install = "Install",
  FirmwareUpdated = "FirmwareUpdated",
  InventoryChanged = "InventoryChanged",
  RetrieveLog = "RetrieveLog",
  Reboot = "Reboot",
  SelfTest = "SelfTest",
}

// this interface will be removed, when nestjs guard about mqtt subscriber is introduced.
export interface AssetMetaData {
  typeId: string;
  assetId: string;
  sessionId?: string;
  messageId?: string;
}

// this interface will be removed, when nestjs guard about mqtt subscriber is introduced.
export interface AssetMetaDataForResponse {
  typeId: string;
  assetId: string;
  sessionId?: string;
  messageId: string;
}

export enum EResult {
  Succeed = "Succeed",
  Accepted = "Accepted",
  Error = "Error",
}

// this class is used for nestjs guard about mqtt subscriber
export class SubscribeAssetMetaData {
  @IsString()
  public typeId!: string;

  @IsString()
  public assetId!: string;

  @IsString()
  @IsOptional()
  public sessionId?: string;

  @IsString()
  @IsOptional()
  public messageId?: string;
}
