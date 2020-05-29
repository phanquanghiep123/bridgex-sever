import { TestingModule, Test } from "@nestjs/testing";

import { cases } from "rxjs-marbles/jest";

import { GuardMqttSession } from "./mqtt-session.controller.guard";

// -------------------------------------------------

describe("GuardPackages", () => {
  let guard: GuardMqttSession;

  beforeEach(async () => {
    const m: TestingModule = await Test.createTestingModule({
      providers: [GuardMqttSession],
    }).compile();

    guard = m.get(GuardMqttSession);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  cases(
    GuardMqttSession.prototype.isPostSessionsBody.name,
    (_, c) => {
      // arrange
      const { params, expected } = c;

      // act
      const actual = guard.isPostSessionsBody(params);

      // assert
      expect(actual).toBe(expected);
    },
    {
      "true if expected params": {
        expected: true,
        params: { typeId: "someTypeId", assetId: "someAssetId" },
      },
      "true if expected params has additional properties": {
        expected: true,
        params: { typeId: "someTypeId", assetId: "someAssetId", additional: "property" },
      },
      "true if typeId's length is 1": {
        expected: true,
        params: { typeId: "1", assetId: "someAssetId" },
      },
      "true if assetId's length is 1": {
        expected: true,
        params: { typeId: "someTypeId", assetId: "1" },
      },
      "false if typeId is empty string": {
        expected: false,
        params: { typeId: "", assetId: "someAssetId" },
      },
      "false if assetId is empty string": {
        expected: false,
        params: { typeId: "someTypeId", assetId: "" },
      },
      "false if typeId is undefined": {
        expected: false,
        params: { assetId: "someAssetId" },
      },
      "false if assetId is undefined": {
        expected: false,
        params: { typeId: "someTypeId" },
      },
      "false if params is empty object": {
        expected: false,
        params: {},
      },
      "false if params is undefined": {
        expected: false,
        params: undefined,
      },
    },
  );

  cases(
    GuardMqttSession.prototype.isDeleteSessionParams.name,
    (_, c) => {
      // arrange
      const { params, expected } = c;

      // act
      const actual = guard.isDeleteSessionParams(params);

      // assert
      expect(actual).toBe(expected);
    },
    {
      "true if params is uuid": {
        expected: true,
        params: "192A3b4C-5d6E-7f80-192a-3B4c5D6e7F80",
      },
      "false if params' length is not uuid": {
        expected: false,
        params: "192A3b4C-5d6E-7f80-192a-3B4c5D6e7F8G",
      },
      "false if params is empty string": {
        expected: false,
        params: "",
      },
      "false if params length is less": {
        expected: false,
        params: "192A3b4C-5d6E-7f80-192a-3B4c5D6e7F8",
      },
      "false if params is empty object": {
        expected: false,
        params: {},
      },
      "false if params is undefined": {
        expected: false,
        params: undefined,
      },
    },
  );
});
