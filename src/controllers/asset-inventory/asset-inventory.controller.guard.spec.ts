import { TestingModule, Test } from "@nestjs/testing";
import { GuardAssetInventory } from "./asset-inventory.controller.guard";

describe("GuardAssetInventory", () => {
  let guard: GuardAssetInventory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardAssetInventory],
    }).compile();

    guard = module.get(GuardAssetInventory);
  });

  describe("isGetAssetInventoryParams", () => {
    [
      { title: "return true when data is correct", input: { typeId: "typeId", assetId: "000000" }, expected: true },
      { title: "return true when data is minimum length", input: { typeId: "t", assetId: "a" }, expected: true },
      { title: "return false when data is undefined", input: undefined, expected: false },
      { title: "return false when data is null", input: null, expected: false },
      { title: "return false when data is number", input: 1, expected: false },
      { title: "return false when data is string", input: "", expected: false },
      { title: "return false when data is array", input: [], expected: false },
      { title: "return false when data is boolean", input: true, expected: false },
      { title: "return false when typeId is not", input: { assetId: "000000" }, expected: false },
      { title: "return false when assetId is not", input: { typeIdId: "typeId" }, expected: false },
      { title: "return false when typeId and assetId are not", input: {}, expected: false },
      { title: "return false when typeId is empty", input: { typeId: "", assetId: "000000" }, expected: false },
      { title: "return false when assetId is empty", input: { typeIdId: "typeId", assetId: "" }, expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isGetAssetInventoryParams(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
