import { TestingModule, Test } from "@nestjs/testing";

import { GuardAssetUpdatedStatus } from "./asset-status-updated.controller.guard";
import { EAssetStatus } from "./asset-status-updated.controller.i";

describe(GuardAssetUpdatedStatus.name, () => {
  let guard: GuardAssetUpdatedStatus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardAssetUpdatedStatus],
    }).compile();

    guard = module.get(GuardAssetUpdatedStatus);
  });

  describe(GuardAssetUpdatedStatus.prototype.isAssetStatusUpdatedEvent, () => {
    [
      // status
      { title: 'should return true when status is "Good"', input: { status: EAssetStatus.Good }, expected: true },
      { title: 'should return true when status is "Error"', input: { status: EAssetStatus.Error }, expected: true },
      { title: 'should return false when status is "Missing"', input: { status: EAssetStatus.Missing }, expected: false },
      { title: "should return false when status is not in enumeration", input: { status: "invalid" }, expected: false },
      { title: "should return false when status is not string", input: { status: 1 }, expected: false },
      { title: "should return false when status doesn't exist", input: {}, expected: false },

      // errorCode
      { title: "should return true when errorCode is string", input: { status: EAssetStatus.Good, errorCode: "" }, expected: true },
      { title: "should return true when errorCode doesn't exist", input: { status: EAssetStatus.Good }, expected: true },
      { title: "should return true when errorCode is not string", input: { status: EAssetStatus.Good, errorCode: 1 }, expected: false },

      // errorMsg
      { title: "should return true when errorMsg is string", input: { status: EAssetStatus.Good, errorMsg: "" }, expected: true },
      { title: "should return true when errorMsg doesn't exist", input: { status: EAssetStatus.Good }, expected: true },
      { title: "should return true when errorMsg is not string", input: { status: EAssetStatus.Good, errorMsg: 1 }, expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isAssetStatusUpdatedEvent(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
