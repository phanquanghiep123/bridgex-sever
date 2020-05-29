import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { GetAssetVersionsParams } from "./asset-versions.controller.i";

@Injectable()
export class GuardAssetVersions {
  public isGetAssetVersionsParams(params: any): params is GetAssetVersionsParams {
    const schema: JsonSchema = {
      $id: `rest-${GuardAssetVersions.name}.${this.isGetAssetVersionsParams.name}`,
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
}
