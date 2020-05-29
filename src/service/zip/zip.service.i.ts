export enum EZipError {
  SRC_FILE_NOT_SPECIFIED = "Src file not specified",
  SRC_FILE_NOT_FOUND = "Src file not found",
  DST_DIRECTORY_NOT_FOUND = "Dst directory not found",
  DST_FILE_ALREADY_EXIST = "Dst zip file already  exist",
  ZIP_FAILD = "Zip failed",
  UNKNOWN = "Unknown error",
}

export class ZipError extends Error {
  constructor(public readonly code: EZipError, public readonly params?: any) {
    super(code);
  }
  public readonly name = ZipError.name;

  public static isZipError(err: any): err is ZipError {
    return err.name === ZipError.name;
  }

  public toString(): string {
    return `${this.name}: ${this.code}`;
  }
}

export interface ZipParams {
  files: string[];
  dstDir: string;
  dstFileName: string;
}
