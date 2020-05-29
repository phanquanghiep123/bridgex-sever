import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { EPackageStatus } from "../../service/packages";

@Injectable()
export class GuardPackages {
  public isPostBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardPackages.name}.${this.isPostBody.name}`,
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1,
        },
      },
      required: ["name"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isPutPath(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardPackages.name}.${this.isPutPath.name}`,
      type: "object",
      properties: {
        packageId: {
          type: "string",
          minLength: 1,
        },
      },
      required: ["packageId"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isPutBody(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardPackages.name}.${this.isPutBody.name}`,
      type: "object",
      properties: {
        memo: {
          type: "string",
          minLength: 1,
        },
      },
      required: ["memo"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }

  public isGetPackageParams(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardPackages.name}.${this.isGetPackageParams.name}`,
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
        status: {
          type: "string",
          enum: [
            EPackageStatus.Complete,
            EPackageStatus.Failure,
            EPackageStatus.Invalid,
            EPackageStatus.Uploading,
            EPackageStatus.Validating,
          ],
        },
        text: {
          type: "string",
          minLength: 1,
        },
        sortName: {
          type: "string",
          pattern: "^name$|^status$|^summary$|^date$",
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

  public isDeletePath(params: any): boolean {
    const schema: JsonSchema = {
      $id: `rest-${GuardPackages.name}.${this.isDeletePath.name}`,
      type: "object",
      properties: {
        packageId: {
          type: "string",
          minLength: 1,
        },
      },
      required: ["packageId"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
