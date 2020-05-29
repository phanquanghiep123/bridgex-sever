export interface RetrieveLogInfo {
  typeId: string;
  assetId: string;
  status: string;
  filePath: string;
}

export interface ZipLogParams {
  dstDir: string;
  dstFileName: string;
  asset: {
    typeId: string;
    assetId: string;
  };
  retrieveLogInfo: RetrieveLogInfo[];
}
