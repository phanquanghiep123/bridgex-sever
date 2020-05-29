import { TestingModule, Test } from "@nestjs/testing";

import { GuardPackageUploadFailure } from "./package-upload-failure.controller.guard";

describe("GuardPackageUploadFailure", () => {
  let guard: GuardPackageUploadFailure;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardPackageUploadFailure],
    }).compile();

    guard = module.get(GuardPackageUploadFailure);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("isPutParams", () => {
    describe("should return true", () => {
      [{ title: "data is correct", input: { packageId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11" } }].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isPutParams(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data doesn't exist", input: {} },
        { title: "data is undefined", input: { packageId: undefined } },
        { title: "data is number", input: { packageId: 1 } },
        { title: "data is boolean", input: { packageId: true } },
        { title: "data is empty string", input: { packageId: "" } },
        { title: "data is object", input: { packageId: {} } },
        { title: "data is array", input: { packageId: [] } },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isPutParams(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
