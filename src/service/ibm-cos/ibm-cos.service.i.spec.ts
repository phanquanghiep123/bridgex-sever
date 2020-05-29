import { IbmCosError, EIbmCosError } from "./ibm-cos.service.i";

// --------------------------------

describe(IbmCosError.name, () => {
  const target = new IbmCosError(EIbmCosError.AWS_ERROR, "");

  describe(IbmCosError.prototype.toString.name, () => {
    it("should return name, code and message", () => {
      // arrange
      const expected = `${target.name}: ${target.code}.  ${target.message}`;

      // act
      const actual = target.toString();

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe(IbmCosError.isIbmCosError.name, () => {
    it("should return true when arg is IbmCosError instance", () => {
      // arrange
      const expected = true;

      // act
      const actual = IbmCosError.isIbmCosError(target);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should return false when arg is not IbmCosError instance", () => {
      // arrange
      const expected = false;

      // act
      const actual = IbmCosError.isIbmCosError(new Error());

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
