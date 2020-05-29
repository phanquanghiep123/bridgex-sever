import { TestingModule, Test } from "@nestjs/testing";

import { GuardAssetFilterResponse } from "./asset-filter.service.guard";

describe("GuardAssetFilterResponse", () => {
  let guard: GuardAssetFilterResponse;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardAssetFilterResponse],
    }).compile();

    guard = module.get(GuardAssetFilterResponse);
  });

  describe("isGetAssetTypeResponse", () => {
    [
      {
        title: "return true when data is correct",
        input: [
          {
            typeId: "type",
          },
        ],
        expected: true,
      },
      {
        title: "return true when data asset type is empty array",
        input: [],
        expected: true,
      },
      {
        title: "return false when asset type data items is undefined",
        input: undefined,
        expected: false,
      },
      {
        title: "return false when asset type data is not array",
        input: "",
        expected: false,
      },
      {
        title: "return false when typeId doesn't exist",
        input: [
          {
            exist: "exist",
          },
        ],
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetAssetTypeResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe("isGetRegionResponse", () => {
    [
      {
        title: "return true when data is correct",
        input: [
          {
            regionId: "region",
          },
        ],
        expected: true,
      },
      {
        title: "return true when data region is empty array",
        input: [],
        expected: true,
      },
      {
        title: "return false when region data items is undefined",
        input: undefined,
        expected: false,
      },
      {
        title: "return false when region data is not array",
        input: "",
        expected: false,
      },
      {
        title: "return false when regionId doesn't exist",
        input: [
          {
            exist: "exist",
          },
        ],
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetRegionResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe("isGetCustomerResponse", () => {
    [
      {
        title: "return true when data is correct",
        input: [
          {
            customerId: "customer",
          },
        ],
        expected: true,
      },
      {
        title: "return true when data customer is empty array",
        input: [],
        expected: true,
      },
      {
        title: "return false when customer data items is undefined",
        input: undefined,
        expected: false,
      },
      {
        title: "return false when customer data is not array",
        input: "",
        expected: false,
      },
      {
        title: "return false when customerId doesn't exist",
        input: [
          {
            exist: "exist",
          },
        ],
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetCustomerResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe("isGetLocationResponse", () => {
    [
      {
        title: "return true when data is correct",
        input: [
          {
            customerId: "customer",
            locationId: "location",
          },
        ],
        expected: true,
      },
      {
        title: "return true when data customer is empty array",
        input: [],
        expected: true,
      },
      {
        title: "return false when customer data items is undefined",
        input: undefined,
        expected: false,
      },
      {
        title: "return false when customer data is not array",
        input: "",
        expected: false,
      },
      {
        title: "return false when customerId doesn't exist",
        input: [
          {
            locationId: "location",
          },
        ],
        expected: false,
      },
      {
        title: "return false when locationId doesn't exist",
        input: [
          {
            customerId: "customer",
          },
        ],
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetLocationResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
