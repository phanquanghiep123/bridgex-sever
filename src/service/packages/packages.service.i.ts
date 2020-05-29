export enum EPackageStatus {
  Uploading = "Uploading",
  Validating = "Validating",
  Complete = "Complete",
  Invalid = "Invalid",
  Failure = "Failure",
}

export interface PackageBase {
  id: string;
  name: string;
  status: EPackageStatus;
  comment: string;
  updateUtc: Date;
  updateBy: string;
  description: string;
  summary: string;
  model: string;
  memo: string;
  bucketName: string;
  objectName: string;
  ftpFilePath: string;
}

export interface PackageName {
  id: string;
  name: string;
}

export interface Package extends PackageBase {
  elements?: PackageElement[];
}

export interface PackageElement {
  key: string;
  value: string;
}

export interface PackageRecord extends PackageBase {
  key: string;
  value: string;
  totalCount: string;
}

export interface PackageStatus {
  packageId: string;
  status: EPackageStatus;
}

export interface InsertPackageParams {
  packageId: string;
  name: string;
  status: EPackageStatus;
  comment: string;
  uploadBy: string;
  summary?: string;
  description?: string;
  model?: string;
  memo: string;
  bucketName: string;
  objectName: string;
  ftpFilePath?: string;
}

export interface UpdateStatusParams {
  packageId: string;
  status: string;
}

export interface UpdatePackageParams {
  packageId: string;
  memo: string;
}

export interface GetPackageParams {
  limit?: string;
  offset?: string;
  status?: EPackageStatus;
  text?: string;
  sortName?: string;
  sort?: string;
}

export interface UpdateMetadataParams {
  packageId: string;
  status: string;
  summary: string;
  description: string;
  model: string;
  ftpFilePath: string;
  elements: PackageElement[];
}

export interface GetPackageStatusParams {
  packageId: string;
}
