import { Injectable } from "@nestjs/common";

import { EConnection } from "./connection.controller.i";

import { JsonSchema, SchemaUtility } from "../../schema";

@Injectable()
export class GuardConnectionEvent {
  public isConnectionEvent(params: any): boolean {
    const schema: JsonSchema = {
      $id: `mqtt-${GuardConnectionEvent.name}.${this.isConnectionEvent.name}`,
      type: "object",
      properties: {
        ipAddress: {
          type: "string",
        },
        connection: {
          type: "string",
          enum: [EConnection.Connected, EConnection.Disconnected],
        },
      },
      required: ["connection"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
