export interface GetAssetParams {
  typeId: string;
  assetId: string;
}

export interface Asset {
  typeId: string;
  assetId: string;
  status: EAssetStatus;
  ipAddress?: string;
  note?: string;
  customerId?: string;
  locationId?: string;
  regionId?: string;
  description?: string;
  alias?: string;
  installationDate?: string;
}

export enum EAssetStatus {
  Missing = "Missing",
  Good = "Good",
  Error = "Error",
}
