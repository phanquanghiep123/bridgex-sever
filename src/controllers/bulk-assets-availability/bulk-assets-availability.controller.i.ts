export enum EAssetStatus {
  Missing = "Missing",
  Good = "Good",
  Error = "Error",
}

export interface AssetAvailability {
  status: EAssetStatus;
  count: number;
}
