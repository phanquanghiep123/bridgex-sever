import { Test, TestingModule } from "@nestjs/testing";

import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import unzip from "unzip-stream";

// --------------------------------

import { UnzipService } from "../../../src/service/unzip/unzip.service";
import { UnzipParams, UnzipError, EUnzipError } from "../../../src/service/unzip/unzip.service.i";
import { LoggerService } from "../../../src/service/logger";

// --------------------------------

// setup for test

const testDir = path.join(__dirname, "test-data");
const packageId = "00000000-0000-0000-0000-000000000000";

/**
 * @params validZip: valid zip (contents are file)
 * @params invalidZip: invalid zip for this server (contents include directory)
 * @@params noZip: not zip file
 */
const testData = {
  validZip: path.join(testDir, "test.zip"),
  invalidZip: path.join(testDir, "invalid.zip"),
  noZip: path.join(testDir, "test.txt"),
};

describe(UnzipError.name, () => {
  describe(UnzipError.prototype.toString.name, () => {
    it("should return expected string", () => {
      // arrange
      const err = EUnzipError.FILE_NOT_FOUND;
      const params = { any: "param" };
      const unzipError = new UnzipError(err, params);
      const expected = `${UnzipError.name}: ${err}`;

      // act
      const actual = unzipError.toString();

      // assert
      expect(actual).toEqual(expected);
    });
  });
});

describe(UnzipService.name, () => {
  let service: UnzipService;
  let loggerService: LoggerService;

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UnzipService, { provide: LoggerService, useClass: LoggerServiceMock }],
    }).compile();

    service = module.get<UnzipService>(UnzipService);
    loggerService = module.get(LoggerService);
  });

  it("should create service", () => {
    expect(service).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(UnzipService.prototype.unzip.name, () => {
    afterEach((done) => rimraf(path.join(testDir, packageId), done));

    it("should create files inclueded by zip file in tmp directory", () => {
      // arrange
      const input: UnzipParams = {
        zipFilePath: testData.validZip,
        tmpDir: path.join(testDir, packageId),
      };

      // act
      return service
        .unzip(input)
        .then(() => {
          expect(loggerService.info).toHaveBeenCalledWith(`Start to unzip the specified file`);
          expect(loggerService.info).toHaveBeenCalledWith(`Succeeded to unzip the specified file`);
        })
        .catch(fail);
    });

    it("should return error if the specified file has directory as content", () => {
      // arrange
      const input: UnzipParams = {
        zipFilePath: path.join(testData.invalidZip),
        tmpDir: path.join(testDir, packageId),
      };

      // act
      return service
        .unzip(input)
        .then((e: any) => {
          expect(loggerService.info).toHaveBeenCalledWith(`Start to unzip the specified file`);
          expect(loggerService.info).toHaveBeenCalledWith(`Succeeded to unzip the specified file`);
        })
        .catch(fail);
    });

    it("should return error if the specified file doesn't exist", () => {
      // arrange
      const input: UnzipParams = {
        zipFilePath: path.join(__dirname, "test-data", "invalid-path"),
        tmpDir: path.join(testDir, packageId),
      };

      const expected = new UnzipError(EUnzipError.FILE_NOT_FOUND, expect.anything());

      // act
      return service
        .unzip(input)
        .then(fail)
        .catch((e: any) => {
          expect(e).toEqual(expected);
          expect(loggerService.info).toHaveBeenCalledWith(`The specified file path is wrong`);
          expect(loggerService.info).not.toHaveBeenCalledWith(`Succeeded to unzip the specified file`);
        });
    });

    it("should return error if the specified file is not zip file", () => {
      // arrange
      const input: UnzipParams = {
        zipFilePath: testData.noZip,
        tmpDir: path.join(testDir, packageId),
      };
      const expected = new UnzipError(EUnzipError.FILE_SAVE_FAILED);

      // act
      return service
        .unzip(input)
        .then(fail)
        .catch((e: any) => {
          expect(e).toEqual(expected);
          expect(loggerService.info).toHaveBeenCalledWith(`Failed to unzip the specified file`);
          expect(loggerService.info).not.toHaveBeenCalledWith(`Succeeded to unzip the specified file`);
        });
    });
  });
});
