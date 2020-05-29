import { ZipError, EZipError } from "./zip.service.i";

// --------------------------------

describe(ZipError.name, () => {
  const target = new ZipError(EZipError.ZIP_FAILD, "");

  describe(ZipError.prototype.toString.name, () => {
    it("should return name, code and message", () => {
      // arrange
      const expected = `${target.name}: ${target.code}`;

      // act
      const actual = target.toString();

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe(ZipError.isZipError.name, () => {
    it("should return true when arg is ZipError instance", () => {
      // arrange
      const expected = true;

      // act
      const actual = ZipError.isZipError(target);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should return false when arg is not ZipError instance", () => {
      // arrange
      const expected = false;

      // act
      const actual = ZipError.isZipError(new Error());

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
