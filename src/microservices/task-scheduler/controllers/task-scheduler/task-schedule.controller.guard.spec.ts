import { TestingModule, Test } from "@nestjs/testing";

import { cases } from "rxjs-marbles/jest";

import { GuardTaskSchedule } from "./task-schedule.controller.guard";

// -------------------------------------------------

describe("GuardPackages", () => {
  let guard: GuardTaskSchedule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardTaskSchedule],
    }).compile();

    guard = module.get(GuardTaskSchedule);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  cases(
    GuardTaskSchedule.prototype.isPostSchedulesBody.name,
    (_, c) => {
      // arrange
      const { params, expected } = c;

      // act
      const actual = guard.isPostSchedulesBody(params);

      // assert
      expect(actual).toBe(expected);
    },
    {
      "true if callbackUrl starts with http://": {
        expected: true,
        params: { taskId: "someTaskId", callbackUrl: "http://some-callback:12345/url" },
      },
      "true if callbackUrl starts with https://": {
        expected: true,
        params: { taskId: "someTaskId", callbackUrl: "https://some-callback:12345/url" },
      },
      "true if callbackUrl uses ipaddress": {
        expected: true,
        params: { taskId: "someTaskId", callbackUrl: "https://123.45.67.89:12345/url" },
      },
      "true if params has additional properties": {
        expected: true,
        params: { taskId: "someTaskId", callbackUrl: "http://some-callback:12345/url", additional: "property" },
      },
      "true if taskId's length is 1": {
        expected: true,
        params: { taskId: "1", callbackUrl: "http://some-callback:12345/url" },
      },
      "false if callbackUrl is not url format": {
        expected: false,
        params: { taskId: "someTaskId", callbackUrl: "http:///some-callback:12345/url" },
      },
      "false if callbackUrl does not start with unexpected scheme": {
        expected: false,
        params: { taskId: "someTaskId", callbackUrl: "httpp://some-callback:12345/url" },
      },
      "false if callbackUrl does not have scheme": {
        expected: false,
        params: { taskId: "someTaskId", callbackUrl: "some-callback:12345/url" },
      },
      "false if taskId is empty string": {
        expected: false,
        params: { taskId: "", callbackUrl: "http://some-callback:12345/url" },
      },
      "false if callbackUrl is empty string": {
        expected: false,
        params: { taskId: "someTaskId", callbackUrl: "" },
      },
      "false if taskId is undefined": {
        expected: false,
        params: { callbackUrl: "http://some-callback:12345/url" },
      },
      "false if callbackUrl is undefined": {
        expected: false,
        params: { taskId: "someTaskId" },
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
