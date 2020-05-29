import { Test, TestingModule } from "@nestjs/testing";
import { AssetInventoryController } from "./asset-inventory.controller";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { GuardAssetInventory } from "./asset-inventory.controller.guard";
import { NotFoundException, HttpException } from "@nestjs/common";
import { LoggerService } from "../../service/logger/logger.service";
import { of, throwError } from "rxjs";
import { BridgeXServerError } from "../../service/utils";
import { AssetInventoryService, AssetInventoryResponse } from "../../service/asset-inventory";

describe("AssetInventoryController", () => {
  let controller: AssetInventoryController;
  let assetInventoryService: AssetInventoryService;
  let guardAssetInventory: GuardAssetInventory;
  let loggerService: LoggerService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class AssetInventoryServiceMock {
    public getAssetsInventory$ = jest.fn();
  }

  class GuardAssetInventoryMock {
    public isGetAssetInventoryParams = jest.fn();
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetInventoryController],
      providers: [
        { provide: AssetInventoryService, useClass: AssetInventoryServiceMock },
        { provide: GuardAssetInventory, useClass: GuardAssetInventoryMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get<AssetInventoryController>(AssetInventoryController);
    assetInventoryService = module.get(AssetInventoryService);
    guardAssetInventory = module.get(GuardAssetInventory);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetInventoryService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(GuardAssetInventory).toBeDefined();
  });

  describe("getAssetsInventory", () => {
    it("shoud throw NotFoundException when request params is invalid", (done) => {
      // arrange
      jest.spyOn(guardAssetInventory, "isGetAssetInventoryParams").mockReturnValue(false);
      const expected = new NotFoundException("Cannot GET /types/CI-10/assets//inventory");
      // act
      controller.getAssetsInventory("CI-10", "").subscribe(
        () => {
          fail();
          done();
        },
        (err) => {
          // assert
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.status).toEqual(expected.getStatus());
          expect(err.response).toEqual(expected.getResponse());
          done();
        },
      );
    });

    it("should return asset inventory with subAssets", (done) => {
      // arrange
      jest.spyOn(guardAssetInventory, "isGetAssetInventoryParams").mockReturnValue(true);
      const response: AssetInventoryResponse = {
        typeId: "type",
        assetId: "asset",
        subAssets: [
          {
            typeId: "subtype",
            assetId: "subasset",
            cashUnits: [
              {
                unit: "casset 1",
                status: "NEAR_FULL",
                capacity: 900,
                denominations: [
                  {
                    currencyCode: "EUR",
                    faceValue: "20",
                    count: 0,
                  },
                ],
              },
            ],
          },
          {
            typeId: "subtype02",
            assetId: "subasset02",
            cashUnits: [
              {
                unit: "casset A",
                status: "FULL",
                capacity: 600,
                denominations: [
                  {
                    currencyCode: "EUR",
                    faceValue: "20",
                    count: 0,
                  },
                ],
              },
            ],
          },
        ],
      };
      jest.spyOn(assetInventoryService, "getAssetsInventory$").mockReturnValue(of(response));
      const expected: AssetInventoryResponse = {
        typeId: "type",
        assetId: "asset",
        subAssets: [
          {
            typeId: "subtype",
            assetId: "subasset",
            cashUnits: [
              {
                unit: "casset 1",
                status: "NEAR_FULL",
                capacity: 900,
                denominations: [
                  {
                    currencyCode: "EUR",
                    faceValue: "20",
                    count: 0,
                  },
                ],
              },
            ],
          },
          {
            typeId: "subtype02",
            assetId: "subasset02",
            cashUnits: [
              {
                unit: "casset A",
                status: "FULL",
                capacity: 600,
                denominations: [
                  {
                    currencyCode: "EUR",
                    faceValue: "20",
                    count: 0,
                  },
                ],
              },
            ],
          },
        ],
      };
      // act
      controller.getAssetsInventory("type", "asset").subscribe(
        (data) => {
          // assert
          expect(assetInventoryService.getAssetsInventory$).toHaveBeenCalledWith({ typeId: "type", assetId: "asset" });

          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
          done();
        },
      );
    });

    it("should return asset inventory with subAssets [] when undefined", (done) => {
      // arrange
      jest.spyOn(guardAssetInventory, "isGetAssetInventoryParams").mockReturnValue(true);
      const response: AssetInventoryResponse = {
        typeId: "type",
        assetId: "asset",
        subAssets: undefined,
      };
      jest.spyOn(assetInventoryService, "getAssetsInventory$").mockReturnValue(of(response));
      const expected: AssetInventoryResponse = {
        typeId: "type",
        assetId: "asset",
        subAssets: [],
      };
      // act
      controller.getAssetsInventory("type", "asset").subscribe(
        (data) => {
          // assert
          expect(assetInventoryService.getAssetsInventory$).toHaveBeenCalledWith({ typeId: "type", assetId: "asset" });

          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
          done();
        },
      );
    });

    it("should return subAssets with cashUnits [] when undefined", (done) => {
      // arrange
      jest.spyOn(guardAssetInventory, "isGetAssetInventoryParams").mockReturnValue(true);
      const response: AssetInventoryResponse = {
        typeId: "type",
        assetId: "asset",
        subAssets: [
          {
            typeId: "subtype",
            assetId: "subasset",
            cashUnits: undefined,
          },
        ],
      };
      jest.spyOn(assetInventoryService, "getAssetsInventory$").mockReturnValue(of(response));
      const expected: AssetInventoryResponse = {
        typeId: "type",
        assetId: "asset",
        subAssets: [
          {
            typeId: "subtype",
            assetId: "subasset",
            cashUnits: [],
          },
        ],
      };
      // act
      controller.getAssetsInventory("type", "asset").subscribe(
        (data) => {
          // assert
          expect(assetInventoryService.getAssetsInventory$).toHaveBeenCalledWith({ typeId: "type", assetId: "asset" });

          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
          done();
        },
      );
    });

    it("should return cashUnits with denominations [] when undefined", (done) => {
      // arrange
      jest.spyOn(guardAssetInventory, "isGetAssetInventoryParams").mockReturnValue(true);
      const response: AssetInventoryResponse = {
        typeId: "type",
        assetId: "asset",
        subAssets: [
          {
            typeId: "subtype",
            assetId: "subasset",
            cashUnits: [
              {
                unit: "casset 1",
                status: "NEAR_FULL",
                capacity: 900,
                denominations: undefined,
              },
            ],
          },
        ],
      };
      jest.spyOn(assetInventoryService, "getAssetsInventory$").mockReturnValue(of(response));
      const expected: AssetInventoryResponse = {
        typeId: "type",
        assetId: "asset",
        subAssets: [
          {
            typeId: "subtype",
            assetId: "subasset",
            cashUnits: [
              {
                unit: "casset 1",
                status: "NEAR_FULL",
                capacity: 900,
                denominations: [],
              },
            ],
          },
        ],
      };
      // act
      controller.getAssetsInventory("type", "asset").subscribe(
        (data) => {
          // assert
          expect(assetInventoryService.getAssetsInventory$).toHaveBeenCalledWith({ typeId: "type", assetId: "asset" });

          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
          done();
        },
      );
    });

    it("should throw HttpException when the service returns error", (done) => {
      // arrange
      jest.spyOn(guardAssetInventory, "isGetAssetInventoryParams").mockReturnValue(true);
      const error = new BridgeXServerError(500, "500 error");
      jest.spyOn(assetInventoryService, "getAssetsInventory$").mockReturnValue(throwError(error));

      const expected = new HttpException(new BridgeXServerError(500, "500 error"), 500);

      // act
      controller.getAssetsInventory("type", "asset").subscribe(
        () => {
          fail();
          done();
        },
        (err) => {
          // assert
          expect(err).toBeInstanceOf(HttpException);
          expect(err.status).toEqual(expected.getStatus());
          expect(err.response).toEqual(expected.getResponse());
          done();
        },
      );
    });
  });
});
