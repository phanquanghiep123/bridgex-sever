import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";

@Injectable()
export class GuardBulkTasksStatus {
  public isGetBulkTasksStatusBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardBulkTasksStatus.name}.${this.isGetBulkTasksStatusBody.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["taskId"],
      },
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
