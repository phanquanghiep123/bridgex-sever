import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { AssetTypeRecord, RegionRecord, CustomerRecord, LocationRecord } from "./asset-filter.service.i";

@Injectable()
export class GuardAssetFilterResponse {
  public isGetAssetTypeResponse(params: any): params is AssetTypeRecord {
    const schema: JsonSchema = {
      $id: `svc-${GuardAssetFilterResponse.name}.${this.isGetAssetTypeResponse.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          typeId: {
            type: "string",
          },
        },
        required: ["typeId"],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isGetRegionResponse(params: any): params is RegionRecord {
    const schema: JsonSchema = {
      $id: `svc-${GuardAssetFilterResponse.name}.${this.isGetRegionResponse.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          regionId: {
            type: "string",
          },
        },
        required: ["regionId"],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isGetCustomerResponse(params: any): params is CustomerRecord {
    const schema: JsonSchema = {
      $id: `svc-${GuardAssetFilterResponse.name}.${this.isGetCustomerResponse.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          customerId: {
            type: "string",
          },
        },
        required: ["customerId"],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isGetLocationResponse(params: any): params is LocationRecord {
    const schema: JsonSchema = {
      $id: `svc-${GuardAssetFilterResponse.name}.${this.isGetLocationResponse.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          customerId: {
            type: "string",
          },
          locationId: {
            type: "string",
          },
        },
        required: ["customerId", "locationId"],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
