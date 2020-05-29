import { TestingModule, Test } from "@nestjs/testing";

import { GuardBulkTasksStatus } from "./bulk-tasks-status.controller.guard";

describe("GuardBulkTasksStatus", () => {
  let guard: GuardBulkTasksStatus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardBulkTasksStatus],
    }).compile();

    guard = module.get(GuardBulkTasksStatus);
  });

  describe("isGetBulkTasksStatusBody", () => {
    [
      { title: "return true when data is correct", input: [{ taskId: "taskId" }], expected: true },
      {
        title: "return true when two data are correct",
        input: [{ taskId: "taskId1" }, { taskId: "taskId2" }],
        expected: true,
      },
      { title: "return true when array is empty", input: [], expected: true },
      { title: "return false when data is number", input: 1, expected: false },
      { title: "return false when data is string", input: "", expected: false },
      { title: "return false when data is object", input: {}, expected: false },
      { title: "return false when data is boolean", input: true, expected: false },
      { title: "return false when taskId is not", input: [{}], expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetBulkTasksStatusBody(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
