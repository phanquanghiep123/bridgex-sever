export interface GetAssetStatusParams {
  typeId: string;
  assetId: string;
}

export interface PutAssetStatusParams {
  typeId: string;
  assetId: string;
}

export interface PutAssetStatusBody {
  note?: string;
}

export interface AssetStatus {
  typeId: string;
  assetId: string;
  status: EAssetStatus;
  errorCode?: string;
  errorMessage?: string;
  subAssets?: AssetStatus[];
}

export enum EAssetStatus {
  Missing = "Missing",
  Good = "Good",
  Error = "Error",
}
