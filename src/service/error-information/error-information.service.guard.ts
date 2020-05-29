import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { ReadErrorMap } from "./error-information.service.i";

@Injectable()
export class GuardErrorInformationMap {
  public isReadErrorMap(params: any): params is ReadErrorMap {
    const schema: JsonSchema = {
      $id: `svc-${GuardErrorInformationMap.name}.${this.isReadErrorMap.name}`,
      type: "object",
      properties: {
        typeId: {
          type: "string",
          minLength: 1,
        },
        errors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              code: {
                type: "string",
                minLength: 1,
              },
              message: {
                type: "string",
              },
            },
            required: ["code", "message"],
            additionalProperties: false,
          },
        },
      },
      required: ["typeId", "errors"],
      additionalProperties: false,
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
