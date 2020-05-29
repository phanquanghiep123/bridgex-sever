import { TestingModule, Test } from "@nestjs/testing";

import { GuardAssetStatus } from "./asset-status.controller.guard";

describe("GuardGetAsset", () => {
  let guard: GuardAssetStatus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardAssetStatus],
    }).compile();

    guard = module.get(GuardAssetStatus);
  });

  describe("isGetAssetParams", () => {
    [
      { title: "return true when data is correct", input: { typeId: "typeId", assetId: "000000" }, expected: true },
      { title: "return true when data is minimum length", input: { typeId: "t", assetId: "a" }, expected: true },
      { title: "return false when data is undefined", input: undefined, expected: false },
      { title: "return false when data is null", input: null, expected: false },
      { title: "return false when data is number", input: 1, expected: false },
      { title: "return false when data is string", input: "", expected: false },
      { title: "return false when data is array", input: [], expected: false },
      { title: "return false when data is boolean", input: true, expected: false },
      { title: "return false when typeId is not", input: { assetId: "000000" }, expected: false },
      { title: "return false when assetId is not", input: { typeIdId: "typeId" }, expected: false },
      { title: "return false when typeId and assetId are not", input: {}, expected: false },
      { title: "return false when typeId is empty", input: { typeId: "", assetId: "000000" }, expected: false },
      { title: "return false when assetId is empty", input: { typeIdId: "typeId", assetId: "" }, expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetAssetStatusParams(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe("isPutAssetStatusParams", () => {
    describe("should return true", () => {
      [
        { title: "data is correct", input: { typeId: "tyty", assetId: "asas" } },
        { title: "data is minimum length", input: { typeId: "t", assetId: "a" } },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isPutAssetStatusParams(tc.input);
          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is undefined" },
        { title: "data is null", input: null },
        { title: "data is boolean", input: true },
        { title: "data is number", input: 123 },
        { title: "data is string", input: "str" },
        { title: "data is array", input: [] },

        { title: "typeId is empty", input: { typeId: "", assetId: "asas" } },
        { title: "typeId is nothing", input: { assetId: "asas" } },
        { title: "typeId is undefined", input: { typeId: undefined, assetId: "asas" } },
        { title: "typeId is null", input: { typeId: null, assetId: "asas" } },
        { title: "typeId is boolean", input: { typeId: true, assetId: "asas" } },
        { title: "typeId is number", input: { typeId: 123, assetId: "asas" } },
        { title: "typeId is array", input: { typeId: [{}, {}], assetId: "asas" } },
        { title: "typeId is object", input: { typeId: {}, assetId: "asas" } },

        { title: "assetId is empty", input: { typeIdId: "tyty", assetId: "" } },
        { title: "assetId is nothing", input: { typeIdId: "tyty" } },
        { title: "assetId is undefined", input: { typeId: "tyty", assetId: undefined } },
        { title: "assetId is null", input: { typeId: "tyty", assetId: null } },
        { title: "assetId is boolean", input: { typeId: "tyty", assetId: true } },
        { title: "assetId is number", input: { typeId: "tyty", assetId: 123 } },
        { title: "assetId is array", input: { typeId: "tyty", assetId: [{}, {}] } },
        { title: "assetId is object", input: { typeId: "tyty", assetId: {} } },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isPutAssetStatusParams(tc.input);
          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });

  describe("isPutAssetStatusBody", () => {
    describe("should return true", () => {
      [
        { title: "data is correct", input: { note: "nono" } },
        { title: "data is empty", input: {} },

        { title: "note is empty", input: { note: "" } },
        { title: "note is undefined", input: { note: undefined } },
      ].forEach((testCase) => {
        it(testCase.title, () => {
          // arrange

          // act
          const actual = guard.isPutAssetStatusBody(testCase.input);
          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is undefined", input: undefined },
        { title: "data is null", input: null },
        { title: "data is number", input: 1 },
        { title: "data is string", input: "" },
        { title: "data is array", input: [] },
        { title: "data is boolean", input: true },

        { title: "note is null", input: { note: null } },
        { title: "note is boolean", input: { note: true } },
        { title: "note is number", input: { note: 123 } },
        { title: "note is array", input: { note: [] } },
        { title: "note is object", input: { note: {} } },
      ].forEach((testCase) => {
        it(testCase.title, () => {
          // arrange

          // act
          const actual = guard.isPutAssetStatusBody(testCase.input);
          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
