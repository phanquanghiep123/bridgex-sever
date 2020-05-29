import { TestingModule, Test } from "@nestjs/testing";

import { GuardStartSelfTest } from "./start-selftest.controller.guard";

describe("GuardStartSelfTest", () => {
  let guard: GuardStartSelfTest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardStartSelfTest],
    }).compile();

    guard = module.get(GuardStartSelfTest);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("isPutParams", () => {
    describe("should return true", () => {
      [{ title: "data is correct", input: { taskId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11" } }].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isPostBody(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is undefined", input: undefined },
        { title: "taskId doesn't exist", input: {} },
        { title: "taskId is undefined", input: { packageId: undefined } },
        { title: "taskId is number", input: { taskId: 1 } },
        { title: "taskId is boolean", input: { taskId: true } },
        { title: "taskId is empty string", input: { taskId: "" } },
        { title: "taskId is object", input: { taskId: {} } },
        { title: "taskId is array", input: { taskId: [] } },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isPostBody(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });

  describe("isSessionData", () => {
    describe("should return true", () => {
      [
        {
          title: "data is correct",
          input: { typeId: "tyty", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isSessionData(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is undefined", input: undefined },

        {
          title: "typeId is empty",
          input: { typeId: "", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        { title: "typeId is nothing", input: { assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" } },
        {
          title: "typeId is undefined",
          input: { typeId: undefined, assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        {
          title: "typeId is number",
          input: { typeId: 123, assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        {
          title: "typeId is boolean",
          input: { typeId: true, assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        {
          title: "typeId is object",
          input: { typeId: {}, assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        {
          title: "typeId is array",
          input: { typeId: [], assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },

        {
          title: "assetId is empty",
          input: { typeId: "tyty", assetId: "", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        { title: "assetId is nothing", input: { typeId: "tyty", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" } },
        {
          title: "assetId is undefined",
          input: { typeId: "tyty", assetId: undefined, sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        {
          title: "assetId is number",
          input: { typeId: "tyty", assetId: 123, sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        {
          title: "assetId is boolean",
          input: { typeId: "tyty", assetId: true, sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        {
          title: "assetId is object",
          input: { typeId: "tyty", assetId: {}, sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },
        {
          title: "assetId is array",
          input: { typeId: "tyty", assetId: [], sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "toto" },
        },

        { title: "sessionId is invalid format", input: { typeId: "tyty", assetId: "asas", sessionId: "aaaaa", topicPrefix: "toto" } },
        { title: "sessionId is nothing", input: { typeId: "tyty", assetId: "asas", topicPrefix: "toto" } },
        { title: "sessionId is undefined", input: { typeId: "tyty", assetId: "asas", sessionId: undefined, topicPrefix: "toto" } },
        { title: "sessionId is number", input: { typeId: "tyty", assetId: "asas", sessionId: 123, topicPrefix: "toto" } },
        { title: "sessionId is boolean", input: { typeId: "tyty", assetId: "asas", sessionId: true, topicPrefix: "toto" } },
        { title: "sessionId is object", input: { typeId: "tyty", assetId: "asas", sessionId: {}, topicPrefix: "toto" } },
        { title: "sessionId is array", input: { typeId: "tyty", assetId: "asas", sessionId: [], topicPrefix: "toto" } },

        {
          title: "topicPrefix is empty",
          input: { typeId: "tyty", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: "" },
        },
        { title: "topicPrefix is nothing", input: { typeId: "tyty", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11" } },
        {
          title: "topicPrefix is undefined",
          input: { typeId: "tyty", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: undefined },
        },
        {
          title: "topicPrefix is number",
          input: { typeId: "tyty", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: 123 },
        },
        {
          title: "topicPrefix is boolean",
          input: { typeId: "tyty", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: true },
        },
        {
          title: "topicPrefix is object",
          input: { typeId: "tyty", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: {} },
        },
        {
          title: "topicPrefix is array",
          input: { typeId: "tyty", assetId: "asas", sessionId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11", topicPrefix: [] },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isSessionData(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
