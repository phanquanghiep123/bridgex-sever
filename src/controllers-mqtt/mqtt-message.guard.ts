import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../schema";
import { MqttMessagePayload, EMessageType, EMessageName, MqttResponsePayload, EResult } from "./mqtt-message.i";

@Injectable()
export class GuardMqttMessage {
  public isMqttMessagePayload(params: any): params is MqttMessagePayload<any> {
    const schema: JsonSchema = {
      $id: `mqtt-${GuardMqttMessage.name}.${this.isMqttMessagePayload.name}`,
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [EMessageType.Event, EMessageType.Command, EMessageType.Response],
        },
        name: {
          type: "string",
          enum: [
            EMessageName.Connection,
            EMessageName.AssetStatusUpdated,
            EMessageName.Established,
            EMessageName.DownloadPackage,
            EMessageName.Install,
            EMessageName.InventoryChanged,
            EMessageName.RetrieveLog,
            EMessageName.Reboot,
            EMessageName.SelfTest,
          ],
        },
        version: {
          type: "integer",
        },
        sender: {
          type: "string",
        },
        assetMetaData: {
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
        detail: {
          type: "object",
        },
      },
      required: ["type", "name", "version", "assetMetaData"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isMqttResponsePayload(params: any): params is MqttResponsePayload<any> {
    const schema: JsonSchema = {
      $id: `mqtt-${GuardMqttMessage.name}.${this.isMqttResponsePayload.name}`,
      type: "object",
      properties: {
        assetMetaData: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              minLength: 1,
            },
            messageId: {
              type: "string",
              minLength: 1,
            },
          },
          required: ["sessionId", "messageId"],
        },
        result: {
          type: "string",
          enum: [EResult.Succeed, EResult.Accepted, EResult.Error],
        },
        errorCode: {
          type: "string",
        },
        errorMsg: {
          type: "string",
        },
      },
      required: ["assetMetaData", "result"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
