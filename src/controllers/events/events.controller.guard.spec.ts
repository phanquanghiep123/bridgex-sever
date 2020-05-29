import { TestingModule, Test } from "@nestjs/testing";

import { GuardEvents } from "./events.controller.guard";

describe(GuardEvents.name, () => {
  let guard: GuardEvents;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardEvents],
    }).compile();

    guard = module.get(GuardEvents);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe(GuardEvents.prototype.isGetEventsParams.name, () => {
    const data = {
      typeId: "tyty",
      assetId: "asas",
    };

    describe("should return true", () => {
      [
        { title: "correct data", input: data },
        { title: "minimum length", input: { typeId: "t", assetId: "a" } },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isGetEventsParams(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is empty", input: {} },
        { title: "null is undefined", input: undefined },
        { title: "data is not object(string)", input: "" },
        { title: "data is not object(array)", input: [] },

        { title: "typeId is empty", input: { ...data, typeId: "" } },
        { title: "typeId is nothing", input: { assetId: "asas" } },
        { title: "typeId is undefined", input: { ...data, typeId: undefined } },
        { title: "typeId is null", input: { ...data, typeId: null } },
        { title: "typeId is not string", input: { ...data, typeId: {} } },

        { title: "assetId is empty", input: { ...data, assetId: "" } },
        { title: "assetId is nothing", input: { typeId: "tyty" } },
        { title: "assetId is undefined", input: { ...data, assetId: undefined } },
        { title: "assetId is null", input: { ...data, assetId: null } },
        { title: "assetId is not string", input: { ...data, assetId: {} } },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isGetEventsParams(tc.input)).toEqual(false);
        });
      });
    });
  });

  describe(GuardEvents.prototype.isGetEventsQuery.name, () => {
    const data = {
      limit: "20",
      offset: "0",
      text: "tete",
      eventSource: "Asset",
    };

    describe("should return true", () => {
      [
        { title: "correct data", input: data },
        { title: "data is empty", input: {} },
        { title: "minimum length", input: { limit: "0", offset: "9", text: "t" } },
        { title: "eventSource is Asset", input: { ...data, eventSource: "Asset" } },
        { title: "eventSource is Bridge", input: { ...data, eventSource: "Bridge" } },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isGetEventsQuery(tc.input)).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "null is undefined", input: undefined },
        { title: "data is not object(string)", input: "" },
        { title: "data is not object(array)", input: [] },

        { title: "limit is empty", input: { ...data, limit: "" } },
        { title: "limit is illegal value", input: { ...data, limit: "abc" } },
        { title: "limit is null", input: { ...data, limit: null } },
        { title: "limit is not string", input: { ...data, limit: 123 } },

        { title: "offset is empty", input: { ...data, offset: "" } },
        { title: "offset is illegal value", input: { ...data, offset: "abc" } },
        { title: "offset is null", input: { ...data, offset: null } },
        { title: "offset is not string", input: { ...data, offset: 123 } },

        { title: "text is empty", input: { ...data, text: "" } },
        { title: "text is null", input: { ...data, text: null } },
        { title: "text is not string", input: { ...data, text: 123 } },

        { title: "eventSource is empty", input: { ...data, eventSource: "" } },
        { title: "eventSource is illegal value", input: { ...data, eventSource: "abc" } },
        { title: "eventSource is null", input: { ...data, eventSource: null } },
        { title: "eventSource is not string", input: { ...data, eventSource: 123 } },
      ].forEach((tc) => {
        it(tc.title, () => {
          expect(guard.isGetEventsQuery(tc.input)).toEqual(false);
        });
      });
    });
  });
});
