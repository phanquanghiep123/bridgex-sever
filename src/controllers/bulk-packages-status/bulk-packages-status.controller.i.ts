export enum EPackageStatus {
  Uploading = "Uploading",
  Validating = "Validating",
  Complete = "Complete",
  Invalid = "Invalid",
  Failure = "Failure",
}

export interface PackageStatus {
  packageId: string;
}
