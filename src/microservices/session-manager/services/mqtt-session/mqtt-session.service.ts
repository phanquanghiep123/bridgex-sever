import { Injectable } from "@nestjs/common/decorators";

import uuid from "uuid/v4";

import { Observable, of } from "rxjs";

import { CreateSessionParams, CloseSessionParams, CreateSessionResponse, MqttSessions, MqttSession } from "./mqtt-session.service.i";

// --------------------------------------------------------------

@Injectable()
export class MqttSessionService {
  public static sessions: MqttSessions = {};
  public static readonly topicBase = "/glory/g-connect-session";

  public constructor() {}

  public createSession$(params: CreateSessionParams): Observable<CreateSessionResponse> {
    const id = uuid();

    const session: CreateSessionResponse = {
      typeId: params.typeId,
      assetId: params.assetId,
      sessionId: id,
      topicPrefix: `${MqttSessionService.topicBase}/${id}`,
    };

    MqttSessionService.sessions[id] = session;
    return of(session);
  }

  public closeSession$(params: CloseSessionParams): Observable<MqttSession> {
    const session = { ...MqttSessionService.sessions[params.sessionId] };

    delete MqttSessionService.sessions[params.sessionId];
    return of(session);
  }
}
