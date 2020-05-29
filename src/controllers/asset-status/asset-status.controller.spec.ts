import { HttpException, BadRequestException } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { AssetStatusController } from "./asset-status.controller";
import { GuardAssetStatus } from "./asset-status.controller.guard";
import { AssetStatus, EAssetStatus } from "./asset-status.controller.i";
import {
  AssetStatusService,
  UpsertNoteParams,
  AssetStatus as AssetStatusData,
  EAssetStatus as EAssetStatusOfService,
} from "../../service/asset-status";
import { ErrorInformationService } from "../../service/error-information";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

describe("GetAssetController", () => {
  let controller: AssetStatusController;
  let assetStatusService: AssetStatusService;
  let errorInformationService: ErrorInformationService;
  let guardGetAsset: GuardAssetStatus;
  let loggerService: LoggerService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class AssetStatusServiceMock {
    public get$ = jest.fn();
    public upsertNote$ = jest.fn();
  }

  class ErrorInformationServiceMock {
    public getErrorMessage = jest.fn();
  }

  class GuardGetAssetMock {
    public isGetAssetStatusParams = jest.fn();
    public isPutAssetStatusParams = jest.fn();
    public isPutAssetStatusBody = jest.fn();
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
      controllers: [AssetStatusController],
      providers: [
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: ErrorInformationService, useClass: ErrorInformationServiceMock },
        { provide: GuardAssetStatus, useClass: GuardGetAssetMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(AssetStatusController);
    assetStatusService = module.get(AssetStatusService);
    errorInformationService = module.get(ErrorInformationService);
    guardGetAsset = module.get(GuardAssetStatus);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetStatusService).toBeDefined();
    expect(errorInformationService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(guardGetAsset).toBeDefined();
  });

  describe("getAsset", () => {
    it("shoud throw NotFoundException when request params is invalid", (done) => {
      // arrange
      jest.spyOn(guardGetAsset, "isGetAssetStatusParams").mockReturnValue(false);
      const expected = new NotFoundException("Cannot GET /types/tyty/assets/asas/status");

      // act
      controller.getAsset("tyty", "asas").subscribe(
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

    it("should return asset status with error message about asset", (done) => {
      // arrange
      jest.spyOn(guardGetAsset, "isGetAssetStatusParams").mockReturnValue(true);
      const assetStatusData: AssetStatusData = {
        typeId: "tyty",
        assetId: "asas",
        status: EAssetStatusOfService.Good,
        errorCode: "erer",
      };
      jest.spyOn(assetStatusService, "get$").mockReturnValue(of(assetStatusData));
      jest.spyOn(errorInformationService, "getErrorMessage").mockReturnValueOnce("error message");

      const expected: AssetStatus = {
        typeId: "tyty",
        assetId: "asas",
        status: EAssetStatus.Good,
        errorCode: "erer",
        errorMessage: "error message",
      };

      // act
      controller.getAsset("tyty", "asas").subscribe(
        (data) => {
          // assert
          expect(assetStatusService.get$).toHaveBeenCalledWith({ typeId: "tyty", assetId: "asas" });
          expect(errorInformationService.getErrorMessage).toHaveBeenNthCalledWith(1, "tyty", "erer");
          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return asset status with error message about multiple asset", (done) => {
      // arrange
      jest.spyOn(guardGetAsset, "isGetAssetStatusParams").mockReturnValue(true);
      const assetStatusData: AssetStatusData = {
        typeId: "tyty",
        assetId: "asas",
        status: EAssetStatusOfService.Good,
        subAssets: [
          { typeId: "ty01", assetId: "as01", status: EAssetStatusOfService.Good },
          { typeId: "ty02", assetId: "as02", status: EAssetStatusOfService.Error, errorCode: "er02" },
          { typeId: "ty03", assetId: "as03", status: EAssetStatusOfService.Missing, errorCode: "er03" },
          { typeId: "ty04", assetId: "as04", status: EAssetStatusOfService.Online },
        ],
      };
      jest.spyOn(assetStatusService, "get$").mockReturnValue(of(assetStatusData));
      jest.spyOn(errorInformationService, "getErrorMessage").mockReturnValueOnce("error message 02");
      jest.spyOn(errorInformationService, "getErrorMessage").mockReturnValueOnce("error message 03");

      const expected: AssetStatus = {
        typeId: "tyty",
        assetId: "asas",
        status: EAssetStatus.Good,
        subAssets: [
          { typeId: "ty01", assetId: "as01", status: EAssetStatus.Good },
          { typeId: "ty02", assetId: "as02", status: EAssetStatus.Error, errorCode: "er02", errorMessage: "error message 02" },
          { typeId: "ty03", assetId: "as03", status: EAssetStatus.Missing, errorCode: "er03", errorMessage: "error message 03" },
          { typeId: "ty04", assetId: "as04", status: EAssetStatus.Missing },
        ],
      };

      // act
      controller.getAsset("tyty", "asas").subscribe(
        (data) => {
          // assert
          expect(assetStatusService.get$).toHaveBeenCalledWith({ typeId: "tyty", assetId: "asas" });
          expect(errorInformationService.getErrorMessage).toHaveBeenCalledTimes(2);
          expect(errorInformationService.getErrorMessage).toHaveBeenCalledWith("ty02", "er02");
          expect(errorInformationService.getErrorMessage).toHaveBeenCalledWith("ty03", "er03");
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
      jest.spyOn(guardGetAsset, "isGetAssetStatusParams").mockReturnValue(true);
      const error = new BridgeXServerError(456, "456 error");
      jest.spyOn(assetStatusService, "get$").mockReturnValue(throwError(error));

      const expected = new HttpException(new BridgeXServerError(456, "456 error"), 456);

      // act
      controller.getAsset("tyty", "asas").subscribe(
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

  describe("putAsset", () => {
    it("shoud throw NotFoundException when request params is invalid", (done) => {
      // arrange
      jest.spyOn(guardGetAsset, "isPutAssetStatusParams").mockReturnValue(false);
      const expected = new NotFoundException("Cannot PUT /types/tyty/assets/asas");

      // act
      controller.putAsset("tyty", "asas", { note: "nono" }).subscribe(
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

    it("shoud throw BadRequestException when request params is invalid", (done) => {
      // arrange
      jest.spyOn(guardGetAsset, "isPutAssetStatusParams").mockReturnValue(true);
      jest.spyOn(guardGetAsset, "isPutAssetStatusBody").mockReturnValue(false);
      const expected = new BadRequestException("Cannot PUT /types/tyty/assets/asas");

      // act
      controller.putAsset("tyty", "asas", { note: "nono" }).subscribe(
        () => {
          fail();
        },
        (err) => {
          // assert
          expect(err).toBeInstanceOf(BadRequestException);
          expect(err.status).toEqual(expected.getStatus());
          expect(err.response).toEqual(expected.getResponse());
          done();
        },
      );
    });

    it("should call assetStatusService.upsertNote$ with asset status", (done) => {
      // arrange
      jest.spyOn(guardGetAsset, "isPutAssetStatusParams").mockReturnValue(true);
      jest.spyOn(guardGetAsset, "isPutAssetStatusBody").mockReturnValue(true);
      const expected: UpsertNoteParams = { typeId: "tyty", assetId: "asas", note: "nono" };
      jest.spyOn(assetStatusService, "upsertNote$").mockReturnValue(of(null));

      // act
      controller.putAsset("tyty", "asas", { note: "nono" }).subscribe(
        () => {
          // assert
          expect(assetStatusService.upsertNote$).toHaveBeenCalledWith(expected);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should throw HttpException when the service returns error(456)", (done) => {
      // arrange
      jest.spyOn(guardGetAsset, "isPutAssetStatusParams").mockReturnValue(true);
      jest.spyOn(guardGetAsset, "isPutAssetStatusBody").mockReturnValue(true);
      const error = new BridgeXServerError(456, "456 error");
      jest.spyOn(assetStatusService, "upsertNote$").mockReturnValue(throwError(error));

      const expected = new HttpException({ statusCode: 456, message: "456 error", originalError: error }, 456);

      // act
      controller.putAsset("tyty", "asas", { note: "nono" }).subscribe(
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
