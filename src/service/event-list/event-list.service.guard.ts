import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { SubjectMap, ImportanceMap, EImportance, EventListItemRecord, EEventSource } from "./event-list.service.i";

@Injectable()
export class GuardEventListService {
  public isImportanceMap(params: any): params is ImportanceMap {
    const schema: JsonSchema = {
      $id: `svc-${GuardEventListService.name}.${this.isImportanceMap.name}`,
      $defs: {
        EImportance: {
          type: "string",
          enum: [EImportance.Information, EImportance.Error],
        },
        taskImportanceMap: {
          type: "object",
          properties: {
            create: { $ref: "#/$defs/EImportance" },
            execute: { $ref: "#/$defs/EImportance" },
            success: { $ref: "#/$defs/EImportance" },
            fail: { $ref: "#/$defs/EImportance" },
          },
          required: ["create", "execute", "success", "fail"],
        },
      },
      type: "object",
      properties: {
        event: {
          type: "object",
          properties: {
            connected: { $ref: "#/$defs/EImportance" },
            disconnected: { $ref: "#/$defs/EImportance" },
            established: { $ref: "#/$defs/EImportance" },
            assetStatusError: { $ref: "#/$defs/EImportance" },
            firmwareUpdated: { $ref: "#/$defs/EImportance" },
          },
          required: ["connected", "disconnected", "established", "assetStatusError", "firmwareUpdated"],
        },
        task: {
          type: "object",
          properties: {
            downloadPackage: {
              $ref: "#/$defs/taskImportanceMap",
            },
            install: {
              $ref: "#/$defs/taskImportanceMap",
            },
            logs: {
              $ref: "#/$defs/taskImportanceMap",
            },
          },
          required: ["downloadPackage", "install", "logs"],
        },
      },
      required: ["event", "task"],
      additionalProperties: false,
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isSubjectMap(params: any): params is SubjectMap {
    const schema: JsonSchema = {
      $id: `svc-${GuardEventListService.name}.${this.isSubjectMap.name}`,
      $defs: {
        taskSubjectMap: {
          type: "object",
          properties: {
            create: {
              type: "string",
            },
            execute: {
              type: "string",
            },
            success: {
              type: "string",
            },
            fail: {
              type: "string",
            },
          },
          required: ["create", "execute", "success", "fail"],
        },
      },
      type: "object",
      properties: {
        event: {
          type: "object",
          properties: {
            connected: {
              type: "string",
            },
            disconnected: {
              type: "string",
            },
            established: {
              type: "string",
            },
            assetStatusError: {
              type: "string",
            },
            firmwareUpdated: {
              type: "string",
            },
          },
          required: ["connected", "disconnected", "established", "assetStatusError", "firmwareUpdated"],
        },
        task: {
          type: "object",
          properties: {
            downloadPackage: {
              $ref: "#/$defs/taskSubjectMap",
            },
            install: {
              $ref: "#/$defs/taskSubjectMap",
            },
            logs: {
              $ref: "#/$defs/taskSubjectMap",
            },
          },
          required: ["downloadPackage", "install", "logs"],
        },
      },
      required: ["event", "task"],
      additionalProperties: false,
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isEventListItemRecords(params: any): params is EventListItemRecord {
    const schema: JsonSchema = {
      $id: `svc-${GuardEventListService.name}.${this.isEventListItemRecords.name}`,
      type: "array",
      items: {
        type: "object",
        properties: {
          date: {
            format: "date-time",
          },
          eventSource: {
            type: "string",
            enum: [EEventSource.Asset, EEventSource.Bridge],
          },
          subject: {
            type: "string",
          },
          importance: {
            type: "string",
            enum: [EImportance.Information, EImportance.Error],
          },
          totalCount: {
            type: "string",
            pattern: "^[0-9]+$",
          },
        },
        required: ["date", "eventSource", "subject", "importance", "totalCount"],
        additionalProperties: false,
      },
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
