import { Injectable } from "@nestjs/common";

import { PostSessionsBody } from "./mqtt-session.controller.i";

import { JsonSchema, SchemaUtility } from "../../../../schema";

// -------------------------------------------------

@Injectable()
export class GuardMqttSession {
  public isPostSessionsBody(params: any): params is PostSessionsBody {
    const schema: JsonSchema = {
      $id: `rest-${GuardMqttSession.name}/${this.isPostSessionsBody.name}`,
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
      },
      required: ["typeId", "assetId"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isDeleteSessionParams(params: any): params is string {
    const schema: JsonSchema = {
      $id: `rest-${GuardMqttSession.name}/${this.isDeleteSessionParams.name}`,
      type: "string",
      pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
