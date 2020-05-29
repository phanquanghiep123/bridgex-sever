import { TestingModule, Test } from "@nestjs/testing";

import { GuardBulkAssetsGetMany } from "./bulk-assets-getmany.controller.guard";

describe("GuardBulkAssetsGetMany", () => {
  let guard: GuardBulkAssetsGetMany;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardBulkAssetsGetMany],
    }).compile();

    guard = module.get(GuardBulkAssetsGetMany);
  });

  describe("isGetAssetsParams", () => {
    [
      {
        title: "return true when data is correct",
        input: { limit: "10", offset: "10" },
        expected: true,
      },
      {
        title: "return true when full data are correct",
        input: {
          isFilter: "true",
          status: "good",
          typeId: "typeId",
          organization: "000000",
          location: "000000",
          region: "000000",
          text: "000000",
          sortName: "assetId",
          sort: "asc",
          limit: "10",
          offset: "10",
        },
        expected: true,
      },
      {
        title: "return true when full data are correct",
        input: {
          isFilter: "false",
          status: "good",
          typeId: "typeId",
          organization: "000000",
          location: "000000",
          region: "000000",
          text: "000000",
          sortName: "typeId",
          sort: "desc",
          limit: "10",
          offset: "10",
        },
        expected: true,
      },
      { title: "return true when data is empty", input: {}, expected: true },
      { title: "return false when data is number", input: 1, expected: false },
      { title: "return false when data is string", input: "", expected: false },
      {
        title: "return false when data is boolean",
        input: true,
        expected: false,
      },
      {
        title: "return false when limit is not",
        input: [{ offset: "str" }],
        expected: false,
      },
      {
        title: "return false when offset is not",
        input: [{ limit: "str" }],
        expected: false,
      },
      {
        title: "return false when limit is not number",
        input: { limit: "aa", offset: "10" },
        expected: false,
      },
      {
        title: "return false when offset is not number",
        input: { limit: "10", offset: "xx" },
        expected: false,
      },
      {
        title: "return false when isFilter is not boolean",
        input: { isFilter: "string" },
        expected: false,
      },
      {
        title: "return false when sortName is not match pattern",
        input: { sortName: "apple" },
        expected: false,
      },
      {
        title: "return false when sort is not match pattern",
        input: { sort: "orange" },
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetAssetsParams(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe("isGetBulkAssetsStatusBody", () => {
    [
      { title: "return true when data is correct", input: [{ typeId: "typeId", assetId: "000000" }], expected: true },
      {
        title: "return true when two data are correct",
        input: [
          { typeId: "typeId", assetId: "000000" },
          { typeId: "typeId", assetId: "000001" },
        ],
        expected: true,
      },
      { title: "return true when array is empty", input: [], expected: true },
      { title: "return false when data is number", input: 1, expected: false },
      { title: "return false when data is string", input: "", expected: false },
      { title: "return false when data is object", input: {}, expected: false },
      { title: "return false when data is boolean", input: true, expected: false },
      { title: "return false when typeId is not", input: [{ assetId: "000000" }], expected: false },
      { title: "return false when assetId is not", input: [{ typeIdId: "typeId" }], expected: false },
      { title: "return false when typeId and assetId are not", input: [{}], expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetBulkAssetsStatusBody(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
