import { PassThrough } from "stream";

export enum EUnzipError {
  FILE_NOT_FOUND = "Zip file not found",
  INVALID_ZIP = "Zip invalid format",
  FILE_SAVE_FAILED = "Save unzipped file Failed",
  UNZIP_FAILED = "Unzip file Failed, perhaps file is not zip file",
  UNKNOWN = "Unknown error",
}

export class UnzipError extends Error {
  constructor(public readonly code: EUnzipError, public readonly params?: any) {
    super(code);
  }
  public readonly name = UnzipError.name;

  public static isUnzipError(err: any): err is UnzipError {
    return err.name === UnzipError.name;
  }

  public toString(): string {
    return `${this.name}: ${this.code}`;
  }
}

/**
 * @params zipFilePath: path to zip file should be unzipped
 * @params tmpDir: place to save contents of unzipped file
 */
export interface UnzipParams {
  zipFilePath: string;
  tmpDir: string;
}

/**
 * this interface is prepared for unzip-stream module
 *
 */
export interface Entry extends PassThrough {
  path: string;
  type: string;
  isDirectory: boolean;
}
