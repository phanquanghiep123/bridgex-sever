import { TestingModule, Test } from "@nestjs/testing";

import { GuardAssetVersionsResponse } from "./asset-versions.service.guard";

describe("GuardGetAsset", () => {
  let guard: GuardAssetVersionsResponse;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardAssetVersionsResponse],
    }).compile();

    guard = module.get(GuardAssetVersionsResponse);
  });

  describe("isGetAssetSoftwareVersionParams", () => {
    [
      {
        title: "return true when data is correct",
        input: [
          {
            assetId: "id",
            typeId: "type",
            subpartName: "",
            subpartVersion: "version",
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
        title: "return false when typeId doesn't exist",
        input: [{ assetId: "", subpartName: "", subpartVersion: "" }],
        expected: false,
      },
      {
        title: "return false when assetId doesn't exist",
        input: [{ typeId: "", subpartName: "", subpartVersion: "" }],
        expected: false,
      },
      {
        title: "return false when subpartName doesn't exist",
        input: [{ typeId: "", assetId: "", subpartVersion: "" }],
        expected: false,
      },
      {
        title: "return false when subpartVersion doesn't exist",
        input: [{ typeId: "", assetId: "", subpartName: "" }],
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetAssetVersionsResponse(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
