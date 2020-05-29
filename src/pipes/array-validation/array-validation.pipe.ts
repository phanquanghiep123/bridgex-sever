import { ArgumentMetadata, mixin, PipeTransform, Type, ValidationPipe, BadRequestException } from "@nestjs/common";

import { memoize } from "lodash";

// -------------------------------------------------------

function createArrayValidationPipe<T>(itemType: Type<T>): Type<PipeTransform> {
  class MixinArrayValidationPipe extends ValidationPipe implements PipeTransform {
    public transform(values: T[], metadata: ArgumentMetadata): Promise<any[]> {
      if (!Array.isArray(values)) {
        throw new BadRequestException("value should be an array");
      }

      return Promise.all(values.map((value) => super.transform(value, { ...metadata, metatype: itemType })));
    }
  }

  return mixin(MixinArrayValidationPipe);
}

export const ArrayValidationPipe: <T>(itemType: Type<T>) => Type<PipeTransform> = memoize(createArrayValidationPipe);
