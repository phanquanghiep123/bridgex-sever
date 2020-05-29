export interface AssetVersionRecord extends AssetIdentification {
  subpartName: string;
  subpartVersion: string;
}

export interface AssetVersion {
  typeId: string;
  assetId: string;
  versions: VersionItem[];
}

export interface VersionItem {
  name: string;
  version: string;
}

export interface GetParams {
  typeId: string;
  assetId: string;
}

/**
 * AssetIdentification interfaces
 */
export interface AssetIdentification {
  typeId: string;
  assetId: string;
}

export interface AssetSubparts {
  subpartId: string;
  subpartVersion: string;
}

export interface PostParams {
  typeId: string;
  assetId: string;
  subparts: AssetSubparts[];
}
