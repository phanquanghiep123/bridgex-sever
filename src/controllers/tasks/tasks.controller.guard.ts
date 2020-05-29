import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";

@Injectable()
export class GuardTasks {
  public isGetTaskParams(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardTasks.name}.${this.isGetTaskParams.name}`,
      type: "object",
      properties: {
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
        text: {
          type: "string",
          minLength: 1,
        },
        sortName: {
          type: "string",
          pattern: "^status$|^name$|^taskType$|^updateDate$",
        },
        sort: {
          type: "string",
          pattern: "^asc$|^desc$",
        },
      },
      required: [],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isPostBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardTasks.name}.${this.isPostBody.name}`,
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1,
        },
        packages: {
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          maxItems: 1,
        },
        assets: {
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
        },
      },
      required: ["name"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isPostLogTaskBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardTasks.name}.${this.isPostLogTaskBody.name}`,
      type: "object",
      properties: {
        logType: {
          type: "string",
          minLength: 1,
        },
        memo: {
          type: "string",
        },
        assets: {
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
        },
      },
      required: ["logType", "assets"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isPostRebootSelfTestTaskBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardTasks.name}.${this.isPostRebootSelfTestTaskBody.name}`,
      type: "object",
      properties: {
        memo: {
          type: "string",
        },
        assets: {
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
        },
      },
      required: ["assets"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
