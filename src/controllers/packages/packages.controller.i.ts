export interface PostBody {
  name: string;
}

export interface PutBody {
  memo: string;
}

export interface Package {
  packageId: string;
  name: string;
  status: EPackageStatus;
  summary: string;
  date: string;
  description: string;
  uploadBy: string;
  model: string;
  memo: string;
  elements: PackageElement[];
}

export interface PackageElement {
  name: string;
  version: string;
}

export enum EPackageStatus {
  Uploading = "Uploading",
  Validating = "Validating",
  Complete = "Complete",
  Invalid = "Invalid",
  Failure = "Failure",
}
