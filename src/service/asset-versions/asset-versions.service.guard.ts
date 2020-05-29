import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { AssetVersionRecord } from "./asset-versions.service.i";

@Injectable()
export class GuardAssetVersionsResponse {
  public isGetAssetVersionsResponse(params: any): params is AssetVersionRecord {
    const schema: JsonSchema = {
      $id: `svc-${GuardAssetVersionsResponse.name}.${this.isGetAssetVersionsResponse.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          typeId: {
            type: "string",
          },
          assetId: {
            type: "string",
          },
          subpartName: {
            type: "string",
          },
          subpartVersion: {
            type: "string",
          },
        },
        required: ["typeId", "assetId", "subpartName", "subpartVersion"],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
