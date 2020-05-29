import { MqttMessagePayload } from "../mqtt-message.i";

export type AssetInventoryEventPayload = MqttMessagePayload<AssetInventoryDetail>;

export interface AssetInventoryDetail {
  cashUnits: AssetInventory[];
}
export interface AssetInventory {
  unit: string;
  status: string;
  nearFull?: number;
  nearEmpty?: number;
  capacity: number;
  denominations: Denomination[];
}

export interface Denomination {
  currencyCode: string;
  faceValue: string;
  count: number;
  revision?: number;
}
