import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { GetAssetStatusParams, PutAssetStatusParams, PutAssetStatusBody } from "./asset-status.controller.i";

@Injectable()
export class GuardAssetStatus {
  public isGetAssetStatusParams(params: any): params is GetAssetStatusParams {
    const schema: JsonSchema = {
      $id: `rest-${GuardAssetStatus.name}.${this.isGetAssetStatusParams.name}`,
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

  public isPutAssetStatusParams(params: any): params is PutAssetStatusParams {
    const schema: JsonSchema = {
      $id: `rest-${GuardAssetStatus.name}.${this.isPutAssetStatusParams.name}`,
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

  public isPutAssetStatusBody(params: any): params is PutAssetStatusBody {
    const schema: JsonSchema = {
      $id: `rest-${GuardAssetStatus.name}.${this.isPutAssetStatusBody.name}`,
      type: "object",
      properties: {
        note: {
          type: "string",
        },
      },
      required: [],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
