import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { EAssetStatus, Asset, AssetRecord, GetAssetAvailabilityRecords } from "./asset-status.service.i";

@Injectable()
export class GuardAssetStatusResponse {
  public isGetAssetResponse(params: any): params is Asset {
    const schema: JsonSchema = {
      $id: `svc-${GuardAssetStatusResponse.name}.${this.isGetAssetResponse.name}`,
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
          alias: {
            nullable: "true",
          },
          customerId: {
            nullable: "true",
          },
          locationId: {
            nullable: "true",
          },
          regionId: {
            nullable: "true",
          },
          ipAddress: {
            nullable: "true",
          },
          description: {
            nullable: "true",
          },
          note: {
            nullable: "true",
          },
          status: {
            nullable: "true",
          },
          installationDate: {
            nullable: "true",
            format: "date-time",
          },
        },
        required: [
          "typeId",
          "assetId",
          "alias",
          "customerId",
          "locationId",
          "regionId",
          "ipAddress",
          "description",
          "note",
          "status",
          "installationDate",
        ],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isGetAssetsResponse(params: any): params is AssetRecord {
    const schema: JsonSchema = {
      $id: `svc-${GuardAssetStatusResponse.name}.${this.isGetAssetsResponse.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          typeId: {
            nullable: "true",
          },
          assetId: {
            nullable: "true",
          },
          alias: {
            nullable: "true",
          },
          customerId: {
            nullable: "true",
          },
          locationId: {
            nullable: "true",
          },
          regionId: {
            nullable: "true",
          },
          ipAddress: {
            nullable: "true",
          },
          description: {
            nullable: "true",
          },
          note: {
            nullable: "true",
          },
          status: {
            nullable: "true",
          },
          installationDate: {
            nullable: "true",
            format: "date-time",
          },
          totalCount: {
            type: "string",
            pattern: "^[0-9]+$",
          },
        },
        required: [
          "typeId",
          "assetId",
          "alias",
          "customerId",
          "locationId",
          "regionId",
          "ipAddress",
          "description",
          "note",
          "status",
          "installationDate",
          "totalCount",
        ],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isGetAssetAvailabilityRecords(params: any): params is GetAssetAvailabilityRecords {
    const schema: JsonSchema = {
      $id: `svc-${GuardAssetStatusResponse.name}.${this.isGetAssetAvailabilityRecords.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          status: {
            type: "string",
            nullable: "false",
            enum: [EAssetStatus.Good, EAssetStatus.Error, EAssetStatus.Missing, EAssetStatus.Online],
          },
          count: {
            type: "string",
            pattern: "^[0-9]+$",
          },
        },
        required: ["status", "count"],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
