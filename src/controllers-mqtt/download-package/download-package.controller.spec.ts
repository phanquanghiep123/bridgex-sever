import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError, empty } from "rxjs";

import { DownloadPackageController } from "./download-package.controller";
import { TasksService, ETaskAssetStatus, DownloadPackageTask, ETaskStatus, UpdateDownloadPackageTaskAsset } from "../../service/tasks";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { ConfigService } from "../../service/config";
import { LoggerService } from "../../service/logger";
import { HttpClientService } from "../../service/http-client";
import { EResult } from "../mqtt-message.i";
import { AppConfig } from "../../environment/app";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { AssetStatusService } from "../../service/asset-status";
import { BridgeEventListService, ETaskErrorResult } from "../../service/event-list";
import { MqttPublishService } from "../../service/mqtt-publish";
import { MqttContext } from "@nestjs/microservices";

describe(DownloadPackageController.name, () => {
  let controller: DownloadPackageController;
  let tasksService: TasksService;
  let guardMqttMessage: GuardMqttMessage;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;
  let mqttPublishService: MqttPublishService;

  class TasksServiceMock {
    public updateDownloadPackageTaskAsset$ = jest.fn().mockReturnValue(empty());
    public getDownloadPackageTask$ = jest.fn().mockReturnValue(empty());
    public updateDownloadPackageTask$ = jest.fn().mockReturnValue(empty());
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
    public appConfig = jest.fn(() => ({
      port: 3000,
    }));
  }

  class HttpClientServiceMock {
    public delete$ = jest.fn().mockReturnValue(empty());
  }

  class AssetStatusServiceMock {
    public getOwnerOrThis$ = jest.fn().mockReturnValue(empty());
  }

  class BridgeEventListServiceMock {
    public downloadPackageTask = {
      insertSuccess$: jest.fn().mockReturnValue(of(null)),
      insertFail$: jest.fn().mockReturnValue(of(null)),
    };
    public installTask = {
      insertSuccess$: jest.fn().mockReturnValue(of(null)),
      insertFail$: jest.fn().mockReturnValue(of(null)),
    };
  }

  class MqttPublishServiceMock {
    public releaseRetain$ = jest.fn().mockReturnValue(of(null));
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DownloadPackageController],
      providers: [
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: GuardMqttMessage, useClass: GuardMqttMessageMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: BridgeEventListService, useClass: BridgeEventListServiceMock },
        { provide: MqttPublishService, useClass: MqttPublishServiceMock },
      ],
    }).compile();

    controller = module.get<DownloadPackageController>(DownloadPackageController);
    tasksService = module.get<TasksService>(TasksService);
    guardMqttMessage = module.get(GuardMqttMessage);
    configService = module.get(ConfigService);
    loggerService = module.get(LoggerService);
    httpClientService = module.get(HttpClientService);
    assetStatusService = module.get(AssetStatusService);
    bridgeEventListService = module.get(BridgeEventListService);
    mqttPublishService = module.get(MqttPublishService);
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
  });

  describe(DownloadPackageController.prototype.handleDownlaodPackage$.name, () => {
    it("should do nothing and return null when payload is undefined", () => {
      // arrange
      const payload = undefined;
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should do nothing and return null when format of payload is invalid", () => {
      // arrange
      const payload = {};
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(false);

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should do nothing and return null when format of payload is invalid", () => {
      // arrange
      const payload = {};
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(false);

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should releae retain of mqtt", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
        },
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => ({} as any)),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      mqttPublishService.releaseRetain$ = jest.fn(() => throwError({}));

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(mqttPublishService.releaseRetain$).toHaveBeenCalledWith(context.getTopic());
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should get root asset by using asset metadata", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
        },
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      assetStatusService.getOwnerOrThis$ = jest.fn(() => throwError({}));

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(assetStatusService.getOwnerOrThis$).toHaveBeenCalledWith(payload.assetMetaData);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should get task info by using messageId", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
        },
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      tasksService.getDownloadPackageTask$ = jest.fn(() => throwError({}));

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(tasksService.getDownloadPackageTask$).toHaveBeenCalledWith(payload.assetMetaData.messageId);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should return null when asset which sent mqtt message doesn't match task assets", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
        },
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        assets: [
          {
            typeId: "t",
            assetId: "a",
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(tasksService.getDownloadPackageTask$).toHaveBeenCalledWith(payload.assetMetaData.messageId);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should return null when root asset status is not InProgress", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
        },
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        assets: [
          {
            typeId: rootAsset.typeId,
            assetId: rootAsset.assetId,
            status: ETaskAssetStatus.Scheduled,
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(tasksService.getDownloadPackageTask$).toHaveBeenCalledWith(payload.assetMetaData.messageId);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should return update task status with DeviceError when asset returned error", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
        },
        result: EResult.Error,
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        id: "id",
        assets: [
          {
            typeId: rootAsset.typeId,
            assetId: rootAsset.assetId,
            status: ETaskAssetStatus.InProgress,
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      tasksService.updateDownloadPackageTaskAsset$ = jest.fn(() => throwError({}));

      const expected = {
        ...rootAsset,
        taskId: task.id,
        status: ETaskAssetStatus.DeviceError,
      };

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(tasksService.updateDownloadPackageTaskAsset$).toHaveBeenCalledWith(expected);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should return update task status with Complete when asset returned success", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
        },
        result: EResult.Succeed,
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        id: "id",
        assets: [
          {
            typeId: rootAsset.typeId,
            assetId: rootAsset.assetId,
            status: ETaskAssetStatus.InProgress,
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      tasksService.updateDownloadPackageTaskAsset$ = jest.fn(() => throwError({}));

      const expected = {
        ...rootAsset,
        taskId: task.id,
        status: ETaskAssetStatus.Complete,
      };

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(tasksService.updateDownloadPackageTaskAsset$).toHaveBeenCalledWith(expected);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should save log of DownlaodPackage task", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
        },
        result: EResult.Error,
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        id: "id",
        assets: [
          {
            typeId: rootAsset.typeId,
            assetId: rootAsset.assetId,
            status: ETaskAssetStatus.InProgress,
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      tasksService.updateDownloadPackageTaskAsset$ = jest.fn(() => of({} as any));

      controller.saveEventLog$ = jest.fn(() => throwError({}));

      const expected = {
        ...rootAsset,
        taskId: task.id,
        status: ETaskAssetStatus.DeviceError,
      };

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(controller.saveEventLog$).toHaveBeenCalledWith(expected);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should return close session", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
          sessionId: "sessionId",
        },
        result: EResult.Error,
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        id: "id",
        assets: [
          {
            typeId: rootAsset.typeId,
            assetId: rootAsset.assetId,
            status: ETaskAssetStatus.InProgress,
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      tasksService.updateDownloadPackageTaskAsset$ = jest.fn(() => of({} as any));

      controller.saveEventLog$ = jest.fn(() => of(null));

      controller.closeSession$ = jest.fn(() => throwError({}));

      const expected = payload.assetMetaData.sessionId;

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(controller.closeSession$).toHaveBeenCalledWith(expected);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should return update task status with DeviceError when asset returned error", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
          sessionId: "sessionId",
        },
        result: EResult.Error,
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        id: "id",
        assets: [
          {
            typeId: rootAsset.typeId,
            assetId: rootAsset.assetId,
            status: ETaskAssetStatus.InProgress,
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      tasksService.updateDownloadPackageTaskAsset$ = jest.fn(() => of({} as any));

      controller.saveEventLog$ = jest.fn(() => of(null));

      controller.closeSession$ = jest.fn(() => of(null));

      controller.updateDownloadPackageTaskStatus$ = jest.fn(() => throwError({}));

      const expected = task.id;

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(controller.updateDownloadPackageTaskStatus$).toHaveBeenCalledWith(expected);
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should not execute install task when download paclage task doesn't complete", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
          sessionId: "sessionId",
        },
        result: EResult.Error,
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        id: "id",
        assets: [
          {
            typeId: rootAsset.typeId,
            assetId: rootAsset.assetId,
            status: ETaskAssetStatus.InProgress,
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      tasksService.updateDownloadPackageTaskAsset$ = jest.fn(() => of({} as any));

      controller.saveEventLog$ = jest.fn(() => of(null));

      controller.closeSession$ = jest.fn(() => of(null));

      controller.updateDownloadPackageTaskStatus$ = jest.fn(() => of(null));

      controller.checkCompleted$ = jest.fn(() => empty());

      tasksService.getRelatedTaskId$ = jest.fn();

      const expected = task.id;

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(controller.checkCompleted$).toHaveBeenCalledWith(expected);
          expect(tasksService.getRelatedTaskId$).not.toHaveBeenCalled();
          expect(data).toEqual(undefined);
        })
        .catch((e) => fail(e));
    });

    it("should execute install task when download package task completes", () => {
      // arrange
      const payload = {
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
          messageId: "messageId",
          sessionId: "sessionId",
        },
        result: EResult.Error,
      };
      const context: MqttContext = {
        getTopic: jest.fn(() => of({}) as any),
      } as any;

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);

      const rootAsset = {
        typeId: "typeId",
        assetId: "assetId",
      };
      assetStatusService.getOwnerOrThis$ = jest.fn(() => of(rootAsset));

      const task: DownloadPackageTask = {
        id: "id",
        assets: [
          {
            typeId: rootAsset.typeId,
            assetId: rootAsset.assetId,
            status: ETaskAssetStatus.InProgress,
          },
        ],
      } as any;
      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task));

      tasksService.updateDownloadPackageTaskAsset$ = jest.fn(() => of({} as any));

      controller.saveEventLog$ = jest.fn(() => of(null));

      controller.closeSession$ = jest.fn(() => of(null));

      controller.updateDownloadPackageTaskStatus$ = jest.fn(() => of(null));

      controller.checkCompleted$ = jest.fn(() => of(null));

      tasksService.getRelatedTaskId$ = jest.fn(() => of("taskId"));
      controller.immediateExecuteInstallTask$ = jest.fn(() => of(null));

      // act
      return controller
        .handleDownlaodPackage$(payload as any, context)
        .toPromise()
        .then((data: any) => {
          expect(tasksService.getRelatedTaskId$).toHaveBeenCalledWith(task.id);
          expect(controller.immediateExecuteInstallTask$).toHaveBeenCalledWith("taskId");
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });
  });

  describe(DownloadPackageController.prototype.updateDownloadPackageTaskStatus$.name, () => {
    describe("when task-status is InProgress and asset-status is all Complete", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }],
        } as DownloadPackageTask;
        jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateDownloadPackageTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        expected = {
          getTask: "argumen task id",
          updateTask: {
            taskId: "argumen task id",
            status: ETaskStatus.Complete,
          },
          data: null,
        };
        // act
        act = controller.updateDownloadPackageTaskStatus$(arg).toPromise();
      });
      // assert
      it("should call getTask$", () => {
        return act
          .then(() => expect(tasksService.getDownloadPackageTask$).toHaveBeenCalledWith(expected.getTask))
          .catch((e: any) => fail(e));
      });
      it("should call updateTask$ with Complete", () => {
        return act
          .then(() => expect(tasksService.updateDownloadPackageTask$).toHaveBeenCalledWith(expected.updateTask))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when task-status isn't InProgress", () => {
      let arg: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.Complete,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }],
        } as DownloadPackageTask;
        jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateDownloadPackageTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateDownloadPackageTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateTask$", () => {
        return act.then(() => expect(tasksService.updateDownloadPackageTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
      });
    });

    describe("when task-status is InProgress and one of asset-status is InProgres", () => {
      let arg: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [
            { status: ETaskAssetStatus.Complete },
            { status: ETaskAssetStatus.InProgress },
            { status: ETaskAssetStatus.DeviceError },
          ],
        } as DownloadPackageTask;
        jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateDownloadPackageTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateDownloadPackageTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateTask$", () => {
        return act.then(() => expect(tasksService.updateDownloadPackageTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
      });
    });

    describe("when task-status is InProgress and one of asset-status is Error", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.DeviceError }, { status: ETaskAssetStatus.Complete }],
        } as DownloadPackageTask;
        jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateDownloadPackageTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        expected = {
          getTask: "argumen task id",
          updateTask: {
            taskId: "argumen task id",
            status: ETaskStatus.Failure,
          },
          data: null,
        };
        // act
        act = controller.updateDownloadPackageTaskStatus$(arg).toPromise();
      });
      // assert
      it("should call updateTask$ with Failure", () => {
        return act
          .then(() => expect(tasksService.updateDownloadPackageTask$).toHaveBeenCalledWith(expected.updateTask))
          .catch((e: any) => fail(e));
      });
    });
  });

  describe(DownloadPackageController.prototype.closeSession$.name, () => {
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
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(httpClientService, "delete$").mockReturnValue(throwError(error));
        arg = "argument session id";
        expected = {
          error,
        };
        // act
        act = controller.closeSession$(arg).toPromise();
      });
      // assert
      it("should return exception", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected.error));
      });
    });
  });

  describe(DownloadPackageController.prototype.saveEventLog$.name, () => {
    beforeEach(() => {
      jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(empty());
      jest.spyOn(bridgeEventListService.downloadPackageTask, "insertSuccess$").mockReturnValue(of(null));
      jest.spyOn(bridgeEventListService.downloadPackageTask, "insertFail$").mockReturnValue(of(null));
    });

    it("should call taskService.getTask$ with expected params", () => {
      // arrange
      const params: UpdateDownloadPackageTaskAsset = {
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
        .then(() => expect(tasksService.getDownloadPackageTask$).toHaveBeenCalledWith(expected))
        .catch(fail);
    });

    it("should call insertSuccess$ with expected params", () => {
      // arrange
      const params: UpdateDownloadPackageTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.Complete,
      };
      const task = {
        package: { name: "log type des" },
      };
      const expected = {
        taskId: params.taskId,
        typeId: params.typeId,
        assetId: params.assetId,
        packageName: task.package.name,
      };

      jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task as any));

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(bridgeEventListService.downloadPackageTask.insertSuccess$).toHaveBeenCalledWith(expected))
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
        const params: UpdateDownloadPackageTaskAsset = {
          taskId: "task des",
          typeId: "type des",
          assetId: "asset des",
          status,
        };
        const task = {
          package: { name: "log type des" },
        };
        const expected = {
          taskId: params.taskId,
          typeId: params.typeId,
          assetId: params.assetId,
          packageName: task.package.name,
          errorResult,
        };

        jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task as any));

        // act
        const p$ = controller.saveEventLog$(params).toPromise();

        // assert
        return p$ //
          .then(() => expect(bridgeEventListService.downloadPackageTask.insertFail$).toHaveBeenCalledWith(expected))
          .catch(fail);
      },
    );

    it("should return null immediately if status is unhandled", () => {
      // arrange
      const params: UpdateDownloadPackageTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.InProgress,
      };

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(tasksService.getDownloadPackageTask$).not.toHaveBeenCalled())
        .catch(fail);
    });

    it("should write error log and complete normally if error occurs", () => {
      // arrange
      const params: UpdateDownloadPackageTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.Complete,
      };

      jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(throwError(new Error("error desu")));

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(loggerService.error).toHaveBeenCalled())
        .catch(fail);
    });
  });

  describe(DownloadPackageController.prototype.checkCompleted$.name, () => {
    it("should get task info", () => {
      // arrange
      const params = "taskId";

      const error = { code: ErrorCode.NOT_FOUND };

      const expected = error;

      tasksService.getDownloadPackageTask$ = jest.fn(() => throwError(error));

      // act
      return controller
        .checkCompleted$(params)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e) => {
          expect(e.code).toEqual(expected.code);
        });
    });

    it("should return null when download package is Complete", () => {
      // arrange
      const params = "taskId";

      const task = {
        status: ETaskAssetStatus.Complete,
      };

      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task) as any);

      // act
      return controller
        .checkCompleted$(params)
        .toPromise()
        .then((data: any) => {
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should return empty when download package is not Complete", () => {
      // arrange
      const params = "taskId";

      const task = {
        status: ETaskAssetStatus.InProgress,
      };

      tasksService.getDownloadPackageTask$ = jest.fn(() => of(task) as any);

      // act
      return controller
        .checkCompleted$(params)
        .toPromise()
        .then((data: any) => expect(data).toEqual(undefined))
        .catch((e) => fail(e));
    });
  });

  describe(DownloadPackageController.prototype.immediateExecuteInstallTask$.name, () => {
    it("should http post with callbackUrl", () => {
      // arrange
      const params = "taskId";

      httpClientService.post$ = jest.fn(() => of({} as any));

      // act
      return controller
        .immediateExecuteInstallTask$(params)
        .toPromise()
        .then((data: any) => {
          expect(data).toEqual(null);
        })
        .catch((e) => fail(e));
    });

    it("should http post with callbackUrl", () => {
      // arrange
      const params = "taskId";

      httpClientService.post$ = jest.fn(() => throwError({} as any));

      // act
      return controller
        .immediateExecuteInstallTask$(params)
        .toPromise()
        .then((data: any) => {
          expect(data).toEqual(null);
          expect(loggerService.warn).toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });
  });
});
