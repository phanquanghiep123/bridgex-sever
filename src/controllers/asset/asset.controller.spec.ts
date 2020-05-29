import { HttpException } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { AssetController } from "./asset.controller";
import { GuardAsset } from "./asset.controller.guard";
import { Asset, EAssetStatus } from "./asset.controller.i";
import { AssetStatusService as AssetService, Asset as AssetData } from "../../service/asset-status";
import { ErrorInformationService } from "../../service/error-information";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

describe("GetAssetController", () => {
  let controller: AssetController;
  let assetService: AssetService;
  let errorInformationService: ErrorInformationService;
  let guardGetAsset: GuardAsset;
  let loggerService: LoggerService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class AssetServiceMock {
    public getAsset$ = jest.fn();
    public upsertNote$ = jest.fn();
  }

  class ErrorInformationServiceMock {
    public getErrorMessage = jest.fn();
  }

  class GuardGetAssetMock {
    public isGetAssetParams = jest.fn();
    public isPutAssetParams = jest.fn();
    public isPutAssetBody = jest.fn();
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
      controllers: [AssetController],
      providers: [
        { provide: AssetService, useClass: AssetServiceMock },
        { provide: ErrorInformationService, useClass: ErrorInformationServiceMock },
        { provide: GuardAsset, useClass: GuardGetAssetMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(AssetController);
    assetService = module.get(AssetService);
    errorInformationService = module.get(ErrorInformationService);
    guardGetAsset = module.get(GuardAsset);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetService).toBeDefined();
    expect(errorInformationService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(guardGetAsset).toBeDefined();
  });

  describe("getAsset", () => {
    it("shoud throw NotFoundException when request params is invalid", () => {
      // arrange
      jest.spyOn(guardGetAsset, "isGetAssetParams").mockReturnValue(false);
      const expected = new NotFoundException("Cannot GET /types/tyty/assets/asas");

      // act
      return controller
        .getAsset("tyty", "asas")
        .toPromise()
        .then(() => fail("Not expected here"))
        .catch((err) => {
          // assert
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.status).toEqual(expected.getStatus());
          expect(err.response).toEqual(expected.getResponse());
        });
    });

    it("should return asset information", () => {
      // arrange
      jest.spyOn(guardGetAsset, "isGetAssetParams").mockReturnValue(true);
      const assetData: AssetData = {
        typeId: "tyty",
        assetId: "asas",
        status: EAssetStatus.Good,
        ipAddress: "ipip",
        note: "nono",
        customerId: "",
        locationId: "foo",
        regionId: "foo",
        description: "foo",
        alias: "foo",
      };
      jest.spyOn(assetService, "getAsset$").mockReturnValue(of(assetData));

      const expected: Asset = {
        ...assetData,
        status: assetData.status as any,
      };

      // act
      return controller
        .getAsset("tyty", "asas")
        .toPromise()
        .then((data) => {
          // assert
          expect(assetService.getAsset$).toHaveBeenCalledWith({ typeId: "tyty", assetId: "asas" });
          expect(data).toEqual(expected);
        })
        .catch(fail);
    });

    it("should return asset status missing when stutus is null", () => {
      // arrange
      jest.spyOn(guardGetAsset, "isGetAssetParams").mockReturnValue(true);
      const assetData: AssetData = {
        typeId: "tyty",
        assetId: "asas",
        status: null as any,
        ipAddress: "ipip",
        note: "nono",
        customerId: "",
        locationId: "foo",
        regionId: "foo",
        description: "foo",
        alias: "foo",
      };
      jest.spyOn(assetService, "getAsset$").mockReturnValue(of(assetData));

      const expected: Asset = {
        ...assetData,
        status: EAssetStatus.Missing,
      };

      // act
      return controller
        .getAsset("tyty", "asas")
        .toPromise()
        .then((data) => {
          // assert
          expect(assetService.getAsset$).toHaveBeenCalledWith({
            typeId: "tyty",
            assetId: "asas",
          });
          expect(data).toEqual(expected);
        })
        .catch(fail);
    });

    it("should throw HttpException when the service returns error(456)", () => {
      // arrange
      jest.spyOn(guardGetAsset, "isGetAssetParams").mockReturnValue(true);
      const error = new BridgeXServerError(456, "456 error");
      jest.spyOn(assetService, "getAsset$").mockReturnValue(throwError(error));

      const expected = new HttpException(new BridgeXServerError(456, "456 error"), 456);

      // act
      return controller
        .getAsset("tyty", "asas")
        .toPromise()
        .then(() => fail("Not expected here"))
        .catch((err) => {
          // assert
          expect(err).toBeInstanceOf(HttpException);
          expect(err.status).toEqual(expected.getStatus());
          expect(err.response).toEqual(expected.getResponse());
        });
    });
  });
});
