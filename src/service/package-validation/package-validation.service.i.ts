export enum EPackageValidationError {
  FILE_NOT_FOUND = "File does not exist in specified path",
  FILE_FORMAT = "Archive format error",
  METADATA_NOT_FOUND = "Metadata file does not exist in root",
  METADATA_FORMAT = "Data format error",
  CONTENT_MISMATCH = "Contents of archive does not match metadata",
  UNKNOWN = "Unknown error",
}

export class PackageValidationError extends Error {
  constructor(public readonly code: EPackageValidationError, public readonly params?: any) {
    super(code);
  }
  public readonly name = PackageValidationError.name;

  public static isPackageValidationError(err: any): err is PackageValidationError {
    return err.name === PackageValidationError.name;
  }

  public toString(): string {
    return `${this.name}: ${this.code}.  ${this.message}`;
  }
}

/**
 * Contents of META.yaml
 */
export interface PackageMetadataYaml {
  name: string;
  files: string[];
  summary: string;
  description: string;
  model: string;
  elements: { [name: string]: string };
  createdBy: string;
}

export interface PackageElement {
  name: string;
  version: string;
}

export interface ValidatePackageParams {
  packageFilePath: string;
  tmpDir: string;
}

export interface ValidationResult {
  tmpDir: string;
  metadata: PackageMetadata;
}

export interface PackageMetadata {
  name: string;
  files: string[];
  summary: string;
  description: string;
  model: string;
  elements: PackageElement[];
  createdBy: string;
}
