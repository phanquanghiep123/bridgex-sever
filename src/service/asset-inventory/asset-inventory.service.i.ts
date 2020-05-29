export interface UpsertAssetInventoryParams {
  typeId: string;
  assetId: string;
  units: AssetInventory[];
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

export interface GetAssetInventoryParams {
  typeId: string;
  assetId: string;
}

export interface Inventory {
  typeId: string;
  assetId: string;
  cashUnits: AssetInventory[];
}
export interface AssetInventoryResponse {
  typeId: string;
  assetId: string;
  subAssets: Inventory[];
}
