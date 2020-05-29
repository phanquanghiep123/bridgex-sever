jest.mock("fs").mock("path");

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";
import { cases } from "rxjs-marbles/jest";

import { ZipService, fs, path } from "./zip.service";
import { LoggerService } from "../logger/logger.service";
import { ZipError, EZipError } from ".";
import JSZip from "jszip";
import { ErrorCode } from "../utils";
import { WriteStream } from "fs";
// import { BridgeXServerError, ErrorCode } from "../utils";

describe("ZipService", () => {
  let service: ZipService;
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
      providers: [ZipService, { provide: LoggerService, useClass: LoggerServiceMock }],
    }).compile();

    service = module.get(ZipService);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe("zip$", () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        jest.spyOn(service, "guardSrcFile$").mockReturnValue(of(null));
        jest.spyOn(service, "guardDstFile$").mockReturnValue(of("dst file path"));
        const jszipMock = {} as JSZip;
        jest.spyOn(service, "getJszip").mockReturnValue(jszipMock);
        (path.join as jest.Mock).mockReturnValue("dst file path");
        jest.spyOn(service, "pack$").mockReturnValue(of("test result"));
        const input = {
          files: ["file-01", "file-02", "file-03"],
          dstDir: "dsst dir",
          dstFileName: "dst file name",
        };
        // act
        const actual = service.zip$(input).toPromise();
        return c.assert(actual);
      },
      {
        "should call guardSrcFile": {
          assert: (p$: Promise<string>) => {
            return p$
              .then(() => {
                expect(service.guardSrcFile$).toHaveBeenCalledWith(["file-01", "file-02", "file-03"]);
              })
              .catch(fail);
          },
        },
        "should call guardDstFile": {
          assert: (p$: Promise<string>) => {
            return p$
              .then(() => {
                expect(service.guardDstFile$).toHaveBeenCalledWith("dsst dir", "dst file name");
              })
              .catch(fail);
          },
        },
        "should return result": {
          assert: (p$: Promise<string>) => {
            const expected = "test result";
            return p$.then((actual: any) => expect(actual).toEqual(expected)).catch(fail);
          },
        },
      },
    );

    it("should return SRC_FILE_NOT_SPECIFIED error, when input is empty", () => {
      // arrange
      jest.spyOn(service, "guardSrcFile$").mockReturnValue(of(null));
      jest.spyOn(service, "guardDstFile$").mockReturnValue(of("dst file path"));
      const jszipMock = {} as JSZip;
      jest.spyOn(service, "getJszip").mockReturnValue(jszipMock);
      (path.join as jest.Mock).mockReturnValue("dst file path");
      const error = new Error("test error");
      jest.spyOn(service, "pack$").mockReturnValue(throwError(error));
      const input = {
        files: ["file-01", "file-02", "file-03"],
        dstDir: "dsst dir",
        dstFileName: "dst file name",
      };
      // act
      const actual$ = service.zip$(input).toPromise();
      // assert
      const expected = ErrorCode.categorize(new Error("test error"));
      return actual$.then(fail).catch((e) => expect(e).toEqual(expected));
    });
  });

  describe("guardSrcFile$", () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        const input = ["file-01", "file-02", "file-03"];
        // act
        const actual = service.guardSrcFile$(input).toPromise();
        return c.assert(actual);
      },
      {
        "should call existsSync": {
          assert: (p$: Promise<null>) => {
            return p$.then(() => {
              expect(fs.existsSync).toHaveBeenCalledTimes(3);
              expect(fs.existsSync).toHaveBeenNthCalledWith(1, "file-01");
              expect(fs.existsSync).toHaveBeenNthCalledWith(2, "file-02");
              expect(fs.existsSync).toHaveBeenNthCalledWith(3, "file-03");
            });
          },
        },
        "should return null": {
          assert: (p$: Promise<null>) => {
            const expected = null;
            return p$.then((actual: any) => expect(actual).toEqual(expected)).catch(fail);
          },
        },
      },
    );

    it("should return SRC_FILE_NOT_SPECIFIED error, when input is empty", () => {
      // arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const input: string[] = [];
      // act
      const actual$ = service.guardSrcFile$(input).toPromise();
      // assert
      const expected = new ZipError(EZipError.SRC_FILE_NOT_SPECIFIED);
      return actual$.then(fail).catch((e) => expect(e).toEqual(expected));
    });

    it("should return SRC_FILE_NOT_FOUND error, when a file not found", () => {
      // arrange
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      const input = ["file-01", "file-02", "file-03"];
      // act
      const actual$ = service.guardSrcFile$(input).toPromise();
      // assert
      const expected = new ZipError(EZipError.SRC_FILE_NOT_FOUND);
      return actual$.then(fail).catch((e) => expect(e).toEqual(expected));
    });

    it("should return UNKNOWN error, when existsSync return exception", () => {
      // arrange
      const error = new Error("test error");
      (fs.existsSync as jest.Mock).mockImplementation(
        jest.fn(() => {
          throw error;
        }),
      );
      const input = ["file-01", "file-02", "file-03"];
      // act
      const actual$ = service.guardSrcFile$(input).toPromise();
      // assert
      const expected = new ZipError(EZipError.UNKNOWN);
      return actual$.then(fail).catch((e) => expect(e).toEqual(expected));
    });
  });

  describe("guardDstFile$", () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
        (path.join as jest.Mock).mockReturnValue("dst file path");
        (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
        const input = {
          dstDir: "dst dir",
          dstFileName: "dst file",
        };
        // act
        const actual = service.guardDstFile$(input.dstDir, input.dstFileName).toPromise();
        return c.assert(actual);
      },
      {
        "should call join": {
          assert: (p$: Promise<string>) => {
            return p$.then(() => {
              expect(path.join).toHaveBeenCalledWith("dst dir", "dst file");
            });
          },
        },
        "should call existsSync": {
          assert: (p$: Promise<string>) => {
            return p$.then(() => {
              expect(fs.existsSync).toHaveBeenCalledTimes(2);
              expect(fs.existsSync).toHaveBeenNthCalledWith(1, "dst dir");
              expect(fs.existsSync).toHaveBeenNthCalledWith(2, "dst file path");
            });
          },
        },
        "should return dst file path": {
          assert: (p$: Promise<string>) => {
            const expected = "dst file path";
            return p$.then((actual: any) => expect(actual).toEqual(expected)).catch(fail);
          },
        },
      },
    );

    it("should return DST_DIRECTORY_NOT_FOUND error, when dst directory is not found", () => {
      // arrange
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const input = {
        dstDir: "dst dir",
        dstFileName: "dst file",
      };
      // act
      const actual$ = service.guardDstFile$(input.dstDir, input.dstFileName).toPromise();
      // assert
      const expected = new ZipError(EZipError.DST_DIRECTORY_NOT_FOUND);
      return actual$.then(fail).catch((e) => expect(e).toEqual(expected));
    });

    it("should return DST_FILE_ALREADY_EXIST error, when dst file is already exist", () => {
      // arrange
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      (path.join as jest.Mock).mockReturnValue("dst file path");
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      const input = {
        dstDir: "dst dir",
        dstFileName: "dst file",
      };
      // act
      const actual$ = service.guardDstFile$(input.dstDir, input.dstFileName).toPromise();
      // assert
      const expected = new ZipError(EZipError.DST_FILE_ALREADY_EXIST);
      return actual$.then(fail).catch((e) => expect(e).toEqual(expected));
    });

    it("should return UNKNOWN error, when existsSync return exception", () => {
      // arrange
      const error = new Error("test error");
      (fs.existsSync as jest.Mock).mockImplementation(
        jest.fn(() => {
          throw error;
        }),
      );
      const input = {
        dstDir: "dst dir",
        dstFileName: "dst file",
      };
      // act
      const actual$ = service.guardDstFile$(input.dstDir, input.dstFileName).toPromise();
      // assert
      const expected = new ZipError(EZipError.UNKNOWN);
      return actual$.then(fail).catch((e) => expect(e).toEqual(expected));
    });
  });

  describe("getJszip", () => {
    const bufferMock: Buffer = Buffer.alloc(8);
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        (path.basename as jest.Mock).mockReturnValue("base name");
        (fs.readFileSync as jest.Mock).mockReturnValue(bufferMock);
        const input = ["src file 01", "src file 02"];
        // act
        const actual = service.getJszip(input);
        return c.assert(actual);
      },
      {
        "should call basename": {
          assert: () => {
            expect(path.basename).toHaveBeenCalledTimes(2);
            expect(path.basename).toHaveBeenNthCalledWith(1, "src file 01");
            expect(path.basename).toHaveBeenNthCalledWith(2, "src file 02");
          },
        },
        "should call readFileSync": {
          assert: () => {
            expect(fs.readFileSync).toHaveBeenCalledTimes(2);
            expect(fs.readFileSync).toHaveBeenNthCalledWith(1, "src file 01");
            expect(fs.readFileSync).toHaveBeenNthCalledWith(2, "src file 02");
          },
        },
        "should return response data": {
          assert: (actual: any) => {
            expect(actual).toBeInstanceOf(JSZip);
          },
        },
      },
    );

    it("should throw an exception, when fail create a JSZip object", () => {
      // arrange
      (path.basename as jest.Mock).mockReturnValue("base name");
      const error = new Error("test error");
      (fs.readFileSync as jest.Mock).mockImplementation(
        jest.fn(() => {
          throw error;
        }),
      );
      const input = ["src file 01", "src file 02"];
      // act
      try {
        service.getJszip(input);
        fail();
      } catch (e) {
        expect(e).toEqual(error);
      }
    });
  });

  describe("pack$", () => {
    let jszipMock: JSZip;
    let writeStreamMock: WriteStream;
    let pipedStreamMock: any;

    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        jszipMock = {} as JSZip;

        writeStreamMock = {} as WriteStream;
        writeStreamMock.destroyed = false;
        writeStreamMock.destroy = jest.fn();

        pipedStreamMock = {
          addListener: jest.fn((a: any, b: (arg?: any) => void) => {
            switch (a) {
              case "error":
                return;
              case "data":
                return;
              case "end":
                return;
              case "close":
                return;
              case "finish":
                b();
                return;
            }
          }),
          emit: jest.fn((a: any, b: () => void) => b()),
          on: jest.fn((a: any, b: () => void) => b()),
          once: jest.fn((a: any, b: () => void) => b()),
          prependListener: jest.fn((a: any, b: () => void) => b()),
          prependOnceListener: jest.fn((a: any, b: () => void) => b()),
          removeListener: jest.fn((a: any, b: () => void) => b()),
        };
        pipedStreamMock.destroyed = false;
        pipedStreamMock.destroy = jest.fn();

        const readableStreamMock = {} as NodeJS.ReadableStream;
        jszipMock.generateNodeStream = jest.fn(() => readableStreamMock);
        (fs.createWriteStream as jest.Mock).mockReturnValue(writeStreamMock);
        readableStreamMock.pipe = jest.fn(() => pipedStreamMock);

        const input = {
          zipFile: jszipMock,
          dstFileName: "dst file name",
        };
        // act
        const actual = service.pack$(input.zipFile, input.dstFileName).toPromise();
        return c.assert(actual);
      },
      {
        "should call writeStream.destroy": {
          assert: (p$: Promise<string>) => {
            return p$
              .then(() => {
                expect(writeStreamMock.destroy).toHaveBeenCalled();
              })
              .catch(fail);
          },
        },
        "should call pipedStream.destroy": {
          assert: (p$: Promise<string>) => {
            return p$
              .then(() => {
                expect(pipedStreamMock.destroy).toHaveBeenCalled();
              })
              .catch(fail);
          },
        },
        "should return dstFileName": {
          assert: (p$: Promise<string>) => {
            return p$.then((actual: any) => expect(actual).toEqual("dst file name")).catch(fail);
          },
        },
      },
    );

    it("should return error, when receive error close", () => {
      // arrange
      jszipMock = {} as JSZip;

      writeStreamMock = {} as WriteStream;
      writeStreamMock.destroyed = false;
      writeStreamMock.destroy = jest.fn();

      pipedStreamMock = {
        addListener: jest.fn((a: any, b: (arg?: any) => void) => {
          switch (a) {
            case "error":
              b();
              return;
            case "data":
              return;
            case "end":
              return;
            case "close":
              return;
            case "finish":
              return;
          }
        }),
        emit: jest.fn((a: any, b: () => void) => b()),
        on: jest.fn((a: any, b: () => void) => b()),
        once: jest.fn((a: any, b: () => void) => b()),
        prependListener: jest.fn((a: any, b: () => void) => b()),
        prependOnceListener: jest.fn((a: any, b: () => void) => b()),
        removeListener: jest.fn((a: any, b: () => void) => b()),
      };
      pipedStreamMock.destroyed = false;
      pipedStreamMock.destroy = jest.fn();

      const readableStreamMock = {} as NodeJS.ReadableStream;
      jszipMock.generateNodeStream = jest.fn(() => readableStreamMock);
      (fs.createWriteStream as jest.Mock).mockReturnValue(writeStreamMock);
      readableStreamMock.pipe = jest.fn(() => pipedStreamMock);

      const input = {
        zipFile: jszipMock,
        dstFileName: "dst file name",
      };
      // act
      const actual = service.pack$(input.zipFile, input.dstFileName).toPromise();
      const expected = new ZipError(EZipError.ZIP_FAILD, { dstFile: `dst file name` });
      return actual.then(fail).catch((e) => expect(e).toEqual(expected));
    });

    cases(
      "when writeStreams is destroyed",
      (_, c) => {
        // arrange
        jszipMock = {} as JSZip;

        writeStreamMock = {} as WriteStream;
        writeStreamMock.destroyed = true;
        writeStreamMock.destroy = jest.fn();

        pipedStreamMock = {
          addListener: jest.fn((a: any, b: (arg?: any) => void) => {
            switch (a) {
              case "error":
                return;
              case "data":
                return;
              case "end":
                return;
              case "close":
                return;
              case "finish":
                b();
                return;
            }
          }),
          emit: jest.fn((a: any, b: () => void) => b()),
          on: jest.fn((a: any, b: () => void) => b()),
          once: jest.fn((a: any, b: () => void) => b()),
          prependListener: jest.fn((a: any, b: () => void) => b()),
          prependOnceListener: jest.fn((a: any, b: () => void) => b()),
          removeListener: jest.fn((a: any, b: () => void) => b()),
        };
        pipedStreamMock.destroyed = true;
        pipedStreamMock.destroy = jest.fn();

        const readableStreamMock = {} as NodeJS.ReadableStream;
        jszipMock.generateNodeStream = jest.fn(() => readableStreamMock);
        (fs.createWriteStream as jest.Mock).mockReturnValue(writeStreamMock);
        readableStreamMock.pipe = jest.fn(() => pipedStreamMock);

        const input = {
          zipFile: jszipMock,
          dstFileName: "dst file name",
        };
        // act
        const actual = service.pack$(input.zipFile, input.dstFileName).toPromise();
        return c.assert(actual);
      },
      {
        "should not call writeStream.destroy": {
          assert: (p$: Promise<string>) => {
            return p$
              .then(() => {
                expect(writeStreamMock.destroy).not.toHaveBeenCalled();
              })
              .catch(fail);
          },
        },
        "should not call pipedStream.destroy": {
          assert: (p$: Promise<string>) => {
            return p$
              .then(() => {
                expect(pipedStreamMock.destroy).not.toHaveBeenCalled();
              })
              .catch(fail);
          },
        },
        "should return dstFileName": {
          assert: (p$: Promise<string>) => {
            return p$.then((actual: any) => expect(actual).toEqual("dst file name")).catch(fail);
          },
        },
      },
    );
  });
});
