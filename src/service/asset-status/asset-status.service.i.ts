export enum EAssetStatus {
  Missing = "Missing",
  Good = "Good",
  Error = "Error",
  Online = "Online",
}

export interface AssetKey {
  typeId: string;
  assetId: string;
}

export interface AssetBase extends AssetKey {
  status: EAssetStatus;
  ipAddress?: string;
  note?: string;
  installationDate?: string;
}
export interface AssetStatus extends AssetBase {
  errorCode?: string;
  subAssets?: AssetStatus[];
}
export interface Asset extends AssetBase {
  customerId: string;
  locationId: string;
  regionId: string;
  description: string;
  alias: string;
}

export interface AssetRecord extends Asset {
  totalCount: string;
}

export interface AssetStatusRecord extends AssetKey {
  status: EAssetStatus;
  errorCode: string;
  isSubAsset: boolean;
}

export interface UpsertAssetStatusParams extends AssetKey {
  status?: EAssetStatus;
  errorCode?: string;
}

export interface UpsertNoteParams extends AssetKey {
  note?: string;
}

export interface UpsertConnectionParams extends AssetKey {
  status?: EAssetStatus;
  ipAddress?: string;
}

// tslint:disable-next-line: no-empty-interface
export type GetAssetParams = AssetKey;

export interface GetAssetsParams {
  isFilter: string;
  status: string;
  typeId: string;
  organization: string;
  location: string;
  region: string;
  text: string;
  sortName: string;
  sort: string;
  limit: string;
  offset: string;
}

export interface GetAssetAvailability {
  status: EAssetStatus;
  count: number;
}

export interface GetAssetAvailabilityRecord {
  status: EAssetStatus;
  count: string;
}

export type GetAssetAvailabilityRecords = GetAssetAvailabilityRecord[];
