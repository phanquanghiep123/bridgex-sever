import { TestingModule, Test } from "@nestjs/testing";

import { GuardPackages } from "./packages.controller.guard";
import { EPackageStatus } from "../../service/packages";

describe(GuardPackages.name, () => {
  let guard: GuardPackages;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardPackages],
    }).compile();

    guard = module.get(GuardPackages);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe(GuardPackages.prototype.isGetPackageParams.name, () => {
    [
      // check required elem
      { title: "return true when input is empty object", input: {}, expected: true },

      // unexpected elem
      { title: "return true when status includes unexpected element", input: { unexpected: "" }, expected: true },

      // limit
      { title: "return true when limit is string format of number", input: { limit: "10" }, expected: true },
      { title: "return false when limit is not string format of number", input: { limit: "a" }, expected: false },
      { title: "return false when limit is empty string", input: { limit: "" }, expected: false },
      { title: "return false when limit is not string", input: { limit: 10 }, expected: false },

      // offset
      { title: "return true when offset is string format of number", input: { offset: "0" }, expected: true },
      { title: "return false when offset is string format of number", input: { offset: "a" }, expected: false },
      { title: "return false when offset is empty string", input: { offset: "" }, expected: false },
      { title: "return false when offset is not string", input: { offset: 0 }, expected: false },

      // status
      { title: "return true when status is Complete", input: { status: EPackageStatus.Complete }, expected: true },
      { title: "return true when status is Failure", input: { status: EPackageStatus.Failure }, expected: true },
      { title: "return true when status is Invalid", input: { status: EPackageStatus.Invalid }, expected: true },
      { title: "return true when status is Uploading", input: { status: EPackageStatus.Uploading }, expected: true },
      { title: "return true when status is Validating", input: { status: EPackageStatus.Validating }, expected: true },
      { title: "return false when status is not in enumeration", input: { status: "" }, expected: false },
      { title: "return false when status is not string", input: { status: 1 }, expected: false },

      // text
      { title: "return false when text is empty string", input: { offset: "" }, expected: false },

      // sortName
      { title: "return false when sortName is not match pattern", input: { sortName: "apple" }, expected: false },

      // sort
      { title: "return false when sort is not match pattern", input: { sort: "orange" }, expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetPackageParams(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe(GuardPackages.prototype.isPostBody.name, () => {
    describe("should return true", () => {
      [{ title: "correct data", input: { name: "name" } }].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPostBody(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "name is empty string", input: { name: "" } },
        { title: "name is number", input: { name: 1 } },
        { title: "name is boolean", input: { name: false } },
        { title: "name is object", input: { name: {} } },
        { title: "name is array", input: { name: [] } },
        { title: "input is empty object", input: {} },
        { title: "input doesn't have name property", input: { hoge: "" } },
        { title: "input is undefined", input: undefined },
        { title: "input is null", input: null },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPostBody(tc.input)).toEqual(false);
        });
      });
    });
  });

  describe(GuardPackages.prototype.isPutPath.name, () => {
    describe("should return true", () => {
      [{ title: "correct data", input: { packageId: "packageId" } }].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPutPath(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "name is empty string", input: { packageId: "" } },
        { title: "name is number", input: { packageId: 1 } },
        { title: "name is boolean", input: { packageId: false } },
        { title: "name is object", input: { packageId: {} } },
        { title: "name is array", input: { packageId: [] } },
        { title: "input is empty object", input: {} },
        { title: "input doesn't have name property", input: { hoge: "" } },
        { title: "input is undefined", input: undefined },
        { title: "input is null", input: null },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPutPath(tc.input)).toEqual(false);
        });
      });
    });
  });

  describe(GuardPackages.prototype.isPutPath.name, () => {
    describe("should return true", () => {
      [{ title: "correct data", input: { memo: "memo" } }].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPutBody(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "name is empty string", input: { memo: "" } },
        { title: "name is number", input: { memo: 1 } },
        { title: "name is boolean", input: { memo: false } },
        { title: "name is object", input: { memo: {} } },
        { title: "name is array", input: { memo: [] } },
        { title: "input is empty object", input: {} },
        { title: "input doesn't have name property", input: { hoge: "" } },
        { title: "input is undefined", input: undefined },
        { title: "input is null", input: null },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPutBody(tc.input)).toEqual(false);
        });
      });
    });
  });

  describe(GuardPackages.prototype.isDeletePath.name, () => {
    describe("should return true", () => {
      [{ title: "correct data", input: { packageId: "packageId" } }].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isDeletePath(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "name is empty string", input: { packageId: "" } },
        { title: "name is number", input: { packageId: 1 } },
        { title: "name is boolean", input: { packageId: false } },
        { title: "name is object", input: { packageId: {} } },
        { title: "name is array", input: { packageId: [] } },
        { title: "input is empty object", input: {} },
        { title: "input doesn't have name property", input: { hoge: "" } },
        { title: "input is undefined", input: undefined },
        { title: "input is null", input: null },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isDeletePath(tc.input)).toEqual(false);
        });
      });
    });
  });
});
