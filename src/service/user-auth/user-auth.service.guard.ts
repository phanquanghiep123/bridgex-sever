import { Injectable } from "@nestjs/common";

import { JsonSchema, SchemaUtility } from "../../schema";
import { UserInfo } from "./user-auth.service.i";

@Injectable()
export class GuardUserAuthService {
  public isGetUserInfoResponse(params: any): params is UserInfo {
    const schema: JsonSchema = {
      $id: `svc-${GuardUserAuthService.name}.${this.isGetUserInfoResponse.name}`,
      type: "object",
      properties: {
        userId: {
          type: "string",
        },
        email: {
          type: "string",
        },
        displayName: {
          type: "string",
        },
      },
      required: ["userId", "email", "displayName"],
    };

    return SchemaUtility.getSchemaValidator().validate(schema, params);
  }
}
