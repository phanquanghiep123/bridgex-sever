import { TestingModule, Test } from "@nestjs/testing";

import { GuardEstablished } from "./established.controller.guard";

describe(GuardEstablished.name, () => {
  let guard: GuardEstablished;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardEstablished],
    }).compile();

    guard = module.get(GuardEstablished);
  });

  describe(GuardEstablished.prototype.isEstablishedEvent.name, () => {
    describe("should return true", () => {
      [
        { title: "versions is empty", input: { versions: [] }, expected: true },
        { title: "versions have one version", input: { versions: [{ name: "na01", value: "va01" }] }, expected: true },
        {
          title: "versions have two versions",
          input: {
            versions: [
              { name: "na01", value: "va01" },
              { name: "na02", value: "va02" },
            ],
          },
          expected: true,
        },

        { title: "versions.name is only", input: { versions: [{ name: "nana" }] }, expected: true },

        { title: "versions.value is empty", input: { versions: [{ name: "nana", value: "" }] }, expected: true },
        { title: "versions.value is nothing", input: { versions: [{ name: "nana" }] }, expected: true },
        { title: "versions.value is undefined", input: { versions: [{ name: "nana", value: undefined }] }, expected: true },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange
          // act
          const actual = guard.isEstablishedEvent(tc.input);
          // assert
          expect(actual).toEqual(tc.expected);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "versions is undefined", input: undefined, expected: false },
        { title: "versions is null", input: null, expected: false },
        { title: "versions is empty", input: {}, expected: false },
        { title: "versions is string", input: "string dayo", expected: false },
        { title: "versions is number", input: 123, expected: false },
        { title: "versions is boolean", input: true, expected: false },
        { title: "versions is array", input: [], expected: false },

        { title: "versions is nothing", input: {}, expected: false },
        { title: "versions is undefined", input: { versions: undefined }, expected: false },
        { title: "versions is null", input: { versions: null }, expected: false },
        { title: "versions is string", input: { versions: "itit" }, expected: false },
        { title: "versions is number", input: { versions: 123 }, expected: false },
        { title: "versions is boolean", input: { versions: true }, expected: false },
        { title: "versions is object", input: { versions: {} }, expected: false },

        { title: "versions.name is nothing", input: { versions: [{ value: "vava" }] }, expected: false },
        { title: "versions.name is undefined", input: { versions: [{ name: undefined, value: "vava" }] }, expected: false },
        { title: "versions.name is null", input: { versions: [{ name: null, value: "vava" }] }, expected: false },
        { title: "versions.name is empty", input: { versions: [{ name: "", value: "vava" }] }, expected: false },
        { title: "versions.name is number", input: { versions: [{ name: 123, value: "vava" }] }, expected: false },
        { title: "versions.name is boolean", input: { versions: [{ name: true, value: "vava" }] }, expected: false },
        { title: "versions.name is array", input: { versions: [{ name: [], value: "vava" }] }, expected: false },
        { title: "versions.name is object", input: { versions: [{ name: {}, value: "vava" }] }, expected: false },

        { title: "versions.value is null", input: { versions: [{ name: "nana", value: null }] }, expected: false },
        { title: "versions.value is number", input: { versions: [{ name: "nana", value: 123 }] }, expected: false },
        { title: "versions.value is boolean", input: { versions: [{ name: "nana", value: true }] }, expected: false },
        { title: "versions.value is array", input: { versions: [{ name: "nana", value: [] }] }, expected: false },
        { title: "versions.value is object", input: { versions: [{ name: "nana", value: {} }] }, expected: false },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange
          // act
          const actual = guard.isEstablishedEvent(tc.input);
          // assert
          expect(actual).toEqual(tc.expected);
        });
      });
    });
  });
});
