// tslint:disable: variable-name
import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";

import { EventEmitter } from "events";
import { Readable } from "stream";
import * as fs from "fs";

import { of } from "rxjs";
import { catchError, tap } from "rxjs/operators";

import { LoggerService } from "../logger/logger.service";
import { ConfigService } from "../config";
import { FtpClientConfig } from "../../environment/ftp-client";
import { ErrorCode } from "../postgres/client";

import { externals, FtpClientService } from "./ftp-client.service";

// --------------------------------------

describe(FtpClientService.name, () => {
  let client: ClientMock;
  let service: FtpClientService;
  let config: ConfigService;

  class ClientMock extends EventEmitter {
    constructor(
      public mkdir = jest.fn((...args) => [...args].pop()()),
      public get = jest.fn((...args) => [...args].pop()()),
      public put = jest.fn((...args) => [...args].pop()()),
      public rmdir = jest.fn((...args) => [...args].pop()()),
      public logout = jest.fn((...args) => [...args].pop()()),
      public connect = jest.fn(),
      public end = jest.fn(),
    ) {
      super();
    }
  }

  class FtpClientConfigMock implements FtpClientConfig {
    public host: "ftp.service.host";
    public port: 8021;
    public secure: true;
    public user: "testuser";
    public password: "testpassword";
  }

  class ConfigServiceMock {
    public ftpClientConfig = jest.fn().mockReturnValue(new FtpClientConfigMock());
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
      providers: [
        FtpClientService,
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get<FtpClientService>(FtpClientService);
    config = module.get<ConfigService>(ConfigService);

    client = new ClientMock();
    jest.spyOn(externals, "createClient").mockReturnValue(client as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(config).toBeDefined();
    expect(client).toBeInstanceOf(ClientMock);
  });

  describe(FtpClientService.prototype.getObjectStream$.name, () => {
    it("should complete with stream", async () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const stream = new Readable();
      client.get.mockImplementation((p: string, fn: (e: any, s: NodeJS.ReadableStream) => void) => {
        fn(null, stream as any);
      });
      client.logout.mockImplementation((fn: (e: any) => void) => {
        fn(null);
      });
      const expected = stream;

      // act
      const p$ = service
        .getObjectStream$(objectName)
        .toPromise()
        // assert
        .then((actual) => {
          expect(actual).toEqual(expected);
        })
        .catch(fail);

      client.emit("ready");
      return p$;
    });

    it("should logout when stream ends", async () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const stream = new Readable();
      client.get.mockImplementation((p: string, fn: (e: any, s: NodeJS.ReadableStream) => void) => {
        fn(null, stream as any);
      });
      client.logout.mockImplementation((fn: (e: any) => void) => {
        fn(null);
      });

      // act
      const p$ = service
        .getObjectStream$(objectName)
        .toPromise()
        // assert
        .then(() => {
          expect(client.logout).toHaveBeenCalled();
          expect(client.end).toHaveBeenCalled();
        })
        .catch(fail);

      client.emit("ready");
      stream.emit("end");
      return p$;
    });

    it("should throw InternalServerErrorException if client tells error event", () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const error = new Error("error des");

      // act
      const p$ = service
        .getObjectStream$(objectName)
        .toPromise()
        // assert
        .then(fail)
        .catch((actual) => expect(actual).toBeInstanceOf(InternalServerErrorException));

      client.emit("error", error);

      return p$;
    });

    it("should throw InternalServerErrorException if client could not connect to ftp server", () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const error = new Error("error des");
      client.connect.mockImplementation(() => {
        throw error;
      });

      // act
      const p$ = service
        .getObjectStream$(objectName)
        .toPromise()
        // assert
        .then(fail)
        .catch((actual) => expect(actual).toBeInstanceOf(InternalServerErrorException));

      return p$;
    });
  });

  describe(FtpClientService.prototype.saveStreamInFile$.name, () => {
    class StreamMock extends Readable {
      public _read = jest.fn();
    }

    it("should write data in file", (done) => {
      // arrange
      const stream = new StreamMock();
      const params = {
        stream,
        path: "path",
        writeFile: jest.fn((p: fs.PathLike | number, d: any, callback: (err: NodeJS.ErrnoException | null) => void) => {
          return callback(null);
        }),
      };

      // act
      service
        .saveStreamInFile$(params.stream, params.path, params.writeFile)
        .pipe(
          tap(() => {
            expect(params.writeFile).toHaveBeenCalledWith(params.path, "hoge", expect.anything());
            expect(params.writeFile).toHaveBeenCalledWith(params.path, "moge", expect.anything());
            return null;
          }),
        )
        .subscribe(() => {}, done, done);

      stream.emit("data", "hoge");
      stream.emit("data", "moge");
      stream.emit("end");
    });

    it("should return error when failed to write file", (done) => {
      // arrange
      const stream = new StreamMock();
      const params = {
        stream,
        path: "path",
        writeFile: jest.fn((p: fs.PathLike | number, d: any, callback: (err: NodeJS.ErrnoException | null) => void) => {
          return callback({} as Error);
        }),
      };

      // act
      service
        .saveStreamInFile$(params.stream, params.path, params.writeFile)
        .pipe(
          catchError((e: any) => {
            expect(params.writeFile).toHaveBeenCalledWith(params.path, "hoge", expect.anything());
            expect(e.code).toEqual(ErrorCode.INTERNAL);
            return of(null);
          }),
        )
        .subscribe(done, done);

      stream.emit("data", "hoge");
    });

    it("should return error when stream emit error", (done) => {
      // arrange
      const stream = new StreamMock();
      const params = {
        stream,
        path: "path",
        writeFile: jest.fn((p: fs.PathLike | number, d: any, callback: (err: NodeJS.ErrnoException | null) => void) => {
          return callback({} as any);
        }),
      };

      // act
      service
        .saveStreamInFile$(params.stream, params.path, params.writeFile)
        .pipe(
          catchError((e: any) => {
            expect(params.writeFile).not.toHaveBeenCalled();
            expect(e.code).toEqual(ErrorCode.INTERNAL);
            return of(null);
          }),
        )
        .subscribe(done, done);

      stream.emit("error");
    });
  });

  describe(FtpClientService.prototype.putObject$.name, () => {
    it("should complete with null", async () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const object = Buffer.from("this is object buffer");
      const expected = null;

      // act
      const p$ = service
        .putObject$(objectName, object)
        .toPromise()
        // assert
        .then((actual) => expect(actual).toEqual(expected))
        .catch(fail);

      client.emit("ready");
      return p$;
    });

    it("should throw InternalServerErrorException if client tells error event", () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const object = Buffer.from("this is object buffer");
      const error = new Error("error des");

      // act
      const p$ = service
        .putObject$(objectName, object)
        .toPromise()
        // assert
        .then(fail)
        .catch((actual) => expect(actual).toBeInstanceOf(InternalServerErrorException));

      client.emit("error", error);

      return p$;
    });

    it("should throw InternalServerErrorException if client could not connect to ftp server", () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const object = Buffer.from("this is object buffer");
      const error = new Error("error des");
      client.connect.mockImplementation(() => {
        throw error;
      });

      // act
      const p$ = service
        .putObject$(objectName, object)
        .toPromise()
        // assert
        .then(fail)
        .catch((actual) => expect(actual).toBeInstanceOf(InternalServerErrorException));

      return p$;
    });
  });

  describe(FtpClientService.prototype.deleteObject$.name, () => {
    it("should complete with null", async () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const expected = null;

      // act
      const p$ = service
        .deleteObject$(objectName)
        .toPromise()
        // assert
        .then((actual) => expect(actual).toEqual(expected))
        .catch(fail);

      client.emit("ready");
      return p$;
    });

    it("should complete with null if object is empty string", async () => {
      // arrange
      const objectName = "";
      const expected = null;

      // act
      const p$ = service
        .deleteObject$(objectName)
        .toPromise()
        // assert
        .then((actual) => expect(actual).toEqual(expected))
        .catch(fail);

      client.emit("ready");
      return p$;
    });

    it("should complete with null if object is null", async () => {
      // arrange
      const objectName = null;
      const expected = null;

      // act
      const p$ = service
        .deleteObject$(objectName)
        .toPromise()
        // assert
        .then((actual) => expect(actual).toEqual(expected))
        .catch(fail);

      client.emit("ready");
      return p$;
    });

    it("should throw InternalServerErrorException if client tells error event", () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const error = new Error("error des");

      // act
      const p$ = service
        .deleteObject$(objectName)
        .toPromise()
        // assert
        .then(fail)
        .catch((actual) => expect(actual).toBeInstanceOf(InternalServerErrorException));

      client.emit("error", error);

      return p$;
    });

    it("should throw InternalServerErrorException if client could not connect to ftp server", () => {
      // arrange
      const objectName = "ftp/object/name.zip";
      const error = new Error("error des");
      client.connect.mockImplementation(() => {
        throw error;
      });

      // act
      const p$ = service
        .deleteObject$(objectName)
        .toPromise()
        // assert
        .then(fail)
        .catch((actual) => expect(actual).toBeInstanceOf(InternalServerErrorException));

      return p$;
    });
  });

  describe(FtpClientService.prototype.convertUrlToFTPKey.name, () => {
    [
      {
        input: "ftp://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
        output: "0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
      },
      {
        input: "ftp://ftp.glory-cloud.dev:21/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
        output: "0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
      },
      {
        input: "ftps://ftp.glory-cloud.dev/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
        output: "0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
      },
      {
        input: "ftps://ftp.glory-cloud.dev:990/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
        output: "0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
      },
    ].forEach((tc) => {
      it("should convert input to output", () => {
        expect(service.convertUrlToFTPKey(tc.input)).toEqual(tc.output);
      });
    });
  });
});
