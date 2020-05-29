import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { PutParams } from "./package-upload-completion.controller.i";

@Injectable()
export class GuardPackageUploadCompletion {
  public isPutParams(params: any): params is PutParams {
    const schema: JsonSchema = {
      $id: `rest-${GuardPackageUploadCompletion.name}.${this.isPutParams.name}`,
      type: "object",
      properties: {
        packageId: {
          type: "string",
          minLength: 1,
        },
      },
      required: ["packageId"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
