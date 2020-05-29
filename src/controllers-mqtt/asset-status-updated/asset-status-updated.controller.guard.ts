import { Injectable } from "@nestjs/common";

import { AssetStatusUpdatedDetail, EAssetStatus } from "./asset-status-updated.controller.i";

import { JsonSchema, SchemaUtility } from "../../schema";

@Injectable()
export class GuardAssetUpdatedStatus {
  public isAssetStatusUpdatedEvent(params: any): params is AssetStatusUpdatedDetail {
    const schema: JsonSchema = {
      $id: `mqtt-${GuardAssetUpdatedStatus.name}.${this.isAssetStatusUpdatedEvent.name}`,
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [EAssetStatus.Good, EAssetStatus.Error],
        },
        errorCode: {
          type: "string",
        },
        errorMsg: {
          type: "string",
        },
      },
      required: ["status"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
