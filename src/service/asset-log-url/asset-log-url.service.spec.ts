import { Test, TestingModule } from "@nestjs/testing";

import { of, throwError } from "rxjs";

import { AssetLogUrlService } from "./asset-log-url.service";
import { AssetLogUrlServiceGetParams } from "./asset-log-url.service.i";
import { TasksService } from "../tasks";
import { IbmCosService, IbmCosError, EIbmCosError } from "../ibm-cos";
import { ConfigService } from "../config";
import { LoggerService } from "../logger";
import { ObjectStorageConfig } from "../../environment/object-storage";
import { BridgeXServerError, ErrorCode } from "../utils";

describe("AssetFilterService", () => {
  let service: AssetLogUrlService;
  let tasksService: TasksService;
  let ibmCosService: IbmCosService;
  let configService: ConfigService;

  class TasksServiceMock {
    public toTaskLogCosKey = jest.fn();
  }

  class IbmCosServiceMock {
    public headObject$ = jest.fn();
    public getObjectUrl$ = jest.fn();
  }

  class ConfigServiceMock {
    public objectStorageConfig = jest.fn();
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
        AssetLogUrlService,
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: IbmCosService, useClass: IbmCosServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get<AssetLogUrlService>(AssetLogUrlService);
    tasksService = module.get<TasksService>(TasksService);
    ibmCosService = module.get<IbmCosService>(IbmCosService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(AssetLogUrlService.name, () => {
    describe(AssetLogUrlService.prototype.getAssetLogUrl.name, () => {
      it("should check existence of file in cos and return 404 when failed", () => {
        // arrange
        const params: AssetLogUrlServiceGetParams = {
          taskId: "taskId",
          typeId: "typeId",
          assetId: "assetId",
        };

        jest.spyOn(configService, "objectStorageConfig").mockReturnValue({
          logSignedUrlAvailableTime: 1234,
          assetLogsPrefix: "asset log prefix",
        } as ObjectStorageConfig);
        jest.spyOn(tasksService, "toTaskLogCosKey").mockReturnValue("cos key");
        jest.spyOn(ibmCosService, "headObject$").mockReturnValue(throwError({}));
        jest.spyOn(ibmCosService, "getObjectUrl$").mockReturnValue(of("sigendUrl"));

        const expected = {
          errorKind: BridgeXServerError,
          statusCode: ErrorCode.NOT_FOUND,
        };

        // act
        return (
          service
            .getAssetLogUrl(params)
            .toPromise()
            // assert
            .then(() => fail("here is unexpected"))
            .catch((e: any) => {
              expect(ibmCosService.headObject$).toHaveBeenCalledWith("cos key");
              expect(e).toBeInstanceOf(expected.errorKind);
              expect(e.code).toEqual(expected.statusCode);
            })
        );
      });

      it("should create signed url", () => {
        // arrange
        const params: AssetLogUrlServiceGetParams = {
          taskId: "taskId",
          typeId: "typeId",
          assetId: "assetId",
        };

        jest.spyOn(configService, "objectStorageConfig").mockReturnValue({
          logSignedUrlAvailableTime: 1234,
          assetLogsPrefix: "asset log prefix",
        } as ObjectStorageConfig);
        jest.spyOn(tasksService, "toTaskLogCosKey").mockReturnValue("cos key");
        jest.spyOn(ibmCosService, "headObject$").mockReturnValue(of({}));
        jest.spyOn(ibmCosService, "getObjectUrl$").mockReturnValue(throwError(new IbmCosError(EIbmCosError.AWS_ERROR)));

        const expected = {
          getObjectUrl: {
            objectName: "cos key",
            expireTime: 1234,
          },
          errorKind: BridgeXServerError,
          statusCode: ErrorCode.INTERNAL,
        };

        // act
        return (
          service
            .getAssetLogUrl(params)
            .toPromise()
            // assert
            .then(() => fail("here is unexpected"))
            .catch((e: any) => {
              expect(ibmCosService.getObjectUrl$).toHaveBeenCalledWith(expected.getObjectUrl.objectName, expected.getObjectUrl.expireTime);
              expect(e).toBeInstanceOf(expected.errorKind);
              expect(e.code).toEqual(expected.statusCode);
            })
        );
      });

      it("should return signed url of log file", () => {
        // arrange
        const params: AssetLogUrlServiceGetParams = {
          taskId: "taskId",
          typeId: "typeId",
          assetId: "assetId",
        };

        jest.spyOn(configService, "objectStorageConfig").mockReturnValue({
          logSignedUrlAvailableTime: 1234,
          assetLogsPrefix: "asset log prefix",
        } as ObjectStorageConfig);
        jest.spyOn(tasksService, "toTaskLogCosKey").mockReturnValue("cos key");
        jest.spyOn(ibmCosService, "headObject$").mockReturnValue(of({}));
        jest.spyOn(ibmCosService, "getObjectUrl$").mockReturnValue(of("sigendUrl"));

        const expected = {
          assetLogURL: "sigendUrl",
        };

        // act
        return (
          service
            .getAssetLogUrl(params)
            .toPromise()
            // assert
            .then((data: any) => {
              expect(data).toEqual(expected);
            })
            .catch((e) => fail(e))
        );
      });
    });
  });
});
