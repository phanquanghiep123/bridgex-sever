import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { GetAssetInventoryParams } from "../../service/asset-inventory";

@Injectable()
export class GuardAssetInventory {
  public isGetAssetInventoryParams(params: any): params is GetAssetInventoryParams {
    const schema: JsonSchema = {
      $id: "isGetAssetInventoryParams",
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
