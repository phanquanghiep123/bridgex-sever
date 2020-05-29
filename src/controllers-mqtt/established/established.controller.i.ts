import { MqttMessagePayload } from "../mqtt-message.i";
export { AssetSubparts } from "../../service/asset-versions/";

export type EstablishedEventPayload = MqttMessagePayload<EstablishedEventDetail>;

export interface EstablishedEventDetail {
  versions: AssetVersionItem[];
}

export interface AssetVersionItem {
  name: string;
  value?: string;
}
