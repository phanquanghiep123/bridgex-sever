import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { ZipLogParams } from "./zip-log.service.i";

@Injectable()
export class GuardZipLogService {
  public isZipLogParams(params: any): params is ZipLogParams {
    const schema: JsonSchema = {
      $id: `svc-${GuardZipLogService.name}.${this.isZipLogParams.name}`,
      type: "object",
      properties: {
        dstDir: {
          type: "string",
          minLength: 1,
        },
        dstFileName: {
          type: "string",
          minLength: 1,
        },
        asset: {
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
        retrieveLogInfo: {
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
              status: {
                type: "string",
                minLength: 1,
              },
              filePath: {
                type: "string",
                minLength: 1,
              },
            },
            required: ["typeId", "assetId", "status", "filePath"],
          },
          minItems: 1,
        },
      },
      required: ["dstDir", "dstFileName", "asset", "retrieveLogInfo"],
      additionalProperties: true,
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
