export interface ErrorInformation {
  code: string;
  message: string;
}

export interface ErrorInformationMap {
  [assetType: string]: {
    [errorCode: string]: ErrorInformation;
  };
}

export interface ReadErrorMap {
  typeId: string;
  errors: Array<{
    code: string;
    message: string;
  }>;
}
