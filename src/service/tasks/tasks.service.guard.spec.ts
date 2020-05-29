import { TestingModule, Test } from "@nestjs/testing";

import { GuardTasksResponse } from "./tasks.service.guard";

describe("GuardGetTask", () => {
  let guard: GuardTasksResponse;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardTasksResponse],
    }).compile();

    guard = module.get(GuardTasksResponse);
  });

  describe("isGetTasksResponse", () => {
    [
      {
        title: "return true when data is correct",
        input: [
          {
            id: "id",
            name: "type",
            taskType: "taskType",
            status: "Scheduled",
            relatedTaskId: "id",
            relatedTaskType: "type",
            createdBy: "foo",
            createdAt: "2020-01-20T04:56:24.267Z",
            updatedAt: "2020-01-20T04:56:24.267Z",
            downloadPackageTaskAssets: [],
            installTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: { logType: "type" },
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {},
            rebootTaskAssets: [],
            selfTestTask: {},
            selfTestTaskAssets: [],
          },
        ],
        expected: true,
      },
      {
        title: "return true when data items is empty array",
        input: [],
        expected: true,
      },
      {
        title: "return false when data items is undefined",
        input: undefined,
        expected: false,
      },
      {
        title: "return false when data items is not array",
        input: "",
        expected: false,
      },
      {
        title: "return false when id doesn't exist",
        input: [
          {
            name: "type",
            taskType: "taskType",
            status: "Scheduled",
            createdBy: "foo",
            createdAt: "2020-01-20T04:56:24.267Z",
            updatedAt: "2020-01-20T04:56:24.267Z",
            downloadPackageTaskAssets: [],
            installTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {},
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {},
            rebootTaskAssets: [],
            selfTestTask: {},
            selfTestTaskAssets: [],
          },
        ],
        expected: false,
      },
      {
        title: "return false when name doesn't exist",
        input: [
          {
            id: "111",
            taskType: "taskType",
            status: "Scheduled",
            createdBy: "foo",
            createdAt: "2020-01-20T04:56:24.267Z",
            updatedAt: "2020-01-20T04:56:24.267Z",
            downloadPackageTaskAssets: [],
            installTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {},
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {},
            rebootTaskAssets: [],
            selfTestTask: {},
            selfTestTaskAssets: [],
          },
        ],
        expected: false,
      },
      {
        title: "return false when status doesn't exist",
        input: [
          {
            id: "111",
            name: "type",
            taskType: "taskType",
            createdBy: "foo",
            createdAt: "2020-01-20T04:56:24.267Z",
            updatedAt: "2020-01-20T04:56:24.267Z",
            downloadPackageTaskAssets: [],
            installTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {},
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {},
            rebootTaskAssets: [],
            selfTestTask: {},
            selfTestTaskAssets: [],
          },
        ],
        expected: false,
      },
      {
        title: "return false when createdBy doesn't exist",
        input: [
          {
            id: "111",
            name: "type",
            taskType: "taskType",
            status: "Scheduled",
            createdAt: "2020-01-20T04:56:24.267Z",
            updatedAt: "2020-01-20T04:56:24.267Z",
            downloadPackageTaskAssets: [],
            installTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {},
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {},
            rebootTaskAssets: [],
            selfTestTask: {},
            selfTestTaskAssets: [],
          },
        ],
        expected: false,
      },
      {
        title: "return false when createdAt doesn't exist",
        input: [
          {
            id: "111",
            name: "type",
            taskType: "taskType",
            status: "Scheduled",
            createdBy: "foo",
            updatedAt: "2020-01-20T04:56:24.267Z",
            downloadPackageTaskAssets: [],
            installTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {},
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {},
            rebootTaskAssets: [],
            selfTestTask: {},
            selfTestTaskAssets: [],
          },
        ],
        expected: false,
      },
      {
        title: "return false when updatedAt doesn't exist",
        input: [
          {
            id: "111",
            name: "type",
            taskType: "taskType",
            status: "Scheduled",
            createdBy: "foo",
            createdAt: "2020-01-20T04:56:24.267Z",
            downloadPackageTaskAssets: [],
            installTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {},
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {},
            rebootTaskAssets: [],
            selfTestTask: {},
            selfTestTaskAssets: [],
          },
        ],
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetTasksResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe("isGetTaskResponse", () => {
    [
      {
        title: "return true when data is correct",
        input: {
          id: "id",
          name: "name",
          taskType: "taskType",
          status: "Scheduled",
          createdBy: "foo",
          createdAt: "2020-01-20T04:56:24.267Z",
          updatedAt: "2020-01-20T04:56:24.267Z",
          downloadPackageTaskAssets: [],
          installTaskAssets: [],
          deploymentTaskPackages: { name: "name" },
        },
        expected: true,
      },
      {
        title: "return false when data items is empty array",
        input: [],
        expected: false,
      },
      {
        title: "return false when data items is undefined",
        input: undefined,
        expected: false,
      },
      {
        title: "return false when data items is string",
        input: "",
        expected: false,
      },
      {
        title: "return false when id doesn't exist",
        input: {
          name: "type",
          taskType: "taskType",
          status: "Scheduled",
          createdBy: "foo",
          createdAt: "2020-01-20T04:56:24.267Z",
          updatedAt: "2020-01-20T04:56:24.267Z",
          downloadPackageTaskAssets: [],
          installTaskAssets: [],
          deploymentTaskPackages: { name: "name" },
        },
        expected: false,
      },
      {
        title: "return false when name doesn't exist",
        input: {
          id: "111",
          taskType: "taskType",
          status: "Scheduled",
          createdBy: "foo",
          createdAt: "2020-01-20T04:56:24.267Z",
          updatedAt: "2020-01-20T04:56:24.267Z",
          downloadPackageTaskAssets: [],
          installTaskAssets: [],
          deploymentTaskPackages: { name: "name" },
        },
        expected: false,
      },
      {
        title: "return false when status doesn't exist",
        input: {
          id: "111",
          name: "type",
          taskType: "taskType",
          createdBy: "foo",
          createdAt: "2020-01-20T04:56:24.267Z",
          updatedAt: "2020-01-20T04:56:24.267Z",
          downloadPackageTaskAssets: [],
          installTaskAssets: [],
          deploymentTaskPackages: { name: "name" },
        },
        expected: false,
      },
      {
        title: "return false when createdBy doesn't exist",
        input: {
          id: "111",
          name: "type",
          taskType: "taskType",
          status: "Scheduled",
          createdAt: "2020-01-20T04:56:24.267Z",
          updatedAt: "2020-01-20T04:56:24.267Z",
          downloadPackageTaskAssets: [],
          installTaskAssets: [],
          deploymentTaskPackages: { name: "name" },
        },
        expected: false,
      },
      {
        title: "return false when createdAt doesn't exist",
        input: {
          id: "111",
          name: "type",
          taskType: "taskType",
          status: "Scheduled",
          createdBy: "foo",
          updatedAt: "2020-01-20T04:56:24.267Z",
          downloadPackageTaskAssets: [],
          installTaskAssets: [],
          deploymentTaskPackages: { name: "name" },
        },
        expected: false,
      },
      {
        title: "return false when updatedAt doesn't exist",
        input: {
          id: "111",
          name: "type",
          taskType: "taskType",
          status: "Scheduled",
          createdBy: "foo",
          createdAt: "2020-01-20T04:56:24.267Z",
          downloadPackageTaskAssets: [],
          installTaskAssets: [],
          deploymentTaskPackages: { name: "name" },
        },
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetTaskResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
