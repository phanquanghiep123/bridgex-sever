import { MqttMessagePayload } from "../mqtt-message.i";

export type ConnectionEventPayload = MqttMessagePayload<ConnectionEventDetail>;

interface ConnectionEventDetail {
  ipAddress?: string;
  connection: EConnection;
}

export enum EConnection {
  Connected = "Connected",
  Disconnected = "Disconnected",
}

export enum EAssetStatus {
  Missing = "Missing",
  Good = "Good",
  Error = "Error",
  Online = "Online",
}
