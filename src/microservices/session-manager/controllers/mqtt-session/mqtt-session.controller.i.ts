export interface PostSessionsBody {
  typeId: string;
  assetId: string;
}

export interface PostSessionsResponse {
  typeId: string;
  assetId: string;
  sessionId: string;
  topicPrefix: string;
}
