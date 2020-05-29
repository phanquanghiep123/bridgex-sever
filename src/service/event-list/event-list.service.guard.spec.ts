import { TestingModule, Test } from "@nestjs/testing";

import { GuardEventListService } from "./event-list.service.guard";

describe("GuardEventListService", () => {
  let guard: GuardEventListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardEventListService],
    }).compile();

    guard = module.get(GuardEventListService);
  });

  describe("isImportanceMap", () => {
    const event = {
      connected: "information",
      disconnected: "information",
      established: "information",
      assetStatusError: "error",
      firmwareUpdated: "information",
    };
    const downloadPackage = {
      create: "information",
      execute: "information",
      success: "information",
      fail: "error",
    };
    const install = {
      create: "information",
      execute: "information",
      success: "information",
      fail: "error",
    };
    const logs = {
      create: "information",
      execute: "information",
      success: "information",
      fail: "error",
    };
    const task = {
      downloadPackage,
      install,
      logs,
    };
    const map = {
      event,
      task,
    };

    describe("should return true", () => {
      [
        { title: "data is correct", input: map },
        { title: "someone value is information", input: { ...map, event: { ...event, assetStatusError: "information" } } },
        { title: "someone value is error", input: { ...map, task: { ...task, deployments: { ...downloadPackage, create: "error" } } } },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isImportanceMap(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "someone value is illegal", input: { ...map, event: { ...event, connected: "hoge" } } },
        { title: "event is undefined", input: { ...map, event: undefined } },
        { title: "event.connected is undefined", input: { ...map, event: { ...event, connected: undefined } } },
        { title: "event.disconnected is undefined", input: { ...map, event: { ...event, disconnected: undefined } } },
        { title: "event.established is undefined", input: { ...map, event: { ...event, established: undefined } } },
        { title: "event.assetStatusError is undefined", input: { ...map, event: { ...event, assetStatusError: undefined } } },
        { title: "event.firmwareUpdated is undefined", input: { ...map, event: { ...event, firmwareUpdated: undefined } } },
        { title: "task is undefined", input: { ...map, task: undefined } },
        { title: "task.deployments is undefined", input: { ...map, task: { ...task, downloadPackage: undefined } } },
        {
          title: "task.deployments.create is undefined",
          input: { ...map, task: { ...task, downloadPackage: { ...downloadPackage, create: undefined } } },
        },
        {
          title: "task.deployments.execute is undefined",
          input: { ...map, task: { ...task, downloadPackage: { ...downloadPackage, execute: undefined } } },
        },
        {
          title: "task.deployments.success is undefined",
          input: { ...map, task: { ...task, downloadPackage: { ...downloadPackage, success: undefined } } },
        },
        {
          title: "task.deployments.fail is undefined",
          input: { ...map, task: { ...task, downloadPackage: { ...downloadPackage, fail: undefined } } },
        },
        { title: "task.deployments is undefined", input: { ...map, task: { ...task, install: undefined } } },
        {
          title: "task.install.create is undefined",
          input: { ...map, task: { ...task, install: { ...install, create: undefined } } },
        },
        {
          title: "task.install.execute is undefined",
          input: { ...map, task: { ...task, install: { ...install, execute: undefined } } },
        },
        {
          title: "task.install.success is undefined",
          input: { ...map, task: { ...task, install: { ...install, success: undefined } } },
        },
        {
          title: "task.install.fail is undefined",
          input: { ...map, task: { ...task, install: { ...install, fail: undefined } } },
        },
        { title: "task.logs is undefined", input: { ...map, task: { ...task, logs: undefined } } },
        {
          title: "task.logs.create is undefined",
          input: { ...map, task: { ...task, logs: { ...logs, create: undefined } } },
        },
        {
          title: "task.logs.execute is undefined",
          input: { ...map, task: { ...task, logs: { ...logs, execute: undefined } } },
        },
        {
          title: "task.logs.success is undefined",
          input: { ...map, task: { ...task, logs: { ...logs, success: undefined } } },
        },
        {
          title: "task.logs.fail is undefined",
          input: { ...map, task: { ...task, logs: { ...logs, fail: undefined } } },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isImportanceMap(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });

  describe("isSubjectMap", () => {
    const event = {
      connected: "test-connected",
      disconnected: "test-disconnected",
      established: "test-established",
      assetStatusError: "test-assetStatusError",
      firmwareUpdated: "test-firmwareUpdated",
    };
    const downloadPackage = {
      create: "test-create-deployments",
      execute: "test-execute-deployments",
      success: "test-success-deployments",
      fail: "test-fail-deployments",
    };
    const install = {
      create: "test-create-deployments",
      execute: "test-execute-deployments",
      success: "test-success-deployments",
      fail: "test-fail-deployments",
    };
    const logs = {
      create: "test-create-logs",
      execute: "test-execute-logs",
      success: "test-success-logs",
      fail: "test-fail-logs",
    };
    const task = {
      downloadPackage,
      install,
      logs,
    };
    const map = {
      event,
      task,
    };

    describe("should return true", () => {
      [{ title: "data is correct", input: map }].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isSubjectMap(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "event is undefined", input: { ...map, event: undefined } },
        { title: "event.connected is undefined", input: { ...map, event: { ...event, connected: undefined } } },
        { title: "event.disconnected is undefined", input: { ...map, event: { ...event, disconnected: undefined } } },
        { title: "event.established is undefined", input: { ...map, event: { ...event, established: undefined } } },
        { title: "event.assetStatusError is undefined", input: { ...map, event: { ...event, assetStatusError: undefined } } },
        { title: "event.firmwareUpdated is undefined", input: { ...map, event: { ...event, firmwareUpdated: undefined } } },
        { title: "task is undefined", input: { ...map, task: undefined } },
        { title: "task.downloadPackage is undefined", input: { ...map, task: { ...task, downloadPackage: undefined } } },
        {
          title: "task.deployments.create is undefined",
          input: { ...map, task: { ...task, downloadPackage: { ...downloadPackage, create: undefined } } },
        },
        {
          title: "task.deployments.execute is undefined",
          input: { ...map, task: { ...task, downloadPackage: { ...downloadPackage, execute: undefined } } },
        },
        {
          title: "task.deployments.success is undefined",
          input: { ...map, task: { ...task, downloadPackage: { ...downloadPackage, success: undefined } } },
        },
        {
          title: "task.deployments.fail is undefined",
          input: { ...map, task: { ...task, downloadPackage: { ...downloadPackage, fail: undefined } } },
        },
        { title: "task.install is undefined", input: { ...map, task: { ...task, install: undefined } } },
        {
          title: "task.install.create is undefined",
          input: { ...map, task: { ...task, install: { ...install, create: undefined } } },
        },
        {
          title: "task.install.execute is undefined",
          input: { ...map, task: { ...task, install: { ...install, execute: undefined } } },
        },
        {
          title: "task.install.success is undefined",
          input: { ...map, task: { ...task, install: { ...install, success: undefined } } },
        },
        {
          title: "task.install.fail is undefined",
          input: { ...map, task: { ...task, install: { ...install, fail: undefined } } },
        },
        { title: "task.logs is undefined", input: { ...map, task: { ...task, logs: undefined } } },
        {
          title: "task.logs.create is undefined",
          input: { ...map, task: { ...task, logs: { ...logs, create: undefined } } },
        },
        {
          title: "task.logs.execute is undefined",
          input: { ...map, task: { ...task, logs: { ...logs, execute: undefined } } },
        },
        {
          title: "task.logs.success is undefined",
          input: { ...map, task: { ...task, logs: { ...logs, success: undefined } } },
        },
        {
          title: "task.logs.fail is undefined",
          input: { ...map, task: { ...task, logs: { ...logs, fail: undefined } } },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isSubjectMap(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });

  describe("isEventListItemRecords", () => {
    const data = [
      {
        date: "2020-04-12T15:38:38.326Z",
        eventSource: "asset",
        subject: "susu",
        importance: "information",
        totalCount: "123456789",
      },
      {
        date: "2020-04-12T15:38:38.326Z",
        eventSource: "bridge",
        subject: "",
        importance: "error",
        totalCount: "0",
      },
    ];

    describe("should return true", () => {
      [{ title: "data is correct", input: data }].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isEventListItemRecords(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "date is illegal value", input: { ...data, date: "abc" } },
        { title: "date is undefined", input: { ...data, date: undefined } },

        { title: "eventSource is illegal value", input: { ...data, eventSource: "abc" } },
        { title: "eventSource is undefined", input: { ...data, eventSource: undefined } },

        { title: "subject is illegal value", input: { ...data, eventSource: 123 } },
        { title: "subject is undefined", input: { ...data, date: undefined } },

        { title: "importance is illegal value", input: { ...data, importance: "abc" } },
        { title: "importance is undefined", input: { ...data, importance: undefined } },

        { title: "totalCount is illegal value", input: { ...data, totalCount: "abc" } },
        { title: "totalCount is undefined", input: { ...data, totalCount: undefined } },

        { title: "additional property", input: { ...data, hoge: "abc" } },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isEventListItemRecords(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
