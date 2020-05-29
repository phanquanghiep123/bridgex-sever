import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { SessionData } from "./start-retrievelog.controller.i";

@Injectable()
export class GuardStartRetrieveLog {
  public isPostBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardStartRetrieveLog.name}.${this.isPostBody.name}`,
      type: "object",
      properties: {
        taskId: {
          type: "string",
          minLength: 1,
        },
      },
      required: ["taskId"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isSessionData(params: any): params is SessionData {
    const schema: JsonSchema = {
      $id: `rest-${GuardStartRetrieveLog.name}.${this.isSessionData.name}`,
      type: "object",
      properties: {
        typeId: {
          type: "string",
          minLength: 1,
        },
        assetId: {
          type: "string",
          minLength: 1,
        },
        sessionId: {
          type: "string",
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
        },
        topicPrefix: {
          type: "string",
          minLength: 1,
        },
      },
      required: ["typeId", "assetId", "sessionId", "topicPrefix"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
