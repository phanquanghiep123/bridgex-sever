import { TestingModule, Test } from "@nestjs/testing";

import { GuardBulkPackagesStatus } from "./bulk-packages-status.controller.guard";

describe("GuardBulkPackagesStatus", () => {
  let guard: GuardBulkPackagesStatus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardBulkPackagesStatus],
    }).compile();

    guard = module.get(GuardBulkPackagesStatus);
  });

  describe("isGetBulkPackagesStatusBody", () => {
    [
      { title: "return true when data is correct", input: [{ packageId: "packageId" }], expected: true },
      {
        title: "return true when two data are correct",
        input: [{ packageId: "packageId1" }, { packageId: "packageId2" }],
        expected: true,
      },
      { title: "return true when array is empty", input: [], expected: true },
      { title: "return false when data is number", input: 1, expected: false },
      { title: "return false when data is string", input: "", expected: false },
      { title: "return false when data is object", input: {}, expected: false },
      { title: "return false when data is boolean", input: true, expected: false },
      { title: "return false when packageId is not", input: [{}], expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetBulkPackagesStatusBody(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
