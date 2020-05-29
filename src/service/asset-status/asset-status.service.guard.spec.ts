import { TestingModule, Test } from "@nestjs/testing";

import { GuardAssetStatusResponse } from "./asset-status.service.guard";

describe("GuardGetAsset", () => {
  let guard: GuardAssetStatusResponse;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardAssetStatusResponse],
    }).compile();

    guard = module.get(GuardAssetStatusResponse);
  });

  const assetRecord = {
    assetId: null,
    typeId: null,
    alias: null,
    locationId: null,
    customerId: null,
    regionId: null,
    ipAddress: null,
    description: null,
    note: null,
    status: "status",
    installationDate: null,
    totalCount: "1",
  };
  describe("isGetAssetResponse", () => {
    [
      {
        title: "return true when data is correct",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: null,
            locationId: null,
            customerId: null,
            regionId: null,
            ipAddress: null,
            description: null,
            note: null,
            status: null,
            installationDate: null,
          },
        ],
        expected: true,
      },
      {
        title: "return true when data is correct",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            status: null,
            installationDate: "2018-10-14T05:36:56.000Z",
          },
        ],
        expected: true,
      },
      {
        title: "return false when installationDate format is not date-time",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            status: null,
            installationDate: "aaaaaa",
          },
        ],
        expected: false,
      },
      {
        title: "return true when data asset is empty array",
        input: [],
        expected: true,
      },
      {
        title: "return false when asset data items is undefined",
        input: undefined,
        expected: false,
      },
      {
        title: "return false when asset data is not array",
        input: "",
        expected: false,
      },
      {
        title: "return false when typeId doesn't exist",
        input: [
          {
            assetId: "id",
            alias: "",
            locationId: "",
            customerId: "",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            installationDate: null,
            status: null,
          },
        ],
        expected: false,
      },
      {
        title: "return false when assetId doesn't exist",
        input: [
          {
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            installationDate: null,
            status: null,
          },
        ],
        expected: false,
      },
      {
        title: "return false when alias doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            locationId: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            installationDate: null,
            status: null,
          },
        ],
        expected: false,
      },
      {
        title: "return false when locationId doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            installationDate: null,
            status: null,
          },
        ],
        expected: false,
      },
      {
        title: "return false when customerId doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            installationDate: null,
            status: null,
          },
        ],
        expected: false,
      },
      {
        title: "return false when regionId doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            ipAddress: "",
            description: "",
            note: "",
            installationDate: null,
            status: null,
          },
        ],
        expected: false,
      },
      {
        title: "return false when IpAddress doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            regionId: "",
            description: "",
            note: "",
            installationDate: null,
            status: null,
          },
        ],
        expected: false,
      },
      {
        title: "return false when description doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            note: "",
            installationDate: null,
            status: "",
          },
        ],
        expected: false,
      },
      {
        title: "return false when note doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            description: "",
            installationDate: null,
            status: null,
          },
        ],
        expected: false,
      },
      {
        title: "return false when installationDate doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            status: "",
          },
        ],
        expected: false,
      },
      {
        title: "return false when status doesn't exist",
        input: [
          {
            assetId: "id",
            typeId: "type",
            alias: "",
            locationId: "",
            customerId: "customer",
            regionId: "",
            ipAddress: "",
            description: "",
            note: "",
            installationDate: null,
          },
        ],
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetAssetResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe("isGetAssetsResponse", () => {
    [
      {
        title: "return true when data is correct",
        input: [
          {
            ...assetRecord,
          },
        ],
        expected: true,
      },
      {
        title: "return false when totalCount format is not number",
        input: [
          {
            ...assetRecord,
            totalCount: "xxxx",
          },
        ],
        expected: false,
      },
      {
        title: "return false when totalCount format is not integer",
        input: [
          {
            ...assetRecord,
            totalCount: "1.1",
          },
        ],
        expected: false,
      },
      {
        title: "return true when installationDate format is date-time",
        input: [
          {
            ...assetRecord,
            installationDate: "2020-01-23T01:00:00.000Z",
          },
        ],
        expected: true,
      },
      {
        title: "return false when installationDate format is not date-time",
        input: [
          {
            ...assetRecord,
            installationDate: "aaaaaa",
          },
        ],
        expected: false,
      },
      {
        title: "return true when data assetRecord is empty array",
        input: [],
        expected: true,
      },
      {
        title: "return false when assetRecord data items is undefined",
        input: undefined,
        expected: false,
      },
      {
        title: "return false when assetRecord data is not array",
        input: "",
        expected: false,
      },
      {
        title: "return false when typeId doesn't exist",
        input: [
          {
            ...assetRecord,
            typeId: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when assetId doesn't exist",
        input: [
          {
            ...assetRecord,
            assetId: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when alias doesn't exist",
        input: [
          {
            ...assetRecord,
            alias: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when locationId doesn't exist",
        input: [
          {
            ...assetRecord,
            locationId: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when customerId doesn't exist",
        input: [
          {
            ...assetRecord,
            customerId: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when regionId doesn't exist",
        input: [
          {
            ...assetRecord,
            regionId: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when ipAddress doesn't exist",
        input: [
          {
            ...assetRecord,
            ipAddress: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when description doesn't exist",
        input: [
          {
            ...assetRecord,
            description: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when note doesn't exist",
        input: [
          {
            ...assetRecord,
            note: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when installationDate doesn't exist",
        input: [
          {
            ...assetRecord,
            installationDate: undefined,
          },
        ],
        expected: false,
      },
      {
        title: "return false when status doesn't exist",
        input: [
          {
            ...assetRecord,
            status: undefined,
          },
        ],
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetAssetsResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe("isGetAssetAvailabilityRecords", () => {
    describe("should return true", () => {
      [
        { title: "data is empty", input: [] },
        { title: "data is 1 item", input: [{ status: "Good", count: "0123456789" }] },
        {
          title: "data is 2 items",
          input: [
            { status: "Good", count: "0" },
            { status: "Error", count: "1" },
          ],
        },
        {
          title: "data is 3 items",
          input: [
            { status: "Error", count: "1" },
            { status: "Missing", count: "2" },
            { status: "Online", count: "3" },
          ],
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isGetAssetAvailabilityRecords(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is undefined", input: undefined },
        { title: "data is null", input: null },
        { title: "data is number", input: 1 },
        { title: "data is boolean", input: true },
        { title: "data is string", input: "" },
        { title: "data is object", input: {} },

        // status
        { title: "status is illegal value", input: [{ status: "hoge", count: "0" }] },
        { title: "status is nothing", input: [{ count: "0" }] },
        { title: "status is undefined", input: [{ status: undefined, count: "0" }] },
        { title: "status is null", input: [{ status: null, count: "0" }] },
        { title: "status is number", input: [{ status: 123, count: "0" }] },
        { title: "status is boolean", input: [{ status: true, count: "0" }] },
        { title: "status is object", input: [{ status: {}, count: "0" }] },
        { title: "status is array", input: [{ status: [], count: "0" }] },

        // count
        { title: "count is illegal value", input: [{ status: "Good", count: "abc" }] },
        { title: "count is nothing", input: [{ status: "Good" }] },
        { title: "count is undefined", input: [{ status: "Good", count: undefined }] },
        { title: "count is null", input: [{ status: "Good", count: null }] },
        { title: "count is number", input: [{ status: "Good", count: 123 }] },
        { title: "count is boolean", input: [{ status: "Good", count: true }] },
        { title: "count is object", input: [{ status: "Good", count: {} }] },
        { title: "count is array", input: [{ status: "Good", count: [] }] },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isGetAssetAvailabilityRecords(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
