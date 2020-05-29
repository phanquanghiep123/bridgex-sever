import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";

import { of, throwError } from "rxjs";

import { BulkPackagesStatusController } from "./bulk-packages-status.controller";
import { GuardBulkPackagesStatus } from "./bulk-packages-status.controller.guard";
import { PackageStatus } from "./bulk-packages-status.controller.i";

import { PackagesService } from "../../service/packages/packages.service";
import { PackageStatus as PackageStatusData, EPackageStatus } from "../../service/packages";

import { LoggerService } from "../../service/logger";
import { ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

describe("BulkPackagesStatusController", () => {
  let controller: BulkPackagesStatusController;
  let packagesService: PackagesService;
  let guardBulkBulkPackagesStatus: GuardBulkPackagesStatus;
  let loggerService: LoggerService;
  let req: Request;
  let res: Response;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class PackagesServiceMock {
    public getClient$ = jest.fn();
    public controlTransaction$ = jest.fn();
    public getPackagesStatus$ = jest.fn();
    public getAssets$ = jest.fn();
    public convertToAssetStatus = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkPackagesStatusController],
      providers: [{ provide: PackagesService, useClass: PackagesServiceMock }, GuardBulkPackagesStatus, LoggerService],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get<BulkPackagesStatusController>(BulkPackagesStatusController);
    packagesService = module.get<PackagesService>(PackagesService);
    guardBulkBulkPackagesStatus = module.get(GuardBulkPackagesStatus);
    loggerService = module.get(LoggerService);

    req = {} as any;
    res = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    } as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(packagesService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(guardBulkBulkPackagesStatus).toBeDefined();
  });

  describe("getBulkPackagesStatus", () => {
    describe("case that req.body is invalid", () => {
      it("should return 400 when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkBulkPackagesStatus, "isGetBulkPackagesStatusBody").mockReturnValue(false);

        const expected = 400;

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected);
      });

      it("should return specified message when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkBulkPackagesStatus, "isGetBulkPackagesStatusBody").mockReturnValue(false);

        const expected = "Invalid Request Body";

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should call res.end() when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkBulkPackagesStatus, "isGetBulkPackagesStatusBody").mockReturnValue(false);

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });

    describe("case that req.body is valid", () => {
      beforeEach(() => {
        jest.spyOn(guardBulkBulkPackagesStatus, "isGetBulkPackagesStatusBody").mockReturnValue(true);
      });

      it("should call getPackagesStatus$ with req.body", () => {
        // arrange
        req.body = [];
        jest.spyOn(packagesService, "getPackagesStatus$").mockReturnValue(of([]));

        const expected = req.body;

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(packagesService.getPackagesStatus$).toHaveBeenCalledWith(expected);
      });

      it("should respond packages status when getPackagesStatus$ succeeded", () => {
        // arrange
        const reqStatus: PackageStatus[] = [{ packageId: "packageId1" }, { packageId: "packageId2" }];
        const expected: PackageStatusData[] = [
          {
            packageId: "packageId1",
            status: EPackageStatus.Uploading,
          },
          {
            packageId: "packageId2",
            status: EPackageStatus.Complete,
          },
        ];
        req.body = reqStatus;
        jest.spyOn(packagesService, "getPackagesStatus$").mockReturnValue(of(expected));

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should call res.end() when process finish normally", () => {
        // arrange
        req.body = [];
        jest.spyOn(packagesService, "getPackagesStatus$").mockReturnValue(of([]));

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });

      it("should call ErrorCode.categorize when lower layer emit error", () => {
        // arrange
        req.body = [];
        const error = Error("error");
        jest.spyOn(packagesService, "getPackagesStatus$").mockReturnValue(throwError(error));
        jest.spyOn(ErrorCode, "categorize");

        const expected = error;

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(ErrorCode.categorize).toHaveBeenCalledWith(expected);
      });

      it("should respond error when lower layer emit error", () => {
        // arrange
        req.body = [];
        const error = Error("error");
        jest.spyOn(packagesService, "getPackagesStatus$").mockReturnValue(throwError(error));

        const expected = ErrorCode.categorize(error);

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected.code);
        expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
      });

      it("should call res.end() when error occured", () => {
        // arrange
        req.body = [];
        jest.spyOn(packagesService, "getPackagesStatus$").mockReturnValue(throwError(""));

        // act
        controller.getBulkPackagesStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });
  });
});
