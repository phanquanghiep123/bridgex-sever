import { Test, TestingModule } from "@nestjs/testing";
import { cases } from "rxjs-marbles/jest";
import JSZip from "jszip";
import { empty, throwError, of } from "rxjs";
import YAML from "yaml";
import path from "path";

jest.mock("fs", () => {
  return {
    promises: {
      readFile: jest.fn(() => empty().toPromise()),
    },
  };
});

import { promises as fs } from "fs";

// --------------------------------F

import { LoggerService } from "../logger";
import { PackageValidationService } from "./package-validation.service";
import { PackageValidationServiceGuard } from "./package-validation.service.guard";
import { PackageValidationError, EPackageValidationError, ValidatePackageParams } from "./package-validation.service.i";
import { ErrorCode, BridgeXServerError } from "../utils";
import { UnzipService } from "../unzip/unzip.service";
import { UnzipParams } from "../unzip/unzip.service.i";

// --------------------------------

class TestData {
  public static readonly MetadataFileName = "META.yaml";

  public static getPackageMetadataYamlString() {
    return `
      name: example-firmware v2.2.2
      files:
        - example-xxx.zip
      summary: example-12/24 Emergency patch for RBW-1000
      description: example-to fix some problem ...
      model: RBW-100
      elements:
        bridgeFirmware: PRS_03.0
        lowerUnit: P001M (0)
        upperUnit: B002G (0)
      createdBy: example-user
      `;
  }

  public static getPackageMetadataYaml() {
    return {
      name: "example-firmware v2.2.2",
      files: ["example-xxx.zip"],
      summary: "example-12/24 Emergency patch for RBW-1000",
      description: "example-to fix some problem ...",
      model: "RBW-100",
      elements: {
        bridgeFirmware: "PRS_03.0",
        lowerUnit: "P001M (0)",
        upperUnit: "B002G (0)",
      },
      createdBy: "example-user",
    };
  }

  public static getPackageMetadata() {
    return {
      name: "example-firmware v2.2.2",
      files: ["example-xxx.zip"],
      summary: "example-12/24 Emergency patch for RBW-1000",
      description: "example-to fix some problem ...",
      model: "RBW-100",
      elements: [
        { name: "bridgeFirmware", version: "PRS_03.0" },
        { name: "lowerUnit", version: "P001M (0)" },
        { name: "upperUnit", version: "B002G (0)" },
      ],
      createdBy: "example-user",
    };
  }

  public static getZipFile() {
    const zipFile = new JSZip();
    const meta = TestData.getPackageMetadata();
    zipFile.file(TestData.MetadataFileName, TestData.getPackageMetadataYamlString());
    meta.files.reduce((p, elm) => {
      p.file(elm, "this file name is " + elm);
      return p;
    }, zipFile);

    return zipFile;
  }
}

class UnzipServiceMock {
  public unzip = jest.fn();
}

// --------------------------------

describe(PackageValidationService.name, () => {
  let service: PackageValidationService;
  let unzipService: UnzipServiceMock;
  let guard: PackageValidationServiceGuard;

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackageValidationService,
        PackageValidationServiceGuard,
        LoggerService,
        { provide: UnzipService, useClass: UnzipServiceMock },
      ],
    }).compile();

    service = module.get(PackageValidationService);
    unzipService = module.get(UnzipService);
    guard = module.get(PackageValidationServiceGuard);
  });

  describe(PackageValidationService.prototype.validate$.name, () => {
    it("should call unzipService with input params", async () => {
      // arrange
      const input: ValidatePackageParams = {
        packageFilePath: "path",
        tmpDir: "tmp",
      };
      const expected: UnzipParams = {
        zipFilePath: input.packageFilePath,
        tmpDir: input.tmpDir,
      };
      jest.spyOn(unzipService, "unzip").mockReturnValue(
        new Promise((rs) => {
          rs("path");
        }),
      );
      jest.spyOn(service, "validateZipFile$").mockReturnValue(of());

      // act
      return (
        service
          .validate$(input)
          .toPromise()
          // assert
          .then(() => expect(unzipService.unzip).toHaveBeenCalledWith(expected))
          .catch(fail)
      );
    });

    it("should return error when unzipService failed", async () => {
      // arrange
      const input: ValidatePackageParams = {
        packageFilePath: "path",
        tmpDir: "tmp",
      };
      const expected = BridgeXServerError;
      jest.spyOn(unzipService, "unzip").mockReturnValue(
        new Promise((rs, rj) => {
          rj("");
        }),
      );

      // act
      return (
        service
          .validate$(input)
          .toPromise()
          // assert
          .then(fail)
          .catch((e) => expect(e).toBeInstanceOf(expected))
      );
    });

    it(`should be ${EPackageValidationError.UNKNOWN} error if unhandled error occurs`, async () => {
      // arrange
      const input: ValidatePackageParams = {
        packageFilePath: "path",
        tmpDir: "tmp",
      };
      const error = new Error("unknown error des");
      const expected = ErrorCode.categorize(new PackageValidationError(EPackageValidationError.UNKNOWN, { error }));

      jest.spyOn(unzipService, "unzip").mockReturnValue(
        new Promise((rs) => {
          rs("path");
        }),
      );
      jest.spyOn(service, "validateZipFile$").mockReturnValue(throwError(error));
      // act
      return (
        service
          .validate$(input)
          .toPromise()
          // assert
          .then(fail)
          .catch((err) => {
            expect(err).toEqual(expected);
          })
      );
    });
  });

  cases(
    PackageValidationService.prototype.toPackageMetadata.name,
    (_, { params, expected }) => {
      // arrange

      // act
      const actual = service.toPackageMetadata(params);

      // assert
      expect(actual).toEqual(expected);
    },
    {
      "should convert to expected data": { expected: TestData.getPackageMetadata(), params: TestData.getPackageMetadataYaml() },

      "should convert to expected data even if additional properties exist": {
        expected: TestData.getPackageMetadata(),
        params: { ...TestData.getPackageMetadataYaml(), foo: "bar" },
      },
    },
  );

  describe(PackageValidationService.prototype.validateZipFile$.name, () => {
    it("should read the specified file", async () => {
      // arrange
      const zipFilePath = "path";
      const expected = `${zipFilePath}/META.yaml`;
      jest.spyOn(fs, "readFile").mockRejectedValue(null);

      // act
      return (
        service
          .validateZipFile$(zipFilePath)
          .toPromise()
          // assert
          .then(fail)
          .catch((e: PackageValidationError) => {
            expect(fs.readFile).toHaveBeenCalledWith(expected);
            expect(e.code).toEqual(EPackageValidationError.METADATA_NOT_FOUND);
          })
      );
    });

    it(`should be "${EPackageValidationError.METADATA_FORMAT}" error if ${TestData.MetadataFileName} is not yaml format`, async () => {
      // arrange
      const zipFilePath = "path";
      const expected = new PackageValidationError(EPackageValidationError.METADATA_FORMAT, expect.anything());

      jest.spyOn(fs, "readFile").mockResolvedValue(Buffer.from([65]));
      jest.spyOn(YAML, "parse").mockImplementation(() => {
        throw new Error();
      });

      // act
      return (
        service
          .validateZipFile$(zipFilePath)
          .toPromise()
          // assert
          .then(fail)
          .catch((err) => expect(err).toEqual(expected))
      );
    });

    it(`should be "${EPackageValidationError.METADATA_FORMAT}" error if ${TestData.MetadataFileName} does not follow schema`, async () => {
      // arrange
      const expected = new PackageValidationError(EPackageValidationError.METADATA_FORMAT, expect.anything());

      const zipFilePath = "path";
      jest.spyOn(YAML, "parse").mockImplementation(() => "");
      jest.spyOn(guard, "isPackageMetadataYaml").mockReturnValue(false);

      // act
      return (
        service
          .validateZipFile$(zipFilePath)
          .toPromise()
          // assert
          .then(fail)
          .catch((err) => expect(err).toEqual(expected))
      );
    });

    it(`should be "${EPackageValidationError.CONTENT_MISMATCH}" error if zipFile contains unknown file`, async () => {
      // arrange
      const expected = TestData.getPackageMetadata();
      const zipFilePath = path.join(__dirname, "test-data");

      jest.spyOn(YAML, "parse").mockImplementation(() => "");
      jest.spyOn(guard, "isPackageMetadataYaml").mockReturnValue(true);
      jest.spyOn(service, "toPackageMetadata").mockReturnValue(TestData.getPackageMetadata());
      jest.spyOn(service, "getFileList").mockResolvedValue(["META.yaml", "example-xxx.zip"]);

      // act
      return (
        service
          .validateZipFile$(zipFilePath)
          .toPromise()
          // assert
          .then((data) => expect(data).toEqual(expected))
          .catch(fail)
      );
    });

    it(`should be "${EPackageValidationError.CONTENT_MISMATCH}" error if zipFile contains unknown file`, async () => {
      // arrange
      const expected = new PackageValidationError(EPackageValidationError.CONTENT_MISMATCH);
      const zipFilePath = path.join(__dirname, "test-data");

      jest.spyOn(YAML, "parse").mockImplementation(() => "");
      jest.spyOn(guard, "isPackageMetadataYaml").mockReturnValue(true);
      jest.spyOn(service, "toPackageMetadata").mockReturnValue(TestData.getPackageMetadata());
      jest.spyOn(service, "getFileList").mockResolvedValue(["META.yaml"]);

      // act
      return (
        service
          .validateZipFile$(zipFilePath)
          .toPromise()
          // assert
          .then(fail)
          .catch((err) => expect(err).toEqual(expected))
      );
    });
  });
});
