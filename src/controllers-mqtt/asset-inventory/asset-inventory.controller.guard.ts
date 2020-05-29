import { Injectable } from "@nestjs/common";

import { AssetInventoryDetail } from "./asset-inventory.controller.i";

import { JsonSchema, SchemaUtility } from "../../schema";

@Injectable()
export class GuardAssetInventory {
  public isAssetInventoryEvent(params: any): params is AssetInventoryDetail {
    const schema: JsonSchema = {
      $id: `mqtt-${GuardAssetInventory.name}.${this.isAssetInventoryEvent.name}`,
      type: "object",
      properties: {
        cashUnits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              unit: {
                type: "string",
                minLength: 1,
              },
              status: {
                type: "string",
                minLength: 1,
              },
              nearFull: {
                type: "number",
                pattern: "^[0-9]+$",
              },
              nearEmpty: {
                type: "number",
                pattern: "^[0-9]+$",
              },
              capacity: {
                type: "number",
                pattern: "^[0-9]+$",
              },
              denominations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    currencyCode: {
                      type: "string",
                      minLength: 1,
                    },
                    faceValue: {
                      type: "string",
                      minLength: 1,
                      pattern: "^([0-9]*[.])?[0-9]+$",
                    },
                    count: {
                      type: "number",
                      pattern: "^[0-9]+$",
                    },
                    revision: {
                      type: "number",
                      pattern: "^[0-9]+$",
                    },
                  },
                  required: ["currencyCode", "faceValue", "count"],
                },
              },
            },
            required: ["unit", "status", "capacity", "denominations"],
          },
        },
      },
      required: ["cashUnits"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
