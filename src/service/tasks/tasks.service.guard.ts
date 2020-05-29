import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { GetTasks, GetTask } from "./tasks.service.i";

@Injectable()
export class GuardTasksResponse {
  public isGetTasksResponse(params: any): params is GetTasks {
    const schema: JsonSchema = {
      $id: `svc-${GuardTasksResponse.name}.${this.isGetTasksResponse.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          taskType: {
            type: "string",
          },
          status: {
            type: "string",
            enum: ["Scheduled", "InProgress", "Failure", "Complete"],
          },
          relatedTaskId: {
            type: ["string", "null"],
          },
          relatedTaskType: {
            type: ["string", "null"],
          },
          createdBy: {
            type: ["string", "null"],
          },
          createdAt: {
            format: "date-time",
          },
          updatedAt: {
            format: "date-time",
          },
          downloadPackageTaskAssets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                startedAt: {
                  nullable: "ture",
                },
                updatedAt: {
                  nullable: "false",
                },
                status: {
                  type: "string",
                  enum: ["Scheduled", "InProgress", "Complete", "ConnectionError", "DeviceError", "SystemError"],
                },
                typeId: {
                  type: "string",
                },
                assetId: {
                  type: "string",
                },
                customerId: {
                  type: "string",
                },
                locationId: {
                  type: "string",
                },
                regionId: {
                  type: "string",
                },
                alias: {
                  type: "string",
                },
              },
              required: ["typeId", "assetId", "status"],
            },
          },
          installTaskAssets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                startedAt: {
                  nullable: "ture",
                },
                updatedAt: {
                  nullable: "false",
                },
                status: {
                  type: "string",
                  enum: ["Scheduled", "InProgress", "Complete", "ConnectionError", "DeviceError", "SystemError"],
                },
                typeId: {
                  type: "string",
                },
                assetId: {
                  type: "string",
                },
                customerId: {
                  type: "string",
                },
                locationId: {
                  type: "string",
                },
                regionId: {
                  type: "string",
                },
                alias: {
                  type: "string",
                },
              },
              required: ["typeId", "assetId", "status"],
            },
          },
          deploymentTaskPackages: {
            type: "object",
            properties: {
              packageId: {
                type: "string",
              },
              date: {
                type: "string",
              },
              name: {
                type: "string",
              },
              summary: {
                type: "string",
              },
            },
            required: ["name"],
          },
          logTask: {
            type: "object",
            properties: {
              logType: {
                type: "string",
              },
              memo: {
                type: "string",
              },
            },
            required: ["logType"],
          },
          logTaskAssets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                startedAt: {
                  nullable: "ture",
                },
                updatedAt: {
                  type: "string",
                },
                status: {
                  type: "string",
                  enum: ["Scheduled", "InProgress", "Complete", "ConnectionError", "DeviceError", "SystemError"],
                },
                typeId: {
                  type: "string",
                },
                assetId: {
                  type: "string",
                },
                customerId: {
                  type: "string",
                },
                locationId: {
                  type: "string",
                },
                regionId: {
                  type: "string",
                },
                alias: {
                  type: "string",
                },
              },
              required: ["typeId", "assetId", "status", "customerId", "locationId", "updatedAt"],
            },
          },
          retrieveLogs: {
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
                status: {
                  type: "string",
                  enum: ["Succeed", "Error"],
                },
                errorCode: {
                  type: "string",
                },
                errorMsg: {
                  type: "string",
                },
                filePath: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
              },
              required: ["typeId", "assetId", "filePath"],
            },
          },
          rebootTask: {
            type: "object",
            properties: {
              memo: {
                type: "string",
              },
            },
          },
          rebootTaskAssets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                startedAt: {
                  nullable: "ture",
                },
                updatedAt: {
                  nullable: "false",
                  type: "string",
                },
                status: {
                  type: "string",
                  enum: ["Scheduled", "InProgress", "Complete", "ConnectionError", "DeviceError", "SystemError"],
                },
                typeId: {
                  type: "string",
                },
                assetId: {
                  type: "string",
                },
                customerId: {
                  type: "string",
                },
                locationId: {
                  type: "string",
                },
                regionId: {
                  type: "string",
                },
                alias: {
                  type: "string",
                },
              },
              required: ["typeId", "assetId", "status"],
            },
          },
          selfTestTask: {
            type: "object",
            properties: {
              memo: {
                type: "string",
              },
            },
          },
          selfTestTaskAssets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                startedAt: {
                  nullable: "ture",
                },
                updatedAt: {
                  nullable: "false",
                  type: "string",
                },
                status: {
                  type: "string",
                  enum: ["Scheduled", "InProgress", "Complete", "ConnectionError", "DeviceError", "SystemError"],
                },
                typeId: {
                  type: "string",
                },
                assetId: {
                  type: "string",
                },
                customerId: {
                  type: "string",
                },
                locationId: {
                  type: "string",
                },
                regionId: {
                  type: "string",
                },
                alias: {
                  type: "string",
                },
              },
              required: ["typeId", "assetId", "status"],
            },
          },
        },
        required: ["id", "name", "taskType", "status", "createdBy", "createdAt", "updatedAt"],
      },
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isGetTaskResponse(params: any): params is GetTask {
    const schema: JsonSchema = {
      $id: `svc-${GuardTasksResponse.name}.${this.isGetTaskResponse.name}`,
      type: "object",
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
        taskType: {
          type: "string",
        },
        status: {
          type: "string",
          enum: ["Scheduled", "InProgress", "Failure", "Complete"],
        },
        createdBy: {
          type: ["string", "null"],
        },
        createdAt: {
          format: "date-time",
        },
        updatedAt: {
          format: "date-time",
        },
        downloadPackageTaskAssets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              startedAt: {
                nullable: "ture",
              },
              updatedAt: {
                nullable: "false",
              },
              status: {
                type: "string",
                enum: ["Scheduled", "InProgress", "Complete", "ConnectionError", "DeviceError", "SystemError"],
              },
              typeId: {
                type: "string",
              },
              assetId: {
                type: "string",
              },
              customerId: {
                type: "string",
              },
              locationId: {
                type: "string",
              },
              regionId: {
                type: "string",
              },
              alias: {
                type: "string",
              },
            },
            required: ["typeId", "assetId", "status"],
          },
        },
        installTaskAssets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              startedAt: {
                nullable: "ture",
              },
              updatedAt: {
                nullable: "false",
              },
              status: {
                type: "string",
                enum: ["Scheduled", "InProgress", "Complete", "ConnectionError", "DeviceError", "SystemError"],
              },
              typeId: {
                type: "string",
              },
              assetId: {
                type: "string",
              },
              customerId: {
                type: "string",
              },
              locationId: {
                type: "string",
              },
              regionId: {
                type: "string",
              },
              alias: {
                type: "string",
              },
            },
            required: ["typeId", "assetId", "status"],
          },
        },
        deploymentTaskPackages: {
          type: "object",
          properties: {
            packageId: {
              type: "string",
            },
            date: {
              type: "string",
            },
            name: {
              type: "string",
            },
            summary: {
              type: "string",
            },
          },
          required: ["name"],
        },
      },
      required: ["id", "name", "taskType", "status", "createdBy", "createdAt", "updatedAt"],
    };
    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
