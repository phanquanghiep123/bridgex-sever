export enum EIbmCosError {
  AWS_ERROR = "AWSError",
  UNKNOWN = "Unknown error",
}

export class IbmCosError<T> extends Error {
  constructor(public readonly code: EIbmCosError, public readonly params?: T) {
    super(code);
  }
  public readonly name = IbmCosError.name;

  public static isIbmCosError(err: any): err is IbmCosError<any> {
    return err.name === IbmCosError.name;
  }

  public toString(): string {
    return `${this.name}: ${this.code}.  ${this.message}`;
  }
}

export interface CosConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  port?: string;
}
