import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { of } from "rxjs";

import { PackagesService, EPackageStatus, Package } from "../../service/packages";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

import { PackageUploadFailureController } from "./package-upload-failure.controller";
import { GuardPackageUploadFailure } from "./package-upload-failure.controller.guard";

describe(PackageUploadFailureController.name, () => {
  let controller: PackageUploadFailureController;
  let packagesService: PackagesService;
  let guardPackageUploadFailure: GuardPackageUploadFailure;
  let loggerService: LoggerService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class PackagesServiceMock {
    public getPackageWithoutElements$ = jest.fn();
    public updateStatus$ = jest.fn();
  }

  class GuardPackageUploadFailureMock {
    public isPutParams = jest.fn();
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
      controllers: [PackageUploadFailureController],
      providers: [
        { provide: PackagesService, useClass: PackagesServiceMock },
        { provide: GuardPackageUploadFailure, useClass: GuardPackageUploadFailureMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(PackageUploadFailureController);
    packagesService = module.get(PackagesService);
    guardPackageUploadFailure = module.get(GuardPackageUploadFailure);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(packagesService).toBeDefined();
    expect(guardPackageUploadFailure).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(PackageUploadFailureController.prototype.put.name, () => {
    it("should return 404 as error when request params are invalid", () => {
      // arrange
      const arg = "packageId";
      const expected = { code: 404 };

      jest.spyOn(guardPackageUploadFailure, "isPutParams").mockReturnValue(false);

      // act
      controller.put(arg).subscribe(
        () => fail("test failed"),
        (e: NotFoundException) => {
          expect(e.getStatus()).toEqual(expected.code);
        },
      );
    });

    it("should set Failure status when correct", () => {
      // arrange
      const arg = "packageId";
      const input = {
        getPackage: {
          status: EPackageStatus.Uploading,
          objectName: "nana",
        } as Package,
      };
      const expected = {
        isPutParams: { packageId: "packageId" },
        getPackageWithoutElements: "packageId",
        updateStatus: { packageId: "packageId", status: EPackageStatus.Failure },
        validatePackage: input.getPackage,
      };

      jest.spyOn(guardPackageUploadFailure, "isPutParams").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(input.getPackage));
      jest.spyOn(packagesService, "updateStatus$").mockReturnValue(of(null));

      // act
      return controller
        .put(arg)
        .toPromise()
        .then(() => {
          // assert
          expect(guardPackageUploadFailure.isPutParams).toHaveBeenCalledWith(expected.isPutParams);
          expect(packagesService.getPackageWithoutElements$).toHaveBeenCalledWith(expected.getPackageWithoutElements);
          expect(packagesService.updateStatus$).toHaveBeenCalledWith(expected.updateStatus);
        })
        .catch(fail);
    });

    it("should return 400 as error when already uploaded", () => {
      // arrange
      const arg = "packageId";
      const input = {
        getPackage: {
          status: EPackageStatus.Validating,
          objectName: "nana",
        } as Package,
      };
      const expected = {
        isPutParams: { packageId: "packageId" },
        getPackageWithoutElements: "packageId",
        code: 400,
      };

      jest.spyOn(guardPackageUploadFailure, "isPutParams").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(input.getPackage));

      // act
      return controller
        .put(arg)
        .toPromise()
        .then(fail)
        .catch((err) => {
          // assert
          expect(guardPackageUploadFailure.isPutParams).toHaveBeenCalledWith(expected.isPutParams);
          expect(packagesService.getPackageWithoutElements$).toHaveBeenCalledWith(expected.getPackageWithoutElements);
          expect(err.getStatus()).toEqual(expected.code);
        });
    });
  });
});
