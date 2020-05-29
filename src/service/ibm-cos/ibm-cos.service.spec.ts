jest.mock("fs");
import { Test, TestingModule } from "@nestjs/testing";
import { S3 } from "aws-sdk";

// --------------------------------

import { LoggerService } from "../logger";
import { ConfigService } from "../config";
import { IbmCosService } from "./ibm-cos.service";
import { ObjectStorageConfig } from "../../environment/object-storage";
import { IbmCosError, EIbmCosError } from "./ibm-cos.service.i";
import internal from "stream";

// --------------------------------

class LoggerServiceMock {
  public info = jest.fn();
  public error = jest.fn();
}

class ConfigServiceMock {
  public appConfig = jest.fn();
  public objectStorageConfig = jest.fn(() => ({} as ObjectStorageConfig));
}

// --------------------------------

describe(IbmCosService.name, () => {
  let service: IbmCosService;
  let logger: LoggerService;
  let config: ConfigService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IbmCosService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
      ],
    }).compile();

    service = module.get(IbmCosService);
    logger = module.get(LoggerService);
    config = module.get(ConfigService);
  });

  it("should initialize", () => {
    expect(service).toBeDefined();
    expect(logger).toBeDefined();
    expect(config).toBeDefined();
  });

  describe(IbmCosService.prototype.getClient.name, () => {
    describe("in the case config have proxy as empty string", () => {
      it("should return S3 client", () => {
        // arrange
        const configuration: ObjectStorageConfig = {
          endpoint: "endpoint",
          port: "30000",
          bucket: "bridge-x",
          accessKeyId: "id",
          secretAccessKey: "key",
          pathPrefix: "packages",
          assetLogsPrefix: "asset-logs",
          logSignedUrlAvailableTime: 60,
          proxy: "",
        };
        config.objectStorageConfig = jest.fn(() => configuration);

        const opts = {
          signatureVersion: "v4",
          endpoint: `${configuration.endpoint}:${configuration.port}`,
          accessKeyId: configuration.accessKeyId,
          secretAccessKey: configuration.secretAccessKey,
          s3ForcePathStyle: true,
        };
        const expected = JSON.parse(JSON.stringify(new S3(opts)));
        expected._clientId = expect.any(Number);

        // act
        const actual: S3 = service.getClient();

        // assert
        expect(actual).toBeInstanceOf(S3);
        expect(JSON.parse(JSON.stringify(actual))).toEqual(expected);
      });

      it("should return S3 client without port setting", () => {
        // arrange
        const configuration: ObjectStorageConfig = {
          endpoint: "endpoint",
          port: "",
          bucket: "bridge-x",
          accessKeyId: "id",
          secretAccessKey: "key",
          pathPrefix: "packages",
          assetLogsPrefix: "asset-logs",
          logSignedUrlAvailableTime: 60,
          proxy: "",
        };
        config.objectStorageConfig = jest.fn(() => configuration);

        const opts = {
          signatureVersion: "v4",
          endpoint: `${configuration.endpoint}`,
          accessKeyId: configuration.accessKeyId,
          secretAccessKey: configuration.secretAccessKey,
          s3ForcePathStyle: true,
        };
        const expected = JSON.parse(JSON.stringify(new S3(opts)));
        expected._clientId = expect.any(Number);

        // act
        const actual: S3 = service.getClient();

        // assert
        expect(actual).toBeInstanceOf(S3);
        expect(JSON.parse(JSON.stringify(actual))).toEqual(expected);
      });
    });

    describe("in the case config have proxy as truthy value", () => {
      it("should return S3 client", () => {
        // arrange
        const configuration: ObjectStorageConfig = {
          endpoint: "endpoint",
          port: "30000",
          bucket: "bridge-x",
          accessKeyId: "id",
          secretAccessKey: "key",
          pathPrefix: "packages",
          assetLogsPrefix: "asset-logs",
          logSignedUrlAvailableTime: 60,
          proxy: "111.111.111.111",
        };
        config.objectStorageConfig = jest.fn(() => configuration);

        const opts = {
          signatureVersion: "v4",
          endpoint: `${configuration.endpoint}${configuration.port ? ":" + configuration.port : ""}`,
          accessKeyId: configuration.accessKeyId,
          secretAccessKey: configuration.secretAccessKey,
          s3ForcePathStyle: true,
          httpOptions: { proxy: configuration.proxy },
        };
        const expected = JSON.parse(JSON.stringify(new S3(opts)));
        expected._clientId = expect.any(Number);

        // act
        const actual: S3 = service.getClient();

        // assert
        expect(actual).toBeInstanceOf(S3);
        expect(JSON.parse(JSON.stringify(actual))).toEqual(expected);
      });
    });
  });

  describe(IbmCosService.prototype.getS3ReadableStream.name, () => {
    let arg: string[];

    beforeEach(() => {
      arg = ["bucket", "objectName", "outputFilePath"];
    });

    it("should call getClient", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      try {
        service.getS3ReadableStream(arg[0], arg[1], arg[2]);
        fail("test error");
      } catch {
        expect(service.getClient).toHaveBeenCalled();
      }
    });

    it("should call s3.getObject", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      try {
        service.getS3ReadableStream(arg[0], arg[1], arg[2]);
        fail("test error");
      } catch {
        expect(s3.getObject).toHaveBeenCalled();
      }
    });

    it("should return stream", () => {
      // arrange
      const s3 = new S3();
      const stream = new internal.Readable();
      jest.spyOn(s3, "getObject").mockImplementation(() => {
        return {
          createReadStream: jest.fn(() => stream),
        } as any;
      });
      jest.spyOn(stream, "pipe").mockImplementation(jest.fn());
      service.getClient = jest.fn(() => s3);

      // act
      try {
        const actual = service.getS3ReadableStream(arg[0], arg[1], arg[2]);
        expect(stream.pipe).toHaveBeenCalled();
        expect(actual).toBe(stream);
      } catch (e) {
        fail(e);
      }
    });
  });

  describe(IbmCosService.prototype.getFile$.name, () => {
    let arg: string[];

    beforeEach(() => {
      arg = ["objectName", "outputFilePath"];

      config.objectStorageConfig = jest.fn(
        () =>
          ({
            bucket: "bucket",
          } as ObjectStorageConfig),
      );
    });

    it("should return outputFilePath when receive error event", () => {
      // arrange
      const err = new Error("test error");
      const streamMock: any = {
        addListener: jest.fn((a: any, b: (arg?: any) => void) => {
          switch (a) {
            case "error":
              b(err);
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
      jest.spyOn(service, "getS3ReadableStream").mockReturnValue(streamMock);

      const expected = new IbmCosError(EIbmCosError.AWS_ERROR, err);
      // act
      return service
        .getFile$(arg[0], arg[1])
        .toPromise()
        .then((d: any) => {
          fail(d);
        })
        .catch((e: IbmCosError<any>) => {
          // actual
          expect(logger.info).toHaveBeenCalledWith(`s3-stream event. error:bucket:objectName`);
          expect(e).toEqual(expected);
        });
    });

    it("should return outputFilePath when receive end event", () => {
      // arrange
      const streamMock: any = {
        addListener: jest.fn((a: any, b: (arg?: any) => void) => {
          switch (a) {
            case "error":
              return;
            case "data":
              b({});
              return;
            case "end":
              b();
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
      jest.spyOn(service, "getS3ReadableStream").mockReturnValue(streamMock);

      // act
      return service
        .getFile$(arg[0], arg[1])
        .toPromise()
        .then((d: any) => {
          // actual
          expect(logger.info).toHaveBeenCalledWith(`s3-stream event. end:bucket:objectName`);
          expect(d).toEqual("outputFilePath");
        })
        .catch((e: IbmCosError<any>) => {
          fail(e);
        });
    });

    it("should return outputFilePath when receive close close", () => {
      // arrange
      const streamMock: any = {
        addListener: jest.fn((a: any, b: (arg?: any) => void) => {
          switch (a) {
            case "error":
              return;
            case "data":
              b({});
              return;
            case "end":
              return;
            case "close":
              b();
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
      jest.spyOn(service, "getS3ReadableStream").mockReturnValue(streamMock);

      // act
      return service
        .getFile$(arg[0], arg[1])
        .toPromise()
        .then((d: any) => {
          // actual
          expect(logger.info).toHaveBeenCalledWith(`s3-stream event. close:bucket:objectName`);
          expect(d).toEqual("outputFilePath");
        })
        .catch((e: IbmCosError<any>) => {
          fail(e);
        });
    });

    it("should return outputFilePath when receive finish close", () => {
      // arrange
      const streamMock: any = {
        addListener: jest.fn((a: any, b: (arg?: any) => void) => {
          switch (a) {
            case "error":
              return;
            case "data":
              b({});
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
      jest.spyOn(service, "getS3ReadableStream").mockReturnValue(streamMock);

      // act
      return service
        .getFile$(arg[0], arg[1])
        .toPromise()
        .then((d: any) => {
          // actual
          expect(logger.info).toHaveBeenCalledWith(`s3-stream event. finish:bucket:objectName`);
          expect(d).toEqual("outputFilePath");
        })
        .catch((e: IbmCosError<any>) => {
          fail(e);
        });
    });

    it("should return error when happend error", () => {
      // arrange
      const err = new Error("123");
      const expected = new IbmCosError(EIbmCosError.AWS_ERROR, err);
      jest.spyOn(service, "getS3ReadableStream").mockImplementation(() => {
        throw err;
      });
      // act
      return service
        .getFile$(arg[0], arg[1])
        .toPromise()
        .then((d: any) => {
          fail(d);
        })
        .catch((e: IbmCosError<any>) => {
          // actual
          expect(e).toEqual(expected);
        });
    });
  });

  describe(IbmCosService.prototype.headObject$.name, () => {
    let arg: string;

    beforeEach(() => {
      arg = "objectName";

      config.objectStorageConfig = jest.fn(
        () =>
          ({
            bucket: "bucket",
          } as ObjectStorageConfig),
      );
    });

    it("should call getClient and objectStorageConfig", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "headObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .headObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(service.getClient).toHaveBeenCalled();
          expect(config.objectStorageConfig).toHaveBeenCalled();
        });
    });

    it("should call s3.getObject", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "headObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .headObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(s3.headObject).toHaveBeenCalled();
        });
    });

    it("should return IbmCosError", () => {
      // arrange
      const s3 = new S3();
      const err = new Error();
      jest.spyOn(s3, "headObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(err);
      });
      service.getClient = jest.fn(() => s3);

      const expected = new IbmCosError(EIbmCosError.AWS_ERROR, err);

      // act
      return service
        .headObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: IbmCosError<any>) => {
          expect(e).toEqual(expected);
        });
    });
  });

  describe(IbmCosService.prototype.getObject$.name, () => {
    let arg: string;

    beforeEach(() => {
      arg = "objectName";

      config.objectStorageConfig = jest.fn(
        () =>
          ({
            bucket: "bucket",
          } as ObjectStorageConfig),
      );
    });

    it("should call getClient and objectStorageConfig", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .getObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(service.getClient).toHaveBeenCalled();
          expect(config.objectStorageConfig).toHaveBeenCalled();
        });
    });

    it("should call s3.getObject", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .getObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(s3.getObject).toHaveBeenCalled();
        });
    });

    it("should return IbmCosError", () => {
      // arrange
      const s3 = new S3();
      const err = new Error();
      jest.spyOn(s3, "getObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(err);
      });
      service.getClient = jest.fn(() => s3);

      const expected = new IbmCosError(EIbmCosError.AWS_ERROR, err);

      // act
      return service
        .getObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: IbmCosError<any>) => {
          expect(e).toEqual(expected);
        });
    });
  });

  describe(IbmCosService.prototype.putObject$.name, () => {
    let arg: { objecttName?: any; body: any; objectName?: string };

    beforeEach(() => {
      arg = {
        objectName: "objectName",
        body: "",
      };

      config.objectStorageConfig = jest.fn(
        () =>
          ({
            bucket: "bucket",
          } as ObjectStorageConfig),
      );
    });

    it("should call getClient and objectStorageConfig", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "putObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .putObject$(arg.objecttName, arg.body)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(service.getClient).toHaveBeenCalled();
          expect(config.objectStorageConfig).toHaveBeenCalled();
        });
    });

    it("should call s3.getObject", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "putObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .putObject$(arg.objecttName, arg.body)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(s3.putObject).toHaveBeenCalled();
        });
    });

    it("should return IbmCosError", () => {
      // arrange
      const s3 = new S3();
      const err = new Error();
      jest.spyOn(s3, "putObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(err);
      });
      service.getClient = jest.fn(() => s3);

      const expected = new IbmCosError(EIbmCosError.AWS_ERROR, err);

      // act
      return service
        .putObject$(arg.objecttName, arg.body)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: IbmCosError<any>) => {
          expect(e).toEqual(expected);
        });
    });
  });

  describe(IbmCosService.prototype.deleteObject$.name, () => {
    let arg: string;

    beforeEach(() => {
      arg = "objectName";

      config.objectStorageConfig = jest.fn(
        () =>
          ({
            bucket: "bucket",
          } as ObjectStorageConfig),
      );
    });

    it("should call getClient and objectStorageConfig", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "deleteObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .deleteObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(service.getClient).toHaveBeenCalled();
          expect(config.objectStorageConfig).toHaveBeenCalled();
        });
    });

    it("should call s3.deleteObject", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "deleteObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(new Error());
      });
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .deleteObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(s3.deleteObject).toHaveBeenCalled();
        });
    });

    it("should return IbmCosError", () => {
      // arrange
      const s3 = new S3();
      const err = new Error();
      jest.spyOn(s3, "deleteObject").mockImplementation((a: any, callback?: (err: any, data?: any) => any) => {
        return callback && callback(err);
      });
      service.getClient = jest.fn(() => s3);

      const expected = new IbmCosError(EIbmCosError.AWS_ERROR, err);

      // act
      return service
        .deleteObject$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: IbmCosError<any>) => {
          expect(e).toEqual(expected);
        });
    });
  });

  describe(IbmCosService.prototype.getObjectUrl$.name, () => {
    let arg: { objectName: any; expires: any };

    beforeEach(() => {
      arg = {
        objectName: "objectName",
        expires: 60,
      };

      config.objectStorageConfig = jest.fn(
        () =>
          ({
            bucket: "bucket",
          } as ObjectStorageConfig),
      );
    });

    it("should call getClient and objectStorageConfig", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getSignedUrlPromise").mockRejectedValue(new Error());
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .getObjectUrl$(arg.objectName, arg.expires)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(service.getClient).toHaveBeenCalled();
          expect(config.objectStorageConfig).toHaveBeenCalled();
        });
    });

    it("should call getSignedUrlPromise", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getSignedUrlPromise").mockRejectedValue(new Error());
      service.getClient = jest.fn(() => s3);

      const expected = {
        operation: "getObject",
        params: {
          Bucket: config.objectStorageConfig().bucket,
          Key: arg.objectName,
          Expires: arg.expires,
        },
      };

      // act
      return service
        .getObjectUrl$(arg.objectName, arg.expires)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(s3.getSignedUrlPromise).toHaveBeenCalledWith(expected.operation, expected.params);
        });
    });

    it("should call getSignedUrlPromise with default Expires", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getSignedUrlPromise").mockRejectedValue(new Error());
      service.getClient = jest.fn(() => s3);

      const expected = {
        operation: "getObject",
        params: {
          Bucket: config.objectStorageConfig().bucket,
          Key: arg.objectName,
          Expires: IbmCosService.defaultExpires,
        },
      };

      // act
      return service
        .getObjectUrl$(arg.objectName)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(s3.getSignedUrlPromise).toHaveBeenCalledWith(expected.operation, expected.params);
        });
    });

    it("should return objectName given by getSignedUrlPromise", () => {
      // arrange
      const s3 = new S3();
      const objectName = arg.objectName;
      jest.spyOn(s3, "getSignedUrlPromise").mockResolvedValue(objectName);
      service.getClient = jest.fn(() => s3);

      const expected = objectName;

      // act
      return service
        .getObjectUrl$(arg.objectName, arg.expires)
        .toPromise()
        .then((d) => {
          expect(d).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it("should call getClient and objectStorageConfig", () => {
      // arrange
      const s3 = new S3();
      const err = new Error();
      jest.spyOn(s3, "getSignedUrlPromise").mockRejectedValue(err);
      service.getClient = jest.fn(() => s3);

      const expected = new IbmCosError(EIbmCosError.AWS_ERROR, err);

      // act
      return service
        .getObjectUrl$(arg.objectName, arg.expires)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: IbmCosError<any>) => {
          expect(e).toEqual(expected);
        });
    });
  });

  describe(IbmCosService.prototype.putObjectUrl$.name, () => {
    let arg: { objectName: any; expires: any };

    beforeEach(() => {
      arg = {
        objectName: "objectName",
        expires: 60,
      };

      config.objectStorageConfig = jest.fn(
        () =>
          ({
            bucket: "bucket",
          } as ObjectStorageConfig),
      );
    });

    it("should call getClient and objectStorageConfig", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getSignedUrlPromise").mockRejectedValue(new Error());
      service.getClient = jest.fn(() => s3);

      // act
      return service
        .putObjectUrl$(arg.objectName, arg.expires)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(service.getClient).toHaveBeenCalled();
          expect(config.objectStorageConfig).toHaveBeenCalled();
        });
    });

    it("should call getSignedUrlPromise", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getSignedUrlPromise").mockRejectedValue(new Error());
      service.getClient = jest.fn(() => s3);

      const expected = {
        operation: "putObject",
        params: {
          Bucket: config.objectStorageConfig().bucket,
          Key: arg.objectName,
          Expires: arg.expires,
        },
      };

      // act
      return service
        .putObjectUrl$(arg.objectName, arg.expires)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(s3.getSignedUrlPromise).toHaveBeenCalledWith(expected.operation, expected.params);
        });
    });

    it("should call getSignedUrlPromise with default Expires", () => {
      // arrange
      const s3 = new S3();
      jest.spyOn(s3, "getSignedUrlPromise").mockRejectedValue(new Error());
      service.getClient = jest.fn(() => s3);

      const expected = {
        operation: "putObject",
        params: {
          Bucket: config.objectStorageConfig().bucket,
          Key: arg.objectName,
          Expires: IbmCosService.defaultExpires,
        },
      };

      // act
      return service
        .putObjectUrl$(arg.objectName)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(s3.getSignedUrlPromise).toHaveBeenCalledWith(expected.operation, expected.params);
        });
    });

    it("should return objectName given by getSignedUrlPromise", () => {
      // arrange
      const s3 = new S3();
      const objectName = arg.objectName;
      jest.spyOn(s3, "getSignedUrlPromise").mockResolvedValue(objectName);
      service.getClient = jest.fn(() => s3);

      const expected = objectName;

      // act
      return service
        .putObjectUrl$(arg.objectName, arg.expires)
        .toPromise()
        .then((d) => {
          expect(d).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it("should call getClient and objectStorageConfig", () => {
      // arrange
      const s3 = new S3();
      const err = new Error();
      jest.spyOn(s3, "getSignedUrlPromise").mockRejectedValue(err);
      service.getClient = jest.fn(() => s3);

      const expected = new IbmCosError(EIbmCosError.AWS_ERROR, err);

      // act
      return service
        .putObjectUrl$(arg.objectName, arg.expires)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: IbmCosError<any>) => {
          expect(e).toEqual(expected);
        });
    });
  });

  describe(IbmCosService.prototype.convertUrlToCOSKey.name, () => {
    [
      {
        input: "http://object-storage/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
        output: "0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
      },
      {
        input: "http://object-storage:80/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
        output: "0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
      },
      {
        input: "https://object-storage/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
        output: "0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
      },
      {
        input: "https://object-storage:443/0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
        output: "0416fdd6-51be-5cc6-2c12-5a653ab00001/model-asset-01.tar.gz",
      },
    ].forEach((tc) => {
      it("should convert input to output", () => {
        expect(service.convertUrlToCOSKey(tc.input)).toEqual(tc.output);
      });
    });
  });
});
