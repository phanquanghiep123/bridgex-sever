jest
  .mock("fs")
  .mock("path")
  .mock("yaml");

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";
import { cases } from "rxjs-marbles/jest";

import { ZipLogService, fs, yaml } from "./zip-log.service";
import { GuardZipLogService } from "./zip-log.service.guard";
import { ZipService, path } from "../zip/zip.service";
import { LoggerService } from "../logger/logger.service";
import { BridgeXServerError, ErrorCode } from "../utils";
import { ZipLogParams } from ".";

describe("ZipLogService", () => {
  let service: ZipLogService;
  let guard: GuardZipLogService;
  let zipService: ZipService;
  let loggerService: LoggerService;

  class GuardZipLogServiceMock {
    public isZipLogParams = jest.fn();
  }

  class ZipServiceMock {
    public zip$ = jest.fn();
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
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZipLogService,
        { provide: GuardZipLogService, useClass: GuardZipLogServiceMock },
        { provide: ZipService, useClass: ZipServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(ZipLogService);
    guard = module.get(GuardZipLogService);
    zipService = module.get(ZipService);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(guard).toBeDefined();
    expect(zipService).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe("zip$", () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        (path.join as jest.Mock).mockReturnValue("meta yaml file path");
        jest.spyOn(guard, "isZipLogParams").mockReturnValue(true);
        jest.spyOn(service, "writeMetaYaml").mockReturnValue("test dst file");
        jest.spyOn(zipService, "zip$").mockReturnValue(of("test result"));
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.unlinkSync as jest.Mock).mockImplementation(jest.fn());
        const input: ZipLogParams = {
          dstDir: "dst dir",
          dstFileName: "dst file name",
          asset: { typeId: "type id", assetId: "asset id" },
          retrieveLogInfo: [
            {
              typeId: "type id 01",
              assetId: "asset id 01",
              status: "status 01",
              filePath: "file path 01",
            },
            {
              typeId: "type id 02",
              assetId: "asset id 02",
              status: "status 02",
              filePath: "file path 02",
            },
          ],
        };
        // act
        const actual$ = service.zip$(input).toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should call isZipLogParams": {
          assert: (p$: Promise<string>) => {
            const expected = {
              dstDir: "dst dir",
              dstFileName: "dst file name",
              asset: { typeId: "type id", assetId: "asset id" },
              retrieveLogInfo: [
                {
                  typeId: "type id 01",
                  assetId: "asset id 01",
                  status: "status 01",
                  filePath: "file path 01",
                },
                {
                  typeId: "type id 02",
                  assetId: "asset id 02",
                  status: "status 02",
                  filePath: "file path 02",
                },
              ],
            };
            return p$.then(() => expect(guard.isZipLogParams).toHaveBeenCalledWith(expected)).catch(fail);
          },
        },
        "should call writeMetaYaml": {
          assert: (p$: Promise<string>) => {
            const expected = {
              params: {
                dstDir: "dst dir",
                dstFileName: "dst file name",
                asset: { typeId: "type id", assetId: "asset id" },
                retrieveLogInfo: [
                  {
                    typeId: "type id 01",
                    assetId: "asset id 01",
                    status: "status 01",
                    filePath: "file path 01",
                  },
                  {
                    typeId: "type id 02",
                    assetId: "asset id 02",
                    status: "status 02",
                    filePath: "file path 02",
                  },
                ],
              },
              metaFile: "meta yaml file path",
            };
            return p$.then(() => expect(service.writeMetaYaml).toHaveBeenCalledWith(expected.params, expected.metaFile)).catch(fail);
          },
        },
        "should call zip$": {
          assert: (p$: Promise<string>) => {
            const expected = {
              files: ["meta yaml file path", "file path 01", "file path 02"],
              dstDir: "dst dir",
              dstFileName: "dst file name",
            };
            return p$.then(() => expect(zipService.zip$).toHaveBeenCalledWith(expected)).catch(fail);
          },
        },
        "should call existsSync": {
          assert: (p$: Promise<string>) => {
            const expected = "meta yaml file path";
            return p$.then(() => expect(fs.existsSync).toHaveBeenCalledWith(expected)).catch(fail);
          },
        },
        "should call unlinkSync": {
          assert: (p$: Promise<string>) => {
            const expected = "meta yaml file path";
            return p$.then(() => expect(fs.unlinkSync).toHaveBeenCalledWith(expected)).catch(fail);
          },
        },
        "should return response data": {
          assert: (p$: Promise<string>) => {
            const expected = "test result";
            return p$.then((actual: any) => expect(actual).toEqual(expected)).catch(fail);
          },
        },
      },
    );

    it("should return BAD_REQUEST error, when params is illegal values", () => {
      // arrange
      (path.join as jest.Mock).mockReturnValue("meta yaml file path");
      jest.spyOn(guard, "isZipLogParams").mockReturnValue(false);
      const input = {
        dstDir: "dst dir",
        dstFileName: "dst file name",
        asset: { typeId: "type id", assetId: "asset id" },
        retrieveLogInfo: [
          {
            typeId: "type id 01",
            assetId: "asset id 01",
            status: "status 01",
            filePath: "file path 01",
          },
          {
            typeId: "type id 02",
            assetId: "asset id 02",
            status: "status 02",
            filePath: "file path 02",
          },
        ],
      };
      // act
      const actual$ = service.zip$(input).toPromise();
      // assert
      const expected = new BridgeXServerError(ErrorCode.BAD_REQUEST, "bad request");
      return actual$.then(fail).catch((e) => expect(e).toEqual(expected));
    });

    it("should return error, when writeMetaYaml return exception", () => {
      // arrange
      (path.join as jest.Mock).mockReturnValue("meta yaml file path");
      jest.spyOn(guard, "isZipLogParams").mockReturnValue(true);
      const error = new Error("test error");
      jest.spyOn(service, "writeMetaYaml").mockImplementation(() => {
        throw error;
      });
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.unlinkSync as jest.Mock).mockImplementation(jest.fn());
      const input = {
        dstDir: "dst dir",
        dstFileName: "dst file name",
        asset: { typeId: "type id", assetId: "asset id" },
        retrieveLogInfo: [
          {
            typeId: "type id 01",
            assetId: "asset id 01",
            status: "status 01",
            filePath: "file path 01",
          },
          {
            typeId: "type id 02",
            assetId: "asset id 02",
            status: "status 02",
            filePath: "file path 02",
          },
        ],
      };
      // act
      const actual$ = service.zip$(input).toPromise();
      // assert
      const expected = ErrorCode.categorize(error);
      return actual$.then(fail).catch((e) => {
        expect(e).toEqual(expected);
        expect(fs.existsSync).toHaveBeenCalledWith("meta yaml file path");
        expect(fs.unlinkSync).not.toHaveBeenCalled();
      });
    });

    it("should return error, when zip$ return error", () => {
      // arrange
      (path.join as jest.Mock).mockReturnValue("meta yaml file path");
      jest.spyOn(guard, "isZipLogParams").mockReturnValue(true);
      jest.spyOn(service, "writeMetaYaml").mockReturnValue("test dst file");
      const error = new BridgeXServerError(123, "test error");
      jest.spyOn(zipService, "zip$").mockReturnValue(throwError(error));
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(jest.fn());
      const input = {
        dstDir: "dst dir",
        dstFileName: "dst file name",
        asset: { typeId: "type id", assetId: "asset id" },
        retrieveLogInfo: [
          {
            typeId: "type id 01",
            assetId: "asset id 01",
            status: "status 01",
            filePath: "file path 01",
          },
          {
            typeId: "type id 02",
            assetId: "asset id 02",
            status: "status 02",
            filePath: "file path 02",
          },
        ],
      };
      // act
      const actual$ = service.zip$(input).toPromise();
      // assert
      const expected = ErrorCode.categorize(error);
      return actual$.then(fail).catch((e) => {
        expect(e).toEqual(expected);
        expect(fs.existsSync).toHaveBeenCalledWith("meta yaml file path");
        expect(fs.unlinkSync).toHaveBeenCalledWith("meta yaml file path");
      });
    });

    it("should call logger.error, when fail to delete the META.yaml file", () => {
      // arrange
      (path.join as jest.Mock).mockReturnValue("meta yaml file path");
      jest.spyOn(guard, "isZipLogParams").mockReturnValue(true);
      jest.spyOn(service, "writeMetaYaml").mockReturnValue("test dst file");
      const error = new BridgeXServerError(123, "test error");
      jest.spyOn(zipService, "zip$").mockReturnValue(throwError(error));
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(
        jest.fn(() => {
          throw new Error();
        }),
      );
      const input = {
        dstDir: "dst dir",
        dstFileName: "dst file name",
        asset: { typeId: "type id", assetId: "asset id" },
        retrieveLogInfo: [
          {
            typeId: "type id 01",
            assetId: "asset id 01",
            status: "status 01",
            filePath: "file path 01",
          },
          {
            typeId: "type id 02",
            assetId: "asset id 02",
            status: "status 02",
            filePath: "file path 02",
          },
        ],
      };
      // act
      const actual$ = service.zip$(input).toPromise();
      // assert
      const expected = ErrorCode.categorize(error);
      return actual$.then(fail).catch((e) => {
        expect(e).toEqual(expected);
        expect(fs.existsSync).toHaveBeenCalledWith("meta yaml file path");
        expect(fs.unlinkSync).toHaveBeenCalledWith("meta yaml file path");
        expect(loggerService.error).toHaveBeenCalled();
      });
    });
  });

  describe("writeMetaYaml", () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        Date.now = jest.fn(() => 0);
        (path.basename as jest.Mock).mockReturnValueOnce("file name 01");
        (path.basename as jest.Mock).mockReturnValueOnce("file name 02");
        (yaml.stringify as jest.Mock).mockReturnValue("yaml text");
        (fs.writeFileSync as jest.Mock).mockImplementation(jest.fn());
        const input = {
          params: {
            dstDir: "dst dir",
            dstFileName: "dst file name",
            asset: { typeId: "type id", assetId: "asset id" },
            retrieveLogInfo: [
              {
                typeId: "type id 01",
                assetId: "asset id 01",
                status: "status 01",
                filePath: "file path 01",
              },
              {
                typeId: "type id 02",
                assetId: "asset id 02",
                status: "status 02",
                filePath: "file path 02",
              },
            ],
          },
          dstFileNameFullPath: "dst file name full path",
        };
        // act
        const actual = service.writeMetaYaml(input.params, input.dstFileNameFullPath);
        return c.assert(actual);
      },
      {
        "should call stringify": {
          assert: () => {
            const expected = {
              date: "1970-01-01T00:00:00.000Z",
              asset: {
                typeId: "type id",
                assetId: "asset id",
              },
              files: [
                {
                  typeId: "type id 01",
                  assetId: "asset id 01",
                  status: "status 01",
                  fileName: "file name 01",
                },
                {
                  typeId: "type id 02",
                  assetId: "asset id 02",
                  status: "status 02",
                  fileName: "file name 02",
                },
              ],
            };
            expect(yaml.stringify).toBeCalledWith(expected);
          },
        },
        "should call getEventSourceFilter": {
          assert: () => {
            const expected = {
              dstFile: "dst file name full path",
              yamlText: "yaml text",
              encording: "utf8",
            };
            expect(fs.writeFileSync).toBeCalledWith(expected.dstFile, expected.yamlText, expected.encording);
          },
        },
        "should return response data": {
          assert: (actual: any) => {
            const expected = "dst file name full path";
            expect(actual).toEqual(expected);
          },
        },
      },
    );

    it("should return an exception, when fail to write a file", () => {
      // arrange
      (yaml.stringify as jest.Mock).mockReturnValue("yaml text");
      const error = new Error("test error");
      (fs.writeFileSync as jest.Mock).mockImplementation(
        jest.fn(() => {
          throw error;
        }),
      );
      const input = {
        params: {
          dstDir: "dst dir",
          dstFileName: "dst file name",
          asset: { typeId: "type id", assetId: "asset id" },
          retrieveLogInfo: [
            {
              typeId: "type id 01",
              assetId: "asset id 01",
              status: "status 01",
              filePath: "file path 01",
            },
            {
              typeId: "type id 02",
              assetId: "asset id 02",
              status: "status 02",
              filePath: "file path 02",
            },
          ],
        },
        dstFileNameFullPath: "dst file name full path",
      };
      // act
      try {
        service.writeMetaYaml(input.params, input.dstFileNameFullPath);
        fail();
      } catch (e) {
        expect(e).toEqual(error);
      }
    });
  });
});
