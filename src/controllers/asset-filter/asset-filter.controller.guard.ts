import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";

import { GetLocationsParams } from "./asset-filter.controller.i";

@Injectable()
export class GuardAssetFilter {
  public isGetLocationsParams(params: any): params is GetLocationsParams {
    const schema: JsonSchema = {
      $id: `rest-${GuardAssetFilter.name}.${this.isGetLocationsParams.name}`,
      type: "object",
      properties: {
        customerId: {
          type: "string",
          minLength: 1,
        },
      },
      required: ["customerId"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
