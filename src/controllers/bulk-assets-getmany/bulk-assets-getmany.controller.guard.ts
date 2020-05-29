import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";

@Injectable()
export class GuardBulkAssetsGetMany {
  public isGetAssetsParams(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardBulkAssetsGetMany.name}.${this.isGetAssetsParams.name}`,
      type: "object",
      properties: {
        isFilter: {
          type: "string",
          pattern: "^true$|^false$",
        },
        status: {
          type: "string",
          minLength: 1,
        },
        typeId: {
          type: "string",
          minLength: 1,
        },
        organization: {
          type: "string",
          minLength: 1,
        },
        location: {
          type: "string",
          minLength: 1,
        },
        region: {
          type: "string",
          minLength: 1,
        },
        text: {
          type: "string",
          minLength: 1,
        },
        sortName: {
          type: "string",
          pattern: "^assetId$|^typeId$|^customerId$|^locationId$|^regionId$|^alias$|^ipAddress$|^status$|^installationDate$",
        },
        sort: {
          type: "string",
          pattern: "^asc$|^desc$",
        },
        limit: {
          type: "string",
          pattern: "^[0-9]+$",
          minLength: 1,
        },
        offset: {
          type: "string",
          pattern: "^[0-9]+$",
          minLength: 1,
        },
      },
      required: [],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isGetBulkAssetsStatusBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardBulkAssetsGetMany.name}.${this.isGetBulkAssetsStatusBody.name}`,
      type: "array",
      items: {
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
      },
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
