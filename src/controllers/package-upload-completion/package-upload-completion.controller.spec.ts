import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { of, throwError } from "rxjs";
import path from "path";

import { promises as fs } from "fs";

import { PackageUploadCompletionController } from "./package-upload-completion.controller";
import { GuardPackageUploadCompletion } from "./package-upload-completion.controller.guard";
import { PackagesService, Package, EPackageStatus } from "../../service/packages";
import { IbmCosService } from "../../service/ibm-cos";
import { PackageValidationService, PackageMetadata, PackageElement } from "../../service/package-validation";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { FtpClientService } from "../../service/ftp-client/ftp-client.service";
import { PersistentVolumeConfig } from "../../environment/persistent-volume";
import { ConfigService } from "../../service/config";
import rimraf from "rimraf";

describe("PackageUploadCompletionController", () => {
  let controller: PackageUploadCompletionController;
  let packagesService: PackagesService;
  let ibmCosService: IbmCosService;
  let ftpClientService: FtpClientService;
  let packageValidationService: PackageValidationService;
  let guardPackageUploadCompletion: GuardPackageUploadCompletion;
  let configService: ConfigService;
  let loggerService: LoggerService;

  const createTemDir = PackageUploadCompletionController.prototype.createTmpDir;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class PackagesServiceMock {
    public getPackageWithoutElements$ = jest.fn();
    public updateStatus$ = jest.fn();
    public updataMetadata$ = jest.fn();
  }

  const testDir = "/test-temp";
  const ftpPrefix = "packages";
  class ConfigServiceMock {
    public persistentVolumeConfig = jest.fn(
      () =>
        ({
          validatePackageTmpDir: testDir,
        } as PersistentVolumeConfig),
    );
    public ftpConfig = jest.fn(() => ({
      pathPrefix: ftpPrefix,
    }));
  }

  class IbmCosServiceMock {
    public getFile$ = jest.fn();
  }

  class PackageValidationServiceMock {
    public validate$ = jest.fn();
  }

  class GuardPackageUploadCompletionMock {
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

  class FtpClientServiceMock {
    public putFile$ = jest.fn();
  }

  beforeEach(async () => {
    jest.restoreAllMocks();
    PackageUploadCompletionController.prototype.createTmpDir = jest.fn(() => {});
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackageUploadCompletionController],
      providers: [
        { provide: PackagesService, useClass: PackagesServiceMock },
        { provide: IbmCosService, useClass: IbmCosServiceMock },
        { provide: PackageValidationService, useClass: PackageValidationServiceMock },
        { provide: FtpClientService, useClass: FtpClientServiceMock },
        { provide: GuardPackageUploadCompletion, useClass: GuardPackageUploadCompletionMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: FtpClientService, useClass: FtpClientServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(PackageUploadCompletionController);

    packagesService = module.get(PackagesService);
    ibmCosService = module.get(IbmCosService);
    packageValidationService = module.get(PackageValidationService);
    ftpClientService = module.get(FtpClientService);
    guardPackageUploadCompletion = module.get(GuardPackageUploadCompletion);
    configService = module.get(ConfigService);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(packagesService).toBeDefined();
    expect(ibmCosService).toBeDefined();
    expect(packageValidationService).toBeDefined();
    expect(ftpClientService).toBeDefined();
    expect(guardPackageUploadCompletion).toBeDefined();
    expect(configService).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe("constructor", () => {
    beforeEach(async () => {
      jest.restoreAllMocks();
      PackageUploadCompletionController.prototype.createTmpDir = createTemDir;
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PackageUploadCompletionController],
        providers: [
          { provide: PackagesService, useClass: PackagesServiceMock },
          { provide: IbmCosService, useClass: IbmCosServiceMock },
          { provide: PackageValidationService, useClass: PackageValidationServiceMock },
          { provide: FtpClientService, useClass: FtpClientServiceMock },
          { provide: GuardPackageUploadCompletion, useClass: GuardPackageUploadCompletionMock },
          { provide: LoggerService, useClass: LoggerServiceMock },
          { provide: ConfigService, useClass: ConfigServiceMock },
          { provide: FtpClientService, useClass: FtpClientServiceMock },
        ],
      })
        .overrideGuard(BearerTokenGuard)
        .useClass(BearerTokenGuardMock)
        .compile();

      controller = module.get(PackageUploadCompletionController);
      packagesService = module.get(PackagesService);
      ibmCosService = module.get(IbmCosService);
      packageValidationService = module.get(PackageValidationService);
      ftpClientService = module.get(FtpClientService);
      guardPackageUploadCompletion = module.get(GuardPackageUploadCompletion);
      configService = module.get(ConfigService);
      loggerService = module.get(LoggerService);
    });

    const targetDir = path.join(__dirname, "../../../", testDir);

    afterAll((done) => {
      rimraf(targetDir, done);
    });

    it("should create temp directory", () => {
      // arrange
      const expected = targetDir;

      // act

      // assert
      return fs
        .access(expected)
        .then((err) => {
          expect(err).toBeUndefined();
          expect(loggerService.info).toHaveBeenCalledWith(expect.any(String));
        })
        .catch(fail);
    });

    it("should do nothing when temp directory exists", () => {
      // arrange
      const expected = targetDir;

      // act
      // target controller has been created in beforeEach

      // assert
      return fs
        .access(expected)
        .then((err) => {
          expect(err).toBeUndefined();
          expect(loggerService.info).not.toHaveBeenCalledWith(expect.any(String));
        })
        .catch(fail);
    });
  });

  describe(PackageUploadCompletionController.prototype.put.name, () => {
    it("should return 404 as error when request params are invalid", () => {
      // arrange
      const arg = "packageId";
      const expected = {
        isPutParams: { packageId: "packageId" },
        code: 404,
      };

      jest.spyOn(guardPackageUploadCompletion, "isPutParams").mockReturnValue(false);

      // act
      return controller
        .put(arg)
        .toPromise()
        .then(fail)
        .catch((e: NotFoundException) => {
          // assert
          expect(guardPackageUploadCompletion.isPutParams).toHaveBeenCalledWith(expected.isPutParams);
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should set Validating status when correct", () => {
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
        updateStatus: { packageId: "packageId", status: EPackageStatus.Validating },
        validatePackage: input.getPackage,
      };

      jest.spyOn(guardPackageUploadCompletion, "isPutParams").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(input.getPackage));
      jest.spyOn(packagesService, "updateStatus$").mockReturnValue(of(null));
      jest.spyOn(controller, "validatePackage$").mockReturnValue(of(null));

      // act
      return controller
        .put(arg)
        .toPromise()
        .then(() => {
          // assert
          expect(guardPackageUploadCompletion.isPutParams).toHaveBeenCalledWith(expected.isPutParams);
          expect(packagesService.getPackageWithoutElements$).toHaveBeenCalledWith(expected.getPackageWithoutElements);
          expect(packagesService.updateStatus$).toHaveBeenCalledWith(expected.updateStatus);
          expect(controller.validatePackage$).toHaveBeenCalledWith(expected.validatePackage);
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

      jest.spyOn(guardPackageUploadCompletion, "isPutParams").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(input.getPackage));

      // act
      return controller
        .put(arg)
        .toPromise()
        .then(fail)
        .catch((err) => {
          // assert
          expect(guardPackageUploadCompletion.isPutParams).toHaveBeenCalledWith(expected.isPutParams);
          expect(packagesService.getPackageWithoutElements$).toHaveBeenCalledWith(expected.getPackageWithoutElements);
          expect(err.getStatus()).toEqual(expected.code);
        });
    });
  });

  describe(PackageUploadCompletionController.prototype.validatePackage$.name, () => {
    const tmpDir = path.join(__dirname, "../../../", testDir);

    beforeEach(() => {
      fs.mkdir = jest.fn();
    });

    it("should create directory /temp/:packageId", () => {
      // arrange
      const input = {
        id: "idid",
        objectName: "nana",
      } as Package;

      const originalError = new Error("");

      fs.mkdir = jest.fn().mockRejectedValue(originalError);

      const expected = {
        mkdir: `${tmpDir}/${input.id}`,
        error: new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", originalError),
      };

      // act
      return controller
        .validatePackage$(input)
        .toPromise()
        .then(fail)
        .catch((e) => {
          // assert
          expect(fs.mkdir).toHaveBeenCalledWith(expected.mkdir);
          expect(e).toEqual(expected.error);
        });
    });

    it("should get a package from storage and change package status to failure when failing", () => {
      // arrange
      const input = {
        id: "idid",
        objectName: "nana",
      } as Package;

      const testData = {
        originalError: new Error(""),
      };

      fs.mkdir = jest.fn().mockResolvedValue(null);
      jest.spyOn(ibmCosService, "getFile$").mockReturnValue(throwError(testData.originalError));
      jest.spyOn(packagesService, "updateStatus$").mockReturnValue(of(null));

      jest.spyOn(packageValidationService, "validate$").mockReturnValue(of());

      const expected = {
        getFile: {
          objectName: input.objectName,
          path: `${tmpDir}/${input.id}.zip`,
        },
        failureParams: {
          packageId: input.id,
          status: EPackageStatus.Failure,
        },
        error: new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", testData.originalError),
      };

      // act
      return controller
        .validatePackage$(input)
        .toPromise()
        .then(fail)
        .catch((e) => {
          // assert
          expect(ibmCosService.getFile$).toHaveBeenCalledWith(expected.getFile.objectName, expected.getFile.path);
          expect(packagesService.updateStatus$).toHaveBeenCalledWith(expected.failureParams);
          expect(e).toEqual(expected.error);
          expect(packageValidationService.validate$).not.toHaveBeenCalled();
        });
    });

    it("should validate a package and change package status to invalid when failing", () => {
      // arrange
      const input = {
        id: "idid",
        objectName: "nana",
      } as Package;

      const testData = {
        filePath: "filePath",
        originalError: new Error(""),
      };

      fs.mkdir = jest.fn().mockResolvedValue(null);
      jest.spyOn(ibmCosService, "getFile$").mockReturnValue(of(testData.filePath));

      jest.spyOn(packageValidationService, "validate$").mockReturnValue(throwError(testData.originalError));
      jest.spyOn(packagesService, "updateStatus$").mockReturnValue(of(null));

      jest.spyOn(ftpClientService, "putFile$").mockReturnValue(of());

      const expected = {
        validate: {
          packageFilePath: testData.filePath,
          tmpDir: `${tmpDir}/${input.id}`,
        },
        invalidParams: {
          packageId: input.id,
          status: EPackageStatus.Invalid,
        },
        error: new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", testData.originalError),
        log: "Succeeded to validate pacakge=idid",
      };

      // act
      return controller
        .validatePackage$(input)
        .toPromise()
        .then(fail)
        .catch((e) => {
          // assert
          expect(packageValidationService.validate$).toHaveBeenCalledWith(expected.validate);
          expect(packagesService.updateStatus$).toHaveBeenCalledWith(expected.invalidParams);
          expect(e).toEqual(expected.error);
          expect(ftpClientService.putFile$).not.toHaveBeenCalled();
        });
    });

    describe("sending a validated package to ftp server", () => {
      it("should change package status to complete when successing", () => {
        // arrange
        const input = {
          id: "idid",
          objectName: "nana",
        } as Package;

        const testData = {
          filePath: "filePath",
          metaData: {
            files: ["package.tar.gz"],
            summary: "susu",
            description: "dede",
            model: "momo",
            elements: [],
          } as PackageMetadata,
          originalError: new Error(""),
        };

        fs.mkdir = jest.fn().mockResolvedValue(null);
        jest.spyOn(ibmCosService, "getFile$").mockReturnValue(of(testData.filePath));
        jest.spyOn(packageValidationService, "validate$").mockReturnValue(of(testData.metaData));

        jest.spyOn(ftpClientService, "putFile$").mockReturnValue(of(null));
        jest.spyOn(packagesService, "updataMetadata$").mockReturnValue(throwError(testData.originalError));

        const expected = {
          putFile: {
            ftpFilePath: `${ftpPrefix}/${input.id}/${testData.metaData.files[0]}`,
            packageFilePath: `${tmpDir}/${input.id}/${testData.metaData.files[0]}`,
          },
          updateMetadata: {
            packageId: input.id,
            status: EPackageStatus.Complete,
            summary: testData.metaData.summary,
            description: testData.metaData.description,
            model: testData.metaData.model,
            ftpFilePath: `${ftpPrefix}/${input.id}/${testData.metaData.files[0]}`,
            elements: testData.metaData.elements.map((element: PackageElement) => ({ key: element.name, value: element.version })),
          },
          error: new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", testData.originalError),
        };

        // act
        return controller
          .validatePackage$(input)
          .toPromise()
          .then(fail)
          .catch((e) => {
            // assert
            expect(ftpClientService.putFile$).toHaveBeenCalledWith(expected.putFile.ftpFilePath, expected.putFile.packageFilePath);
            expect(e).toEqual(expected.error);
          });
      });

      it("should change package status to failure when failing", () => {
        // arrange
        const input = {
          id: "idid",
          objectName: "nana",
        } as Package;

        const testData = {
          filePath: "filePath",
          metaData: {
            files: ["package.tar.gz"],
            summary: "susu",
            description: "dede",
            model: "momo",
            elements: [],
          } as PackageMetadata,
          originalError: new Error(""),
        };

        fs.mkdir = jest.fn().mockResolvedValue(null);
        jest.spyOn(ibmCosService, "getFile$").mockReturnValue(of(testData.filePath));
        jest.spyOn(packageValidationService, "validate$").mockReturnValue(of(testData.metaData));

        jest.spyOn(ftpClientService, "putFile$").mockReturnValue(throwError(testData.originalError));
        jest.spyOn(packagesService, "updateStatus$").mockReturnValue(of(null));

        const expected = {
          putFile: {
            ftpFilePath: `${ftpPrefix}/${input.id}/${testData.metaData.files[0]}`,
            packageFilePath: `${tmpDir}/${input.id}/${testData.metaData.files[0]}`,
          },
          updateStatus: {
            packageId: input.id,
            status: EPackageStatus.Failure,
          },
          error: new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", testData.originalError),
        };

        // act
        return controller
          .validatePackage$(input)
          .toPromise()
          .then(fail)
          .catch((e) => {
            // assert
            expect(ftpClientService.putFile$).toHaveBeenCalledWith(expected.putFile.ftpFilePath, expected.putFile.packageFilePath);
            expect(packagesService.updateStatus$).toHaveBeenCalledWith(expected.updateStatus);
            expect(e).toEqual(expected.error);
          });
      });
    });
  });
});
