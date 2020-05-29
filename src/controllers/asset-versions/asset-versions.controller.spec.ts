import { HttpException } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { AssetVersionsService, AssetVersion } from "../../service/asset-versions";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError } from "../../service/utils";

import { AssetVersionsController } from "./asset-versions.controller";
import { GuardAssetVersions } from "./asset-versions.controller.guard";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

describe("GetAssetController", () => {
  let controller: AssetVersionsController;
  let assetVersionsService: AssetVersionsService;
  let guardGetAssetVersions: GuardAssetVersions;
  let loggerService: LoggerService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class AssetStatusServiceMock {
    public get$ = jest.fn();
  }

  class GuardAssetVersionsMock {
    public isGetAssetVersionsParams = jest.fn();
  }

  class LoggerServiceMock {
    public info = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetVersionsController],
      providers: [
        { provide: AssetVersionsService, useClass: AssetStatusServiceMock },
        { provide: GuardAssetVersions, useClass: GuardAssetVersionsMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(AssetVersionsController);
    assetVersionsService = module.get(AssetVersionsService);
    guardGetAssetVersions = module.get(GuardAssetVersions);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetVersionsService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(guardGetAssetVersions).toBeDefined();
  });

  describe("getAsset", () => {
    it("shoud throw NotFoundException when request params is invalid", (done) => {
      // arrange
      jest.spyOn(guardGetAssetVersions, "isGetAssetVersionsParams").mockReturnValue(false);
      const expected = new NotFoundException("Invalid Request Path Params");

      // act
      controller.getAssetVersions("tyty", "asas").subscribe(
        () => {
          fail();
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

    it("should return asset status", (done) => {
      // arrange
      jest.spyOn(guardGetAssetVersions, "isGetAssetVersionsParams").mockReturnValue(true);
      const expected: AssetVersion[] = [{ typeId: "", assetId: "", versions: [{ name: "", version: "" }] }];
      jest.spyOn(assetVersionsService, "get$").mockReturnValue(of(expected));

      // act
      controller.getAssetVersions("tyty", "asas").subscribe(
        (data) => {
          // assert
          expect(assetVersionsService.get$).toHaveBeenCalledWith({
            typeId: "tyty",
            assetId: "asas",
          });
          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should throw HttpException when the service returns error(456)", (done) => {
      // arrange
      jest.spyOn(guardGetAssetVersions, "isGetAssetVersionsParams").mockReturnValue(true);
      jest.spyOn(assetVersionsService, "get$").mockReturnValue(throwError(new BridgeXServerError(456, "456 error")));

      const expected = new HttpException(new BridgeXServerError(456, "456 error"), 456);

      // act
      controller.getAssetVersions("tyty", "asas").subscribe(
        () => {
          fail();
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
