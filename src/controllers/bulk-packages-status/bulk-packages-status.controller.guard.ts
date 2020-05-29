import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";

@Injectable()
export class GuardBulkPackagesStatus {
  public isGetBulkPackagesStatusBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardBulkPackagesStatus.name}.${this.isGetBulkPackagesStatusBody.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          packageId: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["packageId"],
      },
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
