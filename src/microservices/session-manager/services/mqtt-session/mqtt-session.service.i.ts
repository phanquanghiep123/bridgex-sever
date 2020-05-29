export interface MqttSession {
  typeId: string;
  assetId: string;
  sessionId: string;
  topicPrefix: string;
}

export interface CreateSessionParams {
  typeId: string;
  assetId: string;
}

export type CreateSessionResponse = MqttSession;

export interface CloseSessionParams {
  sessionId: string;
}

export interface MqttSessions {
  [uuid: string]: MqttSession;
}
