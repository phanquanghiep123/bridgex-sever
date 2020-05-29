import { MqttMessagePayload } from "../mqtt-message.i";

export type AssetStatusUpdatedEventPayload = MqttMessagePayload<AssetStatusUpdatedDetail>;

export interface AssetStatusUpdatedDetail {
  status: EAssetStatus;
  errorCode?: string;
  errorMsg?: string;
}

export enum EAssetStatus {
  Missing = "Missing",
  Good = "Good",
  Error = "Error",
}
