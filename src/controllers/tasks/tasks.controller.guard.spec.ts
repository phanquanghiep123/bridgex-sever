import { TestingModule, Test } from "@nestjs/testing";

import { GuardTasks } from "./tasks.controller.guard";

describe(GuardTasks.name, () => {
  let guard: GuardTasks;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardTasks],
    }).compile();

    guard = module.get(GuardTasks);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe(GuardTasks.prototype.isGetTaskParams.name, () => {
    [
      {
        title: "return true when data is correct",
        input: { limit: "10", offset: "10", text: "name type", sortName: "name", sort: "desc" },
        expected: true,
      },
      { title: "return true when data is correct", input: { limit: "a", offset: "100" }, expected: false },
      { title: "return true when data is correct", input: { limit: "100", offset: "a" }, expected: false },
      {
        title: "return true when full data are correct",
        input: {
          text: "000000",
          sortName: "name",
          sort: "desc",
          limit: "10",
          offset: "10",
        },
        expected: true,
      },
      { title: "return true when data is empty", input: {}, expected: true },
      { title: "return false when data is number", input: 1, expected: false },
      { title: "return false when data is string", input: "", expected: false },
      { title: "return false when data is boolean", input: true, expected: false },
      { title: "return false when limit is not", input: [{ offset: "str" }], expected: false },
      { title: "return false when offset is not", input: [{ limit: "str" }], expected: false },
      { title: "return false when text is empty", input: { text: "" }, expected: false },
      { title: "return false when text is number", input: { text: 1 }, expected: false },
      { title: "return false when sortName is empty", input: { sortName: "" }, expected: false },
      { title: "return false when sortName is not enum", input: { sortName: "apple" }, expected: false },
      { title: "return false when sort is empty", input: { sort: "" }, expected: false },
      { title: "return false when sort is not enum", input: { sort: "orange" }, expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetTaskParams(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe(GuardTasks.prototype.isPostBody.name, () => {
    describe("should return true", () => {
      [
        {
          title: "correct data",
          input: {
            name: "name",
            packages: ["pkg"],
            assets: [{ typeId: "tyid", assetId: "asid" }],
          },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPostBody(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "name is empty string", input: { name: "", packages: ["pkg"], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "packages is empty string", input: { name: "name", packages: [""], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "assets typeId is empty string", input: { name: "name", packages: ["pkg"], assets: [{ typeId: "", assetId: "asid" }] } },
        { title: "assets assetId is empty string", input: { name: "name", packages: ["pkg"], assets: [{ typeId: "tyid", assetId: "" }] } },

        { title: "name is number", input: { name: 1, packages: ["pkg"], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "package has numeric value", input: { name: "name", packages: [1], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        {
          title: "package has more than one item",
          input: { name: "name", packages: ["1000", "2000"], assets: [{ typeId: "tyid", assetId: "asid" }] },
        },
        { title: "assets typeId is number", input: { name: "name", packages: ["pkg"], assets: [{ typeId: 1, assetId: "asid" }] } },
        { title: "assets assetId is number", input: { name: "name", packages: ["pkg"], assets: [{ typeId: "tyid", assetId: 1 }] } },

        { title: "name is boolean", input: { name: false, packages: ["pkg"], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "package is boolean", input: { name: "name", packages: [false], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "assets typeId is boolean", input: { name: "name", packages: ["pkg"], assets: [{ typeId: false, assetId: "asid" }] } },
        { title: "assets assetId is boolean", input: { name: "name", packages: ["pkg"], assets: [{ typeId: "tyid", assetId: false }] } },

        { title: "name is object", input: { name: {}, packages: ["pkg"], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "name is array", input: { name: [], packages: ["pkg"], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "packages is string", input: { name: "", packages: "pkg", assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "packages is object", input: { name: "", packages: {}, assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "assets typeId is array", input: { name: "name", packages: "pkg", assets: [{ typeId: [], assetId: "asid" }] } },
        { title: "assets assetId is array", input: { name: "name", packages: "pkg", assets: [{ typeId: "tyid", assetId: [] }] } },
        { title: "assets typeId is object", input: { name: "name", packages: "pkg", assets: [{ typeId: {}, assetId: "asid" }] } },
        { title: "assets assetId is object", input: { name: "name", packages: "pkg", assets: [{ typeId: "tyid", assetId: {} }] } },

        { title: "input is empty object", input: {} },
        {
          title: "input doesn't have name property",
          input: { hoge: "", packages: ["pkg"], assets: [{ typeId: "tyid", assetId: "asid" }] },
        },
        {
          title: "input doesn't have assets typeId property",
          input: { name: "name", packages: ["pkg"], assets: [{ hoge: "", assetId: "asid" }] },
        },
        {
          title: "input doesn't have assets assetId property",
          input: { name: "name", packages: ["pkg"], assets: [{ typeId: "", hoge: "asid" }] },
        },

        { title: "input is undefined", input: undefined },
        { title: "input is null", input: null },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPostBody(tc.input)).toEqual(false);
        });
      });
    });
  });

  describe(GuardTasks.prototype.isPostLogTaskBody.name, () => {
    describe("should return true", () => {
      [
        {
          title: "correct data",
          input: {
            logType: "Business",
            memo: "abcdefg",
            assets: [{ typeId: "tyid", assetId: "asid" }],
          },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPostLogTaskBody(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "logType is empty string", input: { logType: "", memo: "abcdefg", assets: [{ typeId: "tyid", assetId: "asid" }] } },
        {
          title: "assets typeId is empty string",
          input: { logType: "Business", memo: "abcdefg", assets: [{ typeId: "", assetId: "asid" }] },
        },
        {
          title: "assets assetId is empty string",
          input: { logType: "Business", memo: "abcdefg", assets: [{ typeId: "tyid", assetId: "" }] },
        },
        { title: "assets is empty string", input: { logType: "Business", memo: "abcdefg" } },

        { title: "logType is number", input: { logType: 1, memo: "abcdefg", assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "memo is number", input: { logType: "Business", memo: 1, assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "assets typeId is number", input: { logType: "Business", memo: "abcdefg", assets: [{ typeId: 1, assetId: "asid" }] } },
        { title: "assets assetId is number", input: { logType: "Business", memo: "abcdefg", assets: [{ typeId: "tyid", assetId: 1 }] } },

        { title: "logType is object", input: { logType: {}, memo: "abcdefg", assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "logType is array", input: { logType: [], memo: "abcdefg", assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "memo is object", input: { logType: "Business", memo: {}, assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "memo is array", input: { logType: "Business", memo: [], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "assets typeId is array", input: { logType: "Business", memo: "abcdefg", assets: [{ typeId: [], assetId: "asid" }] } },
        { title: "assets assetId is array", input: { logType: "Business", memo: "abcdefg", assets: [{ typeId: "tyid", assetId: [] }] } },
        { title: "assets typeId is object", input: { logType: "Business", memo: "abcdefg", assets: [{ typeId: {}, assetId: "asid" }] } },
        { title: "assets assetId is object", input: { logType: "Business", memo: "abcdefg", assets: [{ typeId: "tyid", assetId: {} }] } },

        { title: "input is empty object", input: {} },
        { title: "input is undefined", input: undefined },
        { title: "input is null", input: null },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPostLogTaskBody(tc.input)).toEqual(false);
        });
      });
    });
  });

  describe(GuardTasks.prototype.isPostRebootSelfTestTaskBody.name, () => {
    describe("should return true", () => {
      [
        {
          title: "correct data",
          input: {
            memo: "abcdefg",
            assets: [{ typeId: "tyid", assetId: "asid" }],
          },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPostRebootSelfTestTaskBody(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        {
          title: "assets typeId is empty string",
          input: { memo: "abcdefg", assets: [{ typeId: "", assetId: "asid" }] },
        },
        {
          title: "assets assetId is empty string",
          input: { memo: "abcdefg", assets: [{ typeId: "tyid", assetId: "" }] },
        },
        { title: "assets is empty string", input: { memo: "abcdefg" } },

        { title: "memo is number", input: { memo: 1, assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "assets typeId is number", input: { memo: "abcdefg", assets: [{ typeId: 1, assetId: "asid" }] } },
        { title: "assets assetId is number", input: { memo: "abcdefg", assets: [{ typeId: "tyid", assetId: 1 }] } },

        { title: "memo is object", input: { memo: {}, assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "memo is array", input: { memo: [], assets: [{ typeId: "tyid", assetId: "asid" }] } },
        { title: "assets typeId is array", input: { memo: "abcdefg", assets: [{ typeId: [], assetId: "asid" }] } },
        { title: "assets assetId is array", input: { memo: "abcdefg", assets: [{ typeId: "tyid", assetId: [] }] } },
        { title: "assets typeId is object", input: { memo: "abcdefg", assets: [{ typeId: {}, assetId: "asid" }] } },
        { title: "assets assetId is object", input: { memo: "abcdefg", assets: [{ typeId: "tyid", assetId: {} }] } },

        { title: "input is empty object", input: {} },
        { title: "input is undefined", input: undefined },
        { title: "input is null", input: null },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isPostRebootSelfTestTaskBody(tc.input)).toEqual(false);
        });
      });
    });
  });
});
