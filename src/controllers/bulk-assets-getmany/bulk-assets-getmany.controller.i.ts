export interface AssetBase {
  typeId: string;
  assetId: string;
}

export interface Asset extends AssetBase {
  status: EAssetStatus;
  ipAddress: string;
  note: string;
  customerId: string;
  locationId: string;
  regionId: string;
  description: string;
  alias: string;
  installationDate: string;
}
export interface AssetStatus extends AssetBase {
  status: EAssetStatus;
  ipAddress?: string;
  note?: string;
  errorCode?: string;
  errorMessage?: string;
  subAssets?: AssetStatus[];
}

export enum EAssetStatus {
  Missing = "Missing",
  Good = "Good",
  Error = "Error",
}
