import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { PackageMetadataYaml } from "./package-validation.service.i";

@Injectable()
export class PackageValidationServiceGuard {
  public isPackageMetadataYaml(params: any): params is PackageMetadataYaml {
    const schema: JsonSchema = {
      $id: `svc-${PackageValidationServiceGuard.name}.${this.isPackageMetadataYaml.name}`,
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        files: {
          type: "array",
          items: {
            type: "string",
          },
        },
        summary: {
          type: "string",
        },
        description: {
          type: "string",
        },
        model: {
          type: "string",
        },
        elements: {
          type: "object",
          additionalProperties: {
            anyOf: [{ type: "string" }],
          },
        },
        createdBy: {
          type: "string",
        },
      },
      required: ["name", "files", "summary", "description", "model", "elements", "createdBy"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
