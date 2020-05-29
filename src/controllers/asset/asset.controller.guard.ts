import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { GetAssetParams } from "./asset.controller.i";

@Injectable()
export class GuardAsset {
  public isGetAssetParams(params: any): params is GetAssetParams {
    const schema: JsonSchema = {
      $id: `rest-${GuardAsset.name}/${this.isGetAssetParams.name}`,
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
