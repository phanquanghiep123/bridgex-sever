import Ajv from "ajv";

import { logger } from "../service/logger";
import { JsonSchema } from "./validator.i";

// --------------------------------------------------------------------------

export class SchemaValidator {
  constructor(private ajv: Ajv.Ajv = new Ajv()) {}

  public validate(schema: JsonSchema, data: any): boolean {
    const valid = this.ajv.validate(schema, data);
    if (!valid) {
      logger.info(this.ajv.errorsText(), valid);
      return false;
    }

    return true;
  }
}

export class SchemaUtility {
  public static validator: SchemaValidator | null;

  public static getSchemaValidator(ajv?: Ajv.Ajv) {
    if (!this.validator) {
      this.validator = new SchemaValidator(ajv);
    }

    return this.validator;
  }
}
