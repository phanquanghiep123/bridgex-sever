import { TestingModule, Test } from "@nestjs/testing";

import { GuardAssetFilter } from "./asset-filter.controller.guard";

describe("GuardAssetFilter", () => {
  let guard: GuardAssetFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardAssetFilter],
    }).compile();

    guard = module.get(GuardAssetFilter);
  });

  describe("isGetLocationsParams", () => {
    [
      {
        title: "return true when data is correct",
        input: { customerId: "customerId" },
        expected: true,
      },
      {
        title: "return true when data is minimum length",
        input: { customerId: "c" },
        expected: true,
      },
      {
        title: "return false when data is undefined",
        input: undefined,
        expected: false,
      },
      { title: "return false when data is null", input: null, expected: false },
      { title: "return false when data is number", input: 1, expected: false },
      { title: "return false when data is string", input: "", expected: false },
      { title: "return false when data is array", input: [], expected: false },
      {
        title: "return false when data is boolean",
        input: true,
        expected: false,
      },
      {
        title: "return false when customerId is not",
        input: {},
        expected: false,
      },
      {
        title: "return false when customerId is empty",
        input: { customerId: "" },
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetLocationsParams(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
