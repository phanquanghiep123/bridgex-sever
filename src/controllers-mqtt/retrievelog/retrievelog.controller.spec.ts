import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError, empty } from "rxjs";
import { delay } from "rxjs/operators";
import { cases } from "rxjs-marbles/jest";

import { RetrieveLogController, externals } from "./retrievelog.controller";
import {
  TasksService,
  ETaskAssetStatus,
  UpdateLogTaskAsset,
  TaskAssetKey,
  RetrieveLogResultRecord,
  ERetrieveLogsStatus,
  ETaskStatus,
  LogTask,
  LogTaskAsset,
} from "../../service/tasks";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { ConfigService } from "../../service/config";
import { LoggerService } from "../../service/logger";
import { HttpClientService } from "../../service/http-client";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { AssetStatusService, AssetStatus } from "../../service/asset-status";
import { FtpClientService } from "../../service/ftp-client/ftp-client.service";
import { IbmCosService } from "../../service/ibm-cos";
import { BridgeEventListService, ETaskErrorResult } from "../../service/event-list";
import { MqttPublishService } from "../../service/mqtt-publish";
import { ZipLogService } from "../../service/zip-log";
import { AppConfig, path } from "../../environment/app";
import { ObjectStorageConfig } from "../../environment/object-storage";
import { PersistentVolumeConfig } from "../../environment/persistent-volume";
import { MqttResponsePayload, EResult, EMessageType, EMessageName } from "../mqtt-message.i";

describe(RetrieveLogController.name, () => {
  let controller: RetrieveLogController;
  let tasksService: TasksService;
  let ftpClientService: FtpClientService;
  let ibmCosService: IbmCosService;
  let guardMqttMessage: GuardMqttMessage;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;
  let mqttPublishService: MqttPublishService;
  let zipLogService: ZipLogService;

  class TasksServiceMock {
    public insertRetrievelog$ = jest.fn().mockReturnValue(empty());
    public updateLogTaskAsset$ = jest.fn().mockReturnValue(empty());
    public getLogTask$ = jest.fn().mockReturnValue(empty());
    public updateLogTask$ = jest.fn().mockReturnValue(empty());
    public toTaskLogCosKey = jest.fn();
    public bulkGetRetrieveLogResults$ = jest.fn();
  }

  class FtpClientServiceMock {
    public convertUrlToFTPKey = jest.fn(() => {});
    public getObjectStream$ = jest.fn(() => of(null));
    public saveStreamInFile$ = jest.fn(() => of(null));
  }

  class IbmCosServiceMock {
    public putObject$ = jest.fn(() => {});
  }

  class GuardMqttMessageMock {
    public isMqttMessagePayload = jest.fn();
    public isMqttResponsePayload = jest.fn();
  }
  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class ConfigServiceMock {
    public appConfig = jest.fn();
    public persistentVolumeConfig = jest.fn(() => ({
      validatePackageTmpDir: "/tmp",
    }));
    public objectStorageConfig = jest.fn(() => ({
      endpoint: "endPoint",
      assetLogsPrefix: "asset-logs",
    }));
  }

  class HttpClientServiceMock {
    public delete$ = jest.fn().mockReturnValue(empty());
  }

  class AssetStatusServiceMock {
    public getOwnerOrThis$ = jest.fn().mockReturnValue(empty());
    public get$ = jest.fn().mockReturnValue(empty());
  }

  class BridgeEventListServiceMock {
    public retrieveLogTask = {
      insertSuccess$: jest.fn().mockReturnValue(of(null)),
      insertFail$: jest.fn().mockReturnValue(of(null)),
    };
  }

  class MqttPublishServiceMock {
    public releaseRetain$ = jest.fn().mockReturnValue(of(null));
  }

  class ZipLogServiceMock {
    public zip$ = jest.fn().mockReturnValue(of(""));
  }

  beforeEach(async () => {
    jest.restoreAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetrieveLogController],
      providers: [
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: FtpClientService, useClass: FtpClientServiceMock },
        { provide: IbmCosService, useClass: IbmCosServiceMock },
        { provide: GuardMqttMessage, useClass: GuardMqttMessageMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: BridgeEventListService, useClass: BridgeEventListServiceMock },
        { provide: MqttPublishService, useClass: MqttPublishServiceMock },
        { provide: ZipLogService, useClass: ZipLogServiceMock },
      ],
    }).compile();

    controller = module.get<RetrieveLogController>(RetrieveLogController);
    tasksService = module.get<TasksService>(TasksService);
    ftpClientService = module.get<FtpClientService>(FtpClientService);
    ibmCosService = module.get<IbmCosService>(IbmCosService);
    guardMqttMessage = module.get(GuardMqttMessage);
    configService = module.get(ConfigService);
    loggerService = module.get(LoggerService);
    httpClientService = module.get(HttpClientService);
    assetStatusService = module.get(AssetStatusService);
    bridgeEventListService = module.get(BridgeEventListService);
    mqttPublishService = module.get(MqttPublishService);
    zipLogService = module.get(ZipLogService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(tasksService).toBeDefined();
    expect(guardMqttMessage).toBeDefined();
    expect(configService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(httpClientService).toBeDefined();
    expect(assetStatusService).toBeDefined();
    expect(mqttPublishService).toBeDefined();
    expect(zipLogService).toBeDefined();
  });

  describe(RetrieveLogController.prototype.handleRetrieveLog$.name, () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        const arg = {
          type: EMessageType.Response,
          name: EMessageName.RetrieveLog,
          version: 123,
          sender: "sender",
          assetMetaData: {
            typeId: "type id",
            assetId: "asset id",
            messageId: "message id",
            sessionId: "session id",
          },
          detail: {},
          result: EResult.Succeed,
          errorCode: "error code",
          errorMsg: "error msg",
        } as MqttResponsePayload<any>;
        const ctx = { getTopic: jest.fn(() => "receive topic") } as any;

        jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
        jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
        jest.spyOn(externals, "random").mockReturnValue(0);
        jest.spyOn(mqttPublishService, "releaseRetain$").mockReturnValue(of({} as any));
        jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
        jest.spyOn(tasksService, "insertRetrievelog$").mockReturnValue(of(null));
        const info = {
          asset: {
            taskId: "task id",
          },
          results: {},
        };
        jest.spyOn(controller, "checkProgressOfEachAsset$").mockReturnValue(of(info as any));
        jest.spyOn(controller, "uploadLogFileToCos$").mockReturnValue(of(null));
        const result = {
          asset: {
            taskId: "task id",
          },
        };
        jest.spyOn(controller, "updateLogTaskAssetStatus$").mockReturnValue(of(result));
        jest.spyOn(controller, "updateLogTaskStatus$").mockReturnValue(of(null));

        // act
        const actual$ = controller.handleRetrieveLog$(arg as any, ctx).toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should call releaseRetain$": {
          assert: (p$: Promise<any>) => {
            return p$
              .then(() => {
                expect(mqttPublishService.releaseRetain$).toHaveBeenCalledWith("receive topic");
              })
              .catch((e) => fail(e));
          },
        },
        "should call closeSession$": {
          assert: (p$: Promise<any>) => {
            return p$
              .then(() => {
                expect(controller.closeSession$).toHaveBeenCalledWith("session id");
              })
              .catch((e) => fail(e));
          },
        },
        "should call insertRetrievelog$": {
          assert: (p$: Promise<any>) => {
            return p$
              .then(() => {
                const expected = {
                  taskId: "message id",
                  typeId: "type id",
                  assetId: "asset id",
                  status: EResult.Succeed,
                  errorCode: "error code",
                  errorMsg: "error msg",
                };
                expect(tasksService.insertRetrievelog$).toHaveBeenCalledWith(expected);
              })
              .catch((e) => fail(e));
          },
        },
        "should call checkProgressOfEachAsset$": {
          assert: (p$: Promise<any>) => {
            return p$
              .then(() => {
                const expected = {
                  taskId: "message id",
                  typeId: "type id",
                  assetId: "asset id",
                };
                expect(controller.checkProgressOfEachAsset$).toHaveBeenCalledWith(expected);
              })
              .catch((e) => fail(e));
          },
        },
        "should call uploadLogFileToCos$": {
          assert: (p$: Promise<any>) => {
            return p$
              .then(() => {
                expect(controller.uploadLogFileToCos$).toHaveBeenCalledWith({ taskId: "task id" }, {});
              })
              .catch((e) => fail(e));
          },
        },
        "should call updateLogTaskAssetStatus$": {
          assert: (p$: Promise<any>) => {
            return p$
              .then(() => {
                expect(controller.updateLogTaskAssetStatus$).toHaveBeenCalledWith({ taskId: "task id" }, {});
              })
              .catch((e) => fail(e));
          },
        },
        "should call updateLogTaskStatus$": {
          assert: (p$: Promise<any>) => {
            return p$
              .then(() => {
                expect(controller.updateLogTaskStatus$).toHaveBeenCalledWith("task id");
              })
              .catch((e) => fail(e));
          },
        },
        "should return null": {
          assert: (p$: Promise<any>) => {
            return p$.then((data) => expect(data).toEqual(null)).catch((e) => fail(e));
          },
        },
      },
    );

    it("should change task-asset-status to Error when fail to upload log-file", () => {
      // arrange
      const arg = {
        type: EMessageType.Response,
        name: EMessageName.RetrieveLog,
        version: 123,
        sender: "sender",
        assetMetaData: {
          typeId: "type id",
          assetId: "asset id",
          messageId: "message id",
        },
        detail: {},
        result: EResult.Succeed,
      } as MqttResponsePayload<any>;
      const ctx = { getTopic: jest.fn(() => "receive topic") } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest.spyOn(externals, "random").mockReturnValue(0);
      jest.spyOn(mqttPublishService, "releaseRetain$").mockReturnValue(of({} as any));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "insertRetrievelog$").mockReturnValue(of(null));
      const info = {
        asset: {},
        results: {},
      };
      jest.spyOn(controller, "checkProgressOfEachAsset$").mockReturnValue(of(info as any));
      jest.spyOn(controller, "uploadLogFileToCos$").mockReturnValue(throwError(new Error("test error")));
      const result = {
        asset: {
          taskId: "task id",
        },
      };
      jest.spyOn(controller, "updateLogTaskAssetStatus$").mockReturnValue(of(result));
      jest.spyOn(controller, "updateLogTaskStatus$").mockReturnValue(of(null));

      // act
      const actual$ = controller.handleRetrieveLog$(arg as any, ctx).toPromise();
      return actual$
        .then(() => {
          const expected = {
            assets: {},
            results: {},
            status: ETaskAssetStatus.SystemError,
          };
          expect(controller.updateLogTaskAssetStatus$).toHaveBeenCalledWith(expected.assets, expected.results, expected.status);
        })
        .catch((e) => fail(e));
    });

    it("should throw error when fail to update log-task-status", () => {
      // arrange
      const arg = {
        type: EMessageType.Response,
        name: EMessageName.RetrieveLog,
        version: 123,
        sender: "sender",
        assetMetaData: {
          typeId: "type id",
          assetId: "asset id",
          messageId: "message id",
        },
        detail: {},
        result: EResult.Succeed,
      } as MqttResponsePayload<any>;
      const ctx = { getTopic: jest.fn(() => "receive topic") } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest.spyOn(externals, "random").mockReturnValue(0);
      jest.spyOn(mqttPublishService, "releaseRetain$").mockReturnValue(of({} as any));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "insertRetrievelog$").mockReturnValue(of(null));
      const info = {
        asset: {},
        results: {},
      };
      jest.spyOn(controller, "checkProgressOfEachAsset$").mockReturnValue(of(info as any));
      jest.spyOn(controller, "uploadLogFileToCos$").mockReturnValue(of(null));
      const result = {
        asset: {
          taskId: "task id",
        },
      };
      jest.spyOn(controller, "updateLogTaskAssetStatus$").mockReturnValue(of(result));
      jest.spyOn(controller, "updateLogTaskStatus$").mockReturnValue(throwError(new Error("test error")));

      // act
      const actual$ = controller.handleRetrieveLog$(arg as any, ctx).toPromise();
      return actual$
        .then(() => fail())
        .catch((e) => {
          expect(e).toEqual(new Error("test error"));
        });
    });

    it(`should end process when payload is nothing`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(false);
      const arg = "" as any;
      const ctx = { getTopic: jest.fn() } as any;

      // assert
      return controller
        .handleRetrieveLog$(arg, ctx)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it(`should end process when illegal MQTT message`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(false);
      const arg = {};
      const ctx = { getTopic: jest.fn() } as any;

      // assert
      return controller
        .handleRetrieveLog$(arg, ctx)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it(`should end process when illegal MQTT response`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(false);
      const arg = {};
      const ctx = { getTopic: jest.fn() } as any;

      // assert
      return controller
        .handleRetrieveLog$(arg, ctx)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.insertRetrievelog$).not.toHaveBeenCalled();
          expect(tasksService.updateLogTaskAsset$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });
  });

  describe(RetrieveLogController.prototype.checkProgressOfEachAsset$.name, () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        const params = {
          targetAsset: {
            taskId: "target task id",
            typeId: "target type id",
            assetId: "target asset id",
          } as TaskAssetKey,
        };

        const ownerAssetKey = {
          typeId: "owner type id",
          assetId: "owner asset id",
        };
        jest.spyOn(assetStatusService, "getOwnerOrThis$").mockReturnValue(of(ownerAssetKey));
        const ownerAssetStatus = {
          subAssets: [
            { typeId: "type id 01", assetId: "asset id 01" },
            { typeId: "type id 02", assetId: "asset id 02" },
          ],
        } as AssetStatus;
        jest.spyOn(assetStatusService, "get$").mockReturnValue(of(ownerAssetStatus));
        const results = [
          { typeId: "type id 01", assetId: "asset id 01" },
          { typeId: "type id 02", assetId: "asset id 02" },
        ] as RetrieveLogResultRecord[];
        jest.spyOn(tasksService, "bulkGetRetrieveLogResults$").mockReturnValue(of(results));

        // act
        const actual$ = controller.checkProgressOfEachAsset$(params.targetAsset).toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should call getOwnerOrThis$": {
          assert: (p$: Promise<{ asset: TaskAssetKey; results: RetrieveLogResultRecord[] }>) => {
            const expected = {
              taskId: "target task id",
              typeId: "target type id",
              assetId: "target asset id",
            };
            return p$
              .then(() => {
                expect(assetStatusService.getOwnerOrThis$).toHaveBeenCalledWith(expected);
              })
              .catch((e) => fail(e));
          },
        },
        "should call get$": {
          assert: (p$: Promise<{ asset: TaskAssetKey; results: RetrieveLogResultRecord[] }>) => {
            const expected = {
              typeId: "owner type id",
              assetId: "owner asset id",
            };
            return p$
              .then(() => {
                expect(assetStatusService.get$).toHaveBeenCalledWith(expected);
              })
              .catch((e) => fail(e));
          },
        },
        "should call bulkGetRetrieveLogResults$": {
          assert: (p$: Promise<{ asset: TaskAssetKey; results: RetrieveLogResultRecord[] }>) => {
            const expected = [
              { taskId: "target task id", assetId: "asset id 01", typeId: "type id 01" },
              { taskId: "target task id", assetId: "asset id 02", typeId: "type id 02" },
            ];
            return p$
              .then(() => {
                expect(tasksService.bulkGetRetrieveLogResults$).toHaveBeenCalledWith(expected);
              })
              .catch((e) => fail(e));
          },
        },
        "should return data": {
          assert: (p$: Promise<{ asset: TaskAssetKey; results: RetrieveLogResultRecord[] }>) => {
            const expected = {
              asset: {
                taskId: "target task id",
                typeId: "owner type id",
                assetId: "owner asset id",
              },
              results: [
                { typeId: "type id 01", assetId: "asset id 01" },
                { typeId: "type id 02", assetId: "asset id 02" },
              ],
            };
            return p$.then((data) => expect(data).toEqual(expected)).catch((e) => fail(e));
          },
        },
      },
    );

    cases(
      " when target-asset doesn't have subAssets",
      (_, c) => {
        // arrange
        const params = {
          targetAsset: {
            taskId: "target task id",
            typeId: "target type id",
            assetId: "target asset id",
          } as TaskAssetKey,
        };

        const ownerAssetKey = {
          typeId: "owner type id 01",
          assetId: "owner asset id 01",
        };
        jest.spyOn(assetStatusService, "getOwnerOrThis$").mockReturnValue(of(ownerAssetKey));
        const ownerAssetStatus = {
          typeId: "owner type id 02",
          assetId: "owner asset id 02",
          subAssets: [] as AssetStatus[],
        } as AssetStatus;
        jest.spyOn(assetStatusService, "get$").mockReturnValue(of(ownerAssetStatus));
        const results = [{ typeId: "owner type id 02", assetId: "owner asset id 02" }] as RetrieveLogResultRecord[];
        jest.spyOn(tasksService, "bulkGetRetrieveLogResults$").mockReturnValue(of(results));

        // act
        const actual$ = controller.checkProgressOfEachAsset$(params.targetAsset).toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should call bulkGetRetrieveLogResults$": {
          assert: (p$: Promise<{ asset: TaskAssetKey; results: RetrieveLogResultRecord[] }>) => {
            const expected = [{ taskId: "target task id", typeId: "owner type id 02", assetId: "owner asset id 02" }];
            return p$
              .then(() => {
                expect(tasksService.bulkGetRetrieveLogResults$).toHaveBeenCalledWith(expected);
              })
              .catch((e) => fail(e));
          },
        },
        "should return data": {
          assert: (p$: Promise<{ asset: TaskAssetKey; results: RetrieveLogResultRecord[] }>) => {
            const expected = {
              asset: {
                taskId: "target task id",
                typeId: "owner type id 01",
                assetId: "owner asset id 01",
              },
              results: [{ typeId: "owner type id 02", assetId: "owner asset id 02" }],
            };
            return p$.then((data) => expect(data).toEqual(expected)).catch((e) => fail(e));
          },
        },
      },
    );

    it("should filter when reults.length isn't equal count of subAssets", () => {
      // arrange
      const params = {
        targetAsset: {
          taskId: "target task id",
          typeId: "target type id",
          assetId: "target asset id",
        } as TaskAssetKey,
      };

      const ownerAssetKey = {
        typeId: "owner type id",
        assetId: "owner asset id",
      };
      jest.spyOn(assetStatusService, "getOwnerOrThis$").mockReturnValue(of(ownerAssetKey));
      const ownerAssetStatus = {
        subAssets: [
          { typeId: "type id 01", assetId: "asset id 01" },
          { typeId: "type id 02", assetId: "asset id 02" },
        ],
      } as AssetStatus;
      jest.spyOn(assetStatusService, "get$").mockReturnValue(of(ownerAssetStatus));
      const results = [{ typeId: "type id 01", assetId: "asset id 01" }] as RetrieveLogResultRecord[];
      jest.spyOn(tasksService, "bulkGetRetrieveLogResults$").mockReturnValue(of(results));

      // act
      const actual$ = controller.checkProgressOfEachAsset$(params.targetAsset).toPromise();

      // assert
      return actual$
        .then((data) => {
          expect(data).toEqual(undefined);
        })
        .catch((e) => fail(e));
    });

    it("should throw error when happend error", () => {
      // arrange
      const params = {
        targetAsset: {
          taskId: "target task id",
          typeId: "target type id",
          assetId: "target asset id",
        } as TaskAssetKey,
      };

      jest.spyOn(assetStatusService, "getOwnerOrThis$").mockReturnValue(throwError(new Error("test error")));

      // act
      const actual$ = controller.checkProgressOfEachAsset$(params.targetAsset).toPromise();

      // assert
      return actual$
        .then(() => fail())
        .catch((e) => {
          expect(e).toEqual(new Error("test error"));
        });
    });
  });

  describe(RetrieveLogController.prototype.updateLogTaskAssetStatus$.name, () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        const params = {
          asset: {
            taskId: "task id",
            typeId: "type id",
            assetId: "asset id",
          } as TaskAssetKey,
          results: [{ status: ERetrieveLogsStatus.Succeed }, { status: ERetrieveLogsStatus.Succeed }] as RetrieveLogResultRecord[],
          assetStatus: ETaskAssetStatus.Complete,
        };

        jest.spyOn(tasksService, "updateLogTaskAsset$").mockReturnValue(of(null));

        // act
        const actual$ = controller.updateLogTaskAssetStatus$(params.asset, params.results, params.assetStatus).toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should change task-asset-status to Complete": {
          assert: (p$: Promise<null>) => {
            const expected = {
              taskId: "task id",
              typeId: "type id",
              assetId: "asset id",
              status: ETaskAssetStatus.Complete,
            };
            return p$.then(() => expect(tasksService.updateLogTaskAsset$).toHaveBeenCalledWith(expected)).catch((e) => fail(e));
          },
        },
        "should return null": {
          assert: (p$: Promise<null>) => {
            return p$.then((data) => expect(data).toEqual(null)).catch((e) => fail(e));
          },
        },
      },
    );

    it("should change task-asset-status to DeviceError", () => {
      // arrange
      const params = {
        asset: {
          taskId: "task id",
          typeId: "type id",
          assetId: "asset id",
        } as TaskAssetKey,
        results: [{ status: ERetrieveLogsStatus.Error }, { status: ERetrieveLogsStatus.Error }] as RetrieveLogResultRecord[],
        assetStatus: ETaskAssetStatus.Complete,
      };

      jest.spyOn(tasksService, "updateLogTaskAsset$").mockReturnValue(of(null));

      // act
      const actual$ = controller.updateLogTaskAssetStatus$(params.asset, params.results, params.assetStatus).toPromise();

      // assert
      const expected = {
        taskId: "task id",
        typeId: "type id",
        assetId: "asset id",
        status: ETaskAssetStatus.DeviceError,
      };
      return actual$.then(() => expect(tasksService.updateLogTaskAsset$).toHaveBeenCalledWith(expected)).catch((e) => fail(e));
    });
  });

  describe(RetrieveLogController.prototype.updateLogTaskStatus$.name, () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        const params = {
          taskId: "task id",
        };

        const logTask = {
          status: ETaskStatus.InProgress,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.ConnectionError }] as LogTaskAsset[],
        } as LogTask;
        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(logTask));
        jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(of(null));

        // act
        const actual$ = controller.updateLogTaskStatus$(params.taskId).toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should call getLogTask$": {
          assert: (p$: Promise<null>) => {
            return p$.then(() => expect(tasksService.getLogTask$).toHaveBeenCalledWith("task id")).catch((e) => fail(e));
          },
        },
        "should call updateLogTask$": {
          assert: (p$: Promise<null>) => {
            const expected = {
              taskId: "task id",
              status: ETaskStatus.Failure,
            };
            return p$.then(() => expect(tasksService.updateLogTask$).toHaveBeenCalledWith(expected)).catch((e) => fail(e));
          },
        },
        "should return null": {
          assert: (p$: Promise<null>) => {
            return p$.then((data) => expect(data).toEqual(null)).catch((e) => fail(e));
          },
        },
      },
    );

    it("should not change task-status when a task-status is not InProgress", () => {
      // arrange
      const params = {
        taskId: "task id",
      };

      const logTask = {
        status: ETaskStatus.Complete,
        assets: [{ status: ETaskAssetStatus.Complete }] as LogTaskAsset[],
      } as LogTask;
      jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(logTask));
      jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(of(null));

      // act
      const actual$ = controller.updateLogTaskStatus$(params.taskId).toPromise();

      // assert
      return actual$
        .then(() => {
          expect(tasksService.updateLogTask$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it("should not change task-status when some asset-status is InProgress", () => {
      // arrange
      const params = {
        taskId: "task id",
      };

      const logTask = {
        status: ETaskStatus.InProgress,
        assets: [
          { status: ETaskAssetStatus.Complete },
          { status: ETaskAssetStatus.InProgress },
          { status: ETaskAssetStatus.Complete },
        ] as LogTaskAsset[],
      } as LogTask;
      jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(logTask));
      jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(of(null));

      // act
      const actual$ = controller.updateLogTaskStatus$(params.taskId).toPromise();

      // assert
      return actual$
        .then(() => {
          expect(tasksService.updateLogTask$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it("should return null when fail to update task-status", () => {
      // arrange
      const params = {
        taskId: "task id",
      };

      const logTask = {
        status: ETaskStatus.InProgress,
        assets: [{ status: ETaskAssetStatus.Complete }] as LogTaskAsset[],
      } as LogTask;
      jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(logTask));
      jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(throwError(new Error("test error")));

      // act
      const actual$ = controller.updateLogTaskStatus$(params.taskId).toPromise();

      // assert
      return actual$
        .then((data) => {
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });
  });

  describe(RetrieveLogController.prototype.uploadLogFileToCos$.name, () => {
    const template = {
      asset: {
        taskId: "task id",
        typeId: "type id",
        assetId: "asset id",
      } as TaskAssetKey,
      results: [
        {
          taskId: "task id 01",
          typeId: "type id 01",
          assetId: "asset id 01",
          id: 123,
          ftpFilePath: "ftp/file/path/01",
          status: ERetrieveLogsStatus.Succeed,
          createdAt: "created at 01",
        },
        {
          taskId: "task id 02",
          typeId: "type id 02",
          assetId: "asset id 02",
          id: 456,
          ftpFilePath: "ftp\\file\\path\\02",
          status: ERetrieveLogsStatus.Error,
          createdAt: "created at 02",
        },
      ],
    };

    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        const params = {
          asset: template.asset,
          results: template.results,
        };

        const persistentVolumeConfig = {
          validatePackageTmpDir: "validate package tmp dir",
        } as PersistentVolumeConfig;
        jest.spyOn(configService, "persistentVolumeConfig").mockReturnValue(persistentVolumeConfig);
        jest.spyOn(externals, "mkdir$").mockReturnValue(of(null) as any);
        jest.spyOn(controller, "archiveAssetLogs$").mockReturnValue(of("archive file path"));
        const objectStorageConfig = {
          assetLogsPrefix: "asset logs prefix",
        } as ObjectStorageConfig;
        jest.spyOn(configService, "objectStorageConfig").mockReturnValue(objectStorageConfig);
        jest.spyOn(tasksService, "toTaskLogCosKey").mockReturnValue("cos key");
        jest.spyOn(controller, "upload$").mockReturnValue(of("upload result"));

        // act
        const actual$ = controller.uploadLogFileToCos$(params.asset, params.results).toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should call archiveAssetLogs$": {
          assert: (p$: Promise<null>) => {
            const expected = {
              workDir: path.join("validate package tmp dir", "retrievelog", "task id_type id_asset id"),
              asset: template.asset,
              results: template.results,
            };
            return p$
              .then(() => expect(controller.archiveAssetLogs$).toHaveBeenCalledWith(expected.workDir, expected.asset, expected.results))
              .catch((e) => fail(e));
          },
        },
        "should call upload$": {
          assert: (p$: Promise<null>) => {
            const expected = {
              archiveFilePath: "archive file path",
              cosKey: "cos key",
            };
            return p$
              .then(() => expect(controller.upload$).toHaveBeenCalledWith(expected.archiveFilePath, expected.cosKey))
              .catch((e) => fail(e));
          },
        },
        "should return null": {
          assert: (p$: Promise<null>) => {
            return p$.then((data) => expect(data).toEqual(null)).catch((e) => fail(e));
          },
        },
      },
    );

    cases(
      "illegal pattern",
      (_, c) => {
        // arrange
        const params = {
          asset: template.asset,
          results: template.results,
        };

        const persistentVolumeConfig = {
          validatePackageTmpDir: "validate package tmp dir",
        } as PersistentVolumeConfig;
        jest.spyOn(configService, "persistentVolumeConfig").mockReturnValue(persistentVolumeConfig);
        jest.spyOn(externals, "mkdir$").mockReturnValue(throwError(new Error("test error")) as any);
        jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(of(null));

        // act
        const actual$ = controller.uploadLogFileToCos$(params.asset, params.results).toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should call updateLogTask$": {
          assert: (p$: Promise<null>) => {
            const expected = {
              taskId: "task id",
              status: ETaskStatus.Failure,
            };
            return p$
              .then(() => {
                expect(tasksService.updateLogTask$).toHaveBeenCalledWith(expected);
              })
              .catch(() => fail());
          },
        },
        "should return null": {
          assert: (p$: Promise<null>) => {
            return p$.then((data) => expect(data).toEqual(null)).catch((e) => fail(e));
          },
        },
      },
    );

    it("should return error when fail to updateLogTask status", () => {
      // arrange
      const params = {
        asset: template.asset,
        results: template.results,
      };

      const persistentVolumeConfig = {
        validatePackageTmpDir: "validate package tmp dir",
      } as PersistentVolumeConfig;
      jest.spyOn(configService, "persistentVolumeConfig").mockReturnValue(persistentVolumeConfig);
      jest.spyOn(externals, "mkdir$").mockReturnValue(throwError(new Error("test error 01")) as any);
      jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(throwError(new Error("test error 02")));

      // act
      const actual$ = controller.uploadLogFileToCos$(params.asset, params.results).toPromise();
      // assert
      return actual$
        .then(() => fail())
        .catch((e) => {
          const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Failed to upload log file to cos", new Error("test error 01"));
          expect(e).toEqual(expected);
        });
    });
  });

  describe(RetrieveLogController.prototype.archiveAssetLogs$.name, () => {
    it("should call zipLogService.zip$", () => {
      // arrange
      const params = {
        workDir: "work dir",
        asset: {
          taskId: "task id",
          typeId: "type id",
          assetId: "asset id",
        } as TaskAssetKey,
        results: [
          {
            taskId: "task id 01",
            typeId: "type id 01",
            assetId: "asset id 01",
            id: 123,
            ftpFilePath: "ftp/file/path/01",
            status: ERetrieveLogsStatus.Succeed,
            createdAt: "created at 01",
          },
          {
            taskId: "task id 02",
            typeId: "type id 02",
            assetId: "asset id 02",
            id: 456,
            ftpFilePath: "ftp\\file\\path\\02",
            status: ERetrieveLogsStatus.Error,
            createdAt: "created at 02",
          },
          {
            taskId: "task id 03",
            typeId: "type id 03",
            assetId: "asset id 03",
            id: 456,
            ftpFilePath: "ftp\\file\\path\\03",
            status: ERetrieveLogsStatus.Succeed,
            createdAt: "created at 03",
          },
        ] as RetrieveLogResultRecord[],
      };

      jest.spyOn(ftpClientService, "convertUrlToFTPKey").mockReturnValue("ftp key");
      jest.spyOn(ftpClientService, "getObjectStream$").mockReturnValue(of({} as any));
      jest.spyOn(ftpClientService, "saveStreamInFile$").mockReturnValue(of(null));
      jest.spyOn(zipLogService, "zip$").mockReturnValue(of("zip result"));

      const expected = {
        dstDir: "work dir",
        dstFileName: "tmp.zip",
        asset: {
          typeId: "type id",
          assetId: "asset id",
        },
        retrieveLogInfo: [
          {
            typeId: "type id 01",
            assetId: "asset id 01",
            status: "Succeed",
            filePath: path.join("work dir", "ftp key"),
          },
          {
            typeId: "type id 02",
            assetId: "asset id 02",
            status: "Error",
            filePath: "",
          },
          {
            typeId: "type id 03",
            assetId: "asset id 03",
            status: "Succeed",
            filePath: path.join("work dir", "ftp key"),
          },
        ],
      };

      // act
      const actual$ = controller.archiveAssetLogs$(params.workDir, params.asset, params.results).toPromise();
      return actual$
        .then((data) => {
          // assert
          expect(zipLogService.zip$).toHaveBeenCalledWith(expected);
          expect(data).toEqual("zip result");
        })
        .catch((e) => fail(e));
    });

    it("should throw error when returned exception", () => {
      // arrange
      const params = {
        workDir: "work dir",
        asset: {
          taskId: "task id",
          typeId: "type id",
          assetId: "asset id",
        } as TaskAssetKey,
        results: [
          {
            taskId: "task id 01",
            typeId: "type id 01",
            assetId: "asset id 01",
            id: 123,
            ftpFilePath: "ftp/file/path/01",
            status: ERetrieveLogsStatus.Succeed,
            createdAt: "created at 01",
          },
          {
            taskId: "task id 02",
            typeId: "type id 02",
            assetId: "asset id 02",
            id: 456,
            ftpFilePath: "ftp\\file\\path\\02",
            status: ERetrieveLogsStatus.Error,
            createdAt: "created at 02",
          },
          {
            taskId: "task id 03",
            typeId: "type id 03",
            assetId: "asset id 03",
            id: 456,
            ftpFilePath: "ftp\\file\\path\\03",
            status: ERetrieveLogsStatus.Succeed,
            createdAt: "created at 03",
          },
        ] as RetrieveLogResultRecord[],
      };

      const error = new Error("test error");
      jest.spyOn(ftpClientService, "convertUrlToFTPKey").mockImplementation(() => {
        throw error;
      });

      // act
      const actual$ = controller.archiveAssetLogs$(params.workDir, params.asset, params.results).toPromise();
      return actual$
        .then(() => fail())
        .catch((e) => {
          // assert
          expect(zipLogService.zip$).not.toHaveBeenCalled();
          expect(e).toEqual(error);
        });
    });
  });

  describe(RetrieveLogController.prototype.upload$.name, () => {
    it("should catch error event of stream", () => {
      // arrange
      const params = {
        file: "params file",
        cosKey: "params cosKey",
      };

      const readStreamMock = {
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
      jest.spyOn(externals, "createReadStream").mockReturnValue(readStreamMock as any);
      ibmCosService.putObject$ = jest.fn(() => of({}).pipe(delay(4000)));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Failed to ");

      // act
      return controller
        .upload$(params.file, params.cosKey)
        .toPromise()
        .then(() => {
          fail();
        })
        .catch((e) => {
          // assert
          expect(e).toEqual(expected);
        });
    });

    it("should return cos key when succeeded to upload", () => {
      // arrange
      const params = {
        file: "params file",
        cosKey: "params cosKey",
      };

      const readStreamMock = {};
      jest.spyOn(externals, "createReadStream").mockReturnValue(readStreamMock as any);
      ibmCosService.putObject$ = jest.fn(() => of({}));

      const expected = "params cosKey";

      // act
      return controller
        .upload$(params.file, params.cosKey)
        .toPromise()
        .then((actual) => {
          // assert
          expect(externals.createReadStream).toHaveBeenCalledWith(params.file);
          expect(ibmCosService.putObject$).toHaveBeenCalledWith(params.cosKey, readStreamMock);
          expect(actual).toEqual(expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(RetrieveLogController.prototype.closeSession$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        jest.spyOn(httpClientService, "delete$").mockReturnValue(of(null as any));
        arg = "argument session id";
        expected = {
          delete: {
            endpoint: `http://localhost:1234/session-manager/sessions/argument session id`,
            config: {},
          },
          data: null,
        };
        // act
        act = controller.closeSession$(arg).toPromise();
      });
      // assert
      it("should call appConfig$", () => {
        return act.then(() => expect(configService.appConfig).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call delete$", () => {
        return act
          .then(() => expect(httpClientService.delete$).toHaveBeenCalledWith(expected.delete.endpoint, expected.delete.config))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when argument is invalid value", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        arg = "";
        expected = null;
        // act
        act = controller.closeSession$(arg).toPromise();
      });
      // assert
      it("should not call all function", () => {
        return act
          .then(() => {
            expect(configService.appConfig).not.toHaveBeenCalled();
            expect(httpClientService.delete$).not.toHaveBeenCalled();
          })
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected)).catch((e: any) => fail(e));
      });
    });

    describe("when returned exception from a service", () => {
      let arg: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(httpClientService, "delete$").mockReturnValue(throwError(error));
        arg = "argument session id";
        // act
        act = controller.closeSession$(arg).toPromise();
      });
      // assert
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(null)).catch((e: any) => fail(e));
      });
    });
  });

  describe(RetrieveLogController.prototype.saveEventLog$.name, () => {
    beforeEach(() => {
      jest.spyOn(tasksService, "getLogTask$").mockReturnValue(empty());
      jest.spyOn(bridgeEventListService.retrieveLogTask, "insertSuccess$").mockReturnValue(of(null));
      jest.spyOn(bridgeEventListService.retrieveLogTask, "insertFail$").mockReturnValue(of(null));
    });

    it("should call taskService.getTask$ with expected params", () => {
      // arrange
      const params: UpdateLogTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.Complete,
      };
      const expected = params.taskId;

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(tasksService.getLogTask$).toHaveBeenCalledWith(expected))
        .catch(fail);
    });

    it("should call insertSuccess$ with expected params", () => {
      // arrange
      const params: UpdateLogTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.Complete,
      };
      const task = {
        logType: "log type des",
      };
      const expected = {
        taskId: params.taskId,
        typeId: params.typeId,
        assetId: params.assetId,
        logType: task.logType,
      };

      jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task as any));

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(bridgeEventListService.retrieveLogTask.insertSuccess$).toHaveBeenCalledWith(expected))
        .catch(fail);
    });

    it.each([
      [ETaskAssetStatus.ConnectionError, ETaskErrorResult.ConnectionError],
      [ETaskAssetStatus.SystemError, ETaskErrorResult.SystemError],
      [ETaskAssetStatus.DeviceError, ETaskErrorResult.DeviceError],
    ] as [ETaskAssetStatus, ETaskErrorResult][])(
      "should call insertFail$ with ETaskErrorResult.%s when status is ETaskAssetStatus.%s",
      (status, errorResult) => {
        // arrange
        const params: UpdateLogTaskAsset = {
          taskId: "task des",
          typeId: "type des",
          assetId: "asset des",
          status,
        };
        const task = {
          logType: "log type des",
        };
        const expected = {
          taskId: params.taskId,
          typeId: params.typeId,
          assetId: params.assetId,
          logType: task.logType,
          errorResult,
        };

        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task as any));

        // act
        const p$ = controller.saveEventLog$(params).toPromise();

        // assert
        return p$ //
          .then(() => expect(bridgeEventListService.retrieveLogTask.insertFail$).toHaveBeenCalledWith(expected))
          .catch(fail);
      },
    );

    it("should return null immediately if status is unhandled", () => {
      // arrange
      const params: UpdateLogTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.InProgress,
      };

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(tasksService.getLogTask$).not.toHaveBeenCalled())
        .catch(fail);
    });

    it("should write error log and complete normally if error occurs", () => {
      // arrange
      const params: UpdateLogTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.Complete,
      };

      jest.spyOn(tasksService, "getLogTask$").mockReturnValue(throwError(new Error("error desu")));

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(loggerService.error).toHaveBeenCalled())
        .catch(fail);
    });
  });
});
