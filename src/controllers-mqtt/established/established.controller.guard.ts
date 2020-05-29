import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { EstablishedEventDetail } from "./established.controller.i";

@Injectable()
export class GuardEstablished {
  public isEstablishedEvent(params: any): params is EstablishedEventDetail {
    const schema: JsonSchema = {
      $id: `mqtt-${GuardEstablished.name}.${this.isEstablishedEvent.name}`,
      type: "object",
      properties: {
        versions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
              },
              value: {
                type: "string",
              },
            },
            required: ["name"],
          },
        },
      },
      required: ["versions"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
