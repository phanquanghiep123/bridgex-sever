// tslint:disable: variable-name
import { TestingModule, Test } from "@nestjs/testing";
import { Readable, Writable } from "stream";

import { UnzipService, externals } from "./unzip.service";
import { LoggerService } from "../logger/logger.service";

import { never, of, throwError } from "rxjs";
import { UnzipError, EUnzipError } from "./unzip.service.i";

// ------------------------------------------------

describe(UnzipService.name, () => {
  let service: UnzipService;
  let zipStream: Readable;
  let unzipStream: Writable;

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class ZipStreamMock extends Readable {
    public _read = jest.fn();
    public _destroy = jest.fn(() => this.emit("close"));
  }

  class UnzzipStreamMock extends Writable {}

  beforeEach(async () => {
    jest.restoreAllMocks();

    zipStream = new ZipStreamMock();
    unzipStream = new UnzzipStreamMock();
    jest.spyOn(externals, "createReadStream").mockReturnValue(zipStream as any);
    jest.spyOn(externals, "unzipExtract").mockReturnValue(unzipStream as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [UnzipService, { provide: LoggerService, useClass: LoggerServiceMock }],
    }).compile();

    service = module.get<UnzipService>(UnzipService);
  });

  afterEach(() => {
    zipStream.destroy();
    unzipStream.destroy();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(UnzipService.prototype.unzip.name, () => {
    it("should be error when zipStream emits error", () => {
      // arrange
      const params = {
        zipFilePath: "/zip/file/path",
        tmpDir: "/tmp/dir",
      };
      const err = new Error("error des");
      const expected = new UnzipError(EUnzipError.FILE_NOT_FOUND, { error: err });
      jest.spyOn(service, "createUnzipStream$").mockReturnValue(never());

      // act
      const actual$ = service
        .unzip(params)
        // assert
        .then(fail)
        .catch((actual) => expect(actual).toEqual(expected))
        .then(() => expect(zipStream.destroyed).toBe(true));

      zipStream.emit("error", err);
      return actual$;
    });

    it("should return tmpDir when operation succeeds", () => {
      // arrange
      const params = {
        zipFilePath: "/zip/file/path",
        tmpDir: "/tmp/dir",
      };
      const expected = params.tmpDir;
      jest.spyOn(service, "createUnzipStream$").mockReturnValue(of(null));

      // act
      return (
        service
          .unzip(params)
          // assert
          .then((actual) => expect(actual).toBe(expected))
          .catch(fail)
      );
    });

    it("should destroy zipStream when operation succeeds", () => {
      // arrange
      const params = {
        zipFilePath: "/zip/file/path",
        tmpDir: "/tmp/dir",
      };
      jest.spyOn(service, "createUnzipStream$").mockReturnValue(of(null));

      // act
      return (
        service
          .unzip(params)
          // assert
          .then(() => expect(zipStream.destroyed).toBe(true))
          .catch(fail)
      );
    });

    it("should be error when createUnzipStream$ failed", () => {
      // arrange
      const params = {
        zipFilePath: "/zip/file/path",
        tmpDir: "/tmp/dir",
      };
      const expected = new UnzipError(EUnzipError.UNKNOWN);
      jest.spyOn(service, "createUnzipStream$").mockReturnValue(throwError(expected));

      // act
      return (
        service
          .unzip(params)
          // assert
          .then(fail)
          .catch((actual) => expect(actual).toEqual(expected))
      );
    });

    it("should be UNZIP_FAILED error when createUnzipStream$ throws native error", () => {
      // arrange
      const params = {
        zipFilePath: "/zip/file/path",
        tmpDir: "/tmp/dir",
      };
      const err = new Error("error des");
      const expected = new UnzipError(EUnzipError.UNZIP_FAILED, { error: err });
      jest.spyOn(service, "createUnzipStream$").mockReturnValue(throwError(err));

      // act
      return (
        service
          .unzip(params)
          // assert
          .then(fail)
          .catch((actual) => expect(actual).toEqual(expected))
      );
    });
  });

  describe(UnzipService.prototype.createUnzipStream$.name, () => {
    it("should return destDir when unzipStream emits close", () => {
      // arrange
      const destDir = "/tmp/dir";

      // act
      const actual$ = service
        .createUnzipStream$(zipStream as any, destDir)
        .toPromise()
        // assert
        .then((actual) => expect(actual).toBe(destDir))
        .then(() => expect(unzipStream.destroyed).toBe(true))
        .catch(fail);

      unzipStream.emit("close");
      unzipStream.emit("close");
      return actual$;
    });

    it("should be FILE_SAVE_FAILED error when unzipStream emits error", () => {
      // arrange
      const destDir = "/tmp/dir";
      const err = new Error("error des");
      const expected = new UnzipError(EUnzipError.FILE_SAVE_FAILED, { error: err });

      // act
      const actual$ = service
        .createUnzipStream$(zipStream as any, destDir)
        .toPromise()
        // assert
        .then(fail)
        .catch((actual) => expect(actual).toEqual(expected))
        .then(() => expect(unzipStream.destroyed).toBe(true));

      unzipStream.emit("error", err);
      return actual$;
    });
  });
});
