export interface GetEventsParam {
  typeId: string;
  assetId: string;
}

export enum EEventSource {
  Asset = "Asset",
  Bridge = "Bridge",
}

export interface GetEventsQuery {
  limit: number;
  offset: number;
  text: string;
  eventSource: EEventSource;
}
