import { Injectable } from "@nestjs/common";

import { PostSchedulesBody } from "./task-schedule.controller.i";

import { JsonSchema, SchemaUtility } from "../../../../schema";

// -------------------------------------------------

@Injectable()
export class GuardTaskSchedule {
  public isPostSchedulesBody(params: any): params is PostSchedulesBody {
    const schema: JsonSchema = {
      $id: `rest-${GuardTaskSchedule.name}.${this.isPostSchedulesBody.name}`,
      type: "object",
      properties: {
        taskId: {
          type: "string",
          minLength: 1,
        },
        callbackUrl: {
          type: "string",
          format: "uri",
        },
      },
      required: ["taskId", "callbackUrl"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params) && /^http(s)?:\/\/(?!\/).+$/.test(params.callbackUrl);
  }
}
