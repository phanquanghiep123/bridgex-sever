import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { GetEventsParam, GetEventsQuery, EEventSource } from "./events.controller.i";

@Injectable()
export class GuardEvents {
  public isGetEventsParams(params: any): params is GetEventsParam {
    const schema: JsonSchema = {
      $id: `rest-${GuardEvents.name}.${this.isGetEventsParams.name}`,
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

  public isGetEventsQuery(params: any): params is GetEventsQuery {
    const schema: JsonSchema = {
      $id: `rest-${GuardEvents.name}.${this.isGetEventsQuery.name}`,
      type: "object",
      properties: {
        limit: {
          type: "string",
          pattern: "^[0-9]+$",
          minLength: 1,
        },
        offset: {
          type: "string",
          pattern: "^[0-9]+$",
          minLength: 1,
        },
        text: {
          type: "string",
          minLength: 1,
        },
        eventSource: {
          type: "string",
          enum: [EEventSource.Asset, EEventSource.Bridge],
        },
      },
      required: [],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
