import moment from "moment";

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError, empty } from "rxjs";

import { SelfTestController } from "./selftest.controller";
import {
  TasksService,
  ETaskStatus,
  ETaskAssetStatus,
  SelfTestTask,
  SelfTestTaskAsset,
  UpdateRebootSelfTestTaskAsset,
} from "../../service/tasks";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { ConfigService } from "../../service/config";
import { LoggerService } from "../../service/logger";
import { HttpClientService } from "../../service/http-client";
import { EResult } from "../mqtt-message.i";
import { AppConfig } from "../../environment/app";
import { BridgeXServerError } from "../../service/utils";
import { AssetStatusService, EAssetStatus } from "../../service/asset-status";
import { BridgeEventListService, ETaskErrorResult } from "../../service/event-list";
import { MqttContext } from "@nestjs/microservices";
import { MqttPublishService } from "../../service/mqtt-publish";

describe(SelfTestController.name, () => {
  let controller: SelfTestController;
  let tasksService: TasksService;
  let guardMqttMessage: GuardMqttMessage;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;
  let mqttPublishService: MqttPublishService;

  class TasksServiceMock {
    public getSelfTestTask$ = jest.fn().mockReturnValue(empty());
    public getSelfTestTaskAsset$ = jest.fn().mockReturnValue(empty());
    public updateSelfTestTaskSubAsset$ = jest.fn().mockReturnValue(empty());
    public updateSelfTestTaskAsset$ = jest.fn().mockReturnValue(empty());
    public updateSelfTestTask$ = jest.fn().mockReturnValue(empty());
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
  }

  class HttpClientServiceMock {
    public delete$ = jest.fn().mockReturnValue(empty());
  }

  class AssetStatusServiceMock {
    public getOwnerOrThis$ = jest.fn().mockReturnValue(empty());
  }

  class BridgeEventListServiceMock {
    public selfTestTask = {
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
      controllers: [SelfTestController],
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

    controller = module.get<SelfTestController>(SelfTestController);
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

  describe(SelfTestController.prototype.handleSelfTest$.name, () => {
    beforeEach(() => {
      jest.spyOn(controller, "saveEventLog$").mockReturnValue(of(null));
    });

    describe("normal pattern", () => {
      let arg: Record<string, unknown>;
      let ctx: MqttContext;
      let expected: any;
      let act: any;

      beforeEach(() => {
        // arrange
        jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
        jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
        const getSelfTestTaskAsset = {
          taskId: "r1",
          typeId: "r2",
          assetId: "r3",
          status: ETaskAssetStatus.InProgress,
        } as SelfTestTaskAsset;
        jest
          .spyOn(assetStatusService, "getOwnerOrThis$")
          .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
        jest.spyOn(tasksService, "getSelfTestTaskAsset$").mockReturnValue(of(getSelfTestTaskAsset));
        jest.spyOn(tasksService, "updateSelfTestTaskSubAsset$").mockReturnValue(of(null));
        jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
        jest.spyOn(controller, "updateSelfTestTaskStatus$").mockReturnValue(of(null));
        arg = {
          type: "tyty",
          name: "nana",
          version: 1,
          sender: "sese",
          assetMetaData: {
            typeId: "atat",
            assetId: "asas",
            sessionId: "sese",
            messageId: "meme",
          },
          result: EResult.Succeed,
          errorCode: "coco",
          errorMsg: "msms",
        };
        ctx = { getTopic: jest.fn() } as any;
        expected = {
          isMqttMessagePayload: arg,
          isMqttResponsePayload: arg,
          getSelfTestTaskAsset: {
            taskId: "meme",
            typeId: "atat",
            status: EAssetStatus.Missing,
            assetId: "asas",
          },
          updateSelfTest: {
            taskId: "meme",
            assetId: "asas",
            typeId: "atat",
            subAssetId: "asas",
            subTypeId: "atat",
            status: EResult.Succeed,
            errorCode: "coco",
            errorMessage: "msms",
          },
          updateSelfTestTaskAsset: {
            taskId: "meme",
            typeId: "atat",
            assetId: "asas",
            status: ETaskAssetStatus.Complete,
          },
          closeSession: "sese",
          taskId: "meme",
          data: null,
        };
        // act
        act = controller.handleSelfTest$(arg, ctx).toPromise();
      });
      // assert
      it("should call isMqttMessagePayload", () => {
        return act
          .then(() => expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(expected.isMqttMessagePayload))
          .catch((e: any) => fail(e));
      });
      it("should call isMqttResponsePayload", () => {
        return act
          .then(() => expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalledWith(expected.isMqttResponsePayload))
          .catch((e: any) => fail(e));
      });
      it("should call getSelfTestTaskAsset$", () => {
        return act
          .then(() => expect(tasksService.getSelfTestTaskAsset$).toHaveBeenCalledWith(expected.getSelfTestTaskAsset))
          .catch((e: any) => fail(e));
      });
      it("should call updateSelfTestTaskSubAsset$", () => {
        return act
          .then(() => expect(tasksService.updateSelfTestTaskSubAsset$).toHaveBeenCalledWith(expected.updateSelfTest))
          .catch((e: any) => fail(e));
      });
      it("should call closeSession$", () => {
        return act.then(() => expect(controller.closeSession$).toHaveBeenCalledWith(expected.closeSession)).catch((e: any) => fail(e));
      });
      it("should call updateSelfTestTaskAsset$ with ETaskAssetStatus.Completed", () => {
        return act
          .then(() => expect(tasksService.updateSelfTestTaskAsset$).toHaveBeenCalledWith(expected.updateSelfTestTaskAsset))
          .catch((e: any) => fail(e));
      });
      it("should call updateSelfTestTaskStatus$ with taskId", () => {
        return act
          .then(() => expect(controller.updateSelfTestTaskStatus$).toHaveBeenCalledWith(expected.taskId))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when payload.resut isn't Succeed", () => {
      let arg: Record<string, unknown>;
      let ctx: MqttContext;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
        jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
        jest
          .spyOn(assetStatusService, "getOwnerOrThis$")
          .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
        const getSelfTestTaskAsset = {
          taskId: "r1",
          typeId: "r2",
          assetId: "r3",
          status: ETaskAssetStatus.InProgress,
        } as SelfTestTaskAsset;
        jest.spyOn(tasksService, "getSelfTestTaskAsset$").mockReturnValue(of(getSelfTestTaskAsset));
        jest.spyOn(tasksService, "updateSelfTestTaskSubAsset$").mockReturnValue(of(null));
        jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
        arg = {
          assetMetaData: {
            typeId: "atat",
            assetId: "asas",
            messageId: "meme",
          },
          result: EResult.Error,
          errorCode: "coco",
          errorMsg: "msms",
        };
        ctx = { getTopic: jest.fn() } as any;
        expected = {
          updateSelfTest: {
            taskId: "meme",
            assetId: "asas",
            typeId: "atat",
            subAssetId: "asas",
            subTypeId: "atat",
            status: EResult.Error,
            errorCode: "coco",
            errorMessage: "msms",
          },
          updateSelfTestTaskAsset: {
            taskId: "meme",
            typeId: "atat",
            assetId: "asas",
            status: ETaskAssetStatus.DeviceError,
          },
          data: null,
        };
        // act
        act = controller.handleSelfTest$(arg, ctx).toPromise();
      });
      // assert
      it("should call updateSelfTestTaskSubAsset$ with EResult.Error", () => {
        return act
          .then(() => expect(tasksService.updateSelfTestTaskSubAsset$).toHaveBeenCalledWith(expected.updateSelfTest))
          .catch((e: any) => fail(e));
      });
      it("should call updateSelfTestTaskAsset$ with ETaskAssetStatus.DeviceError", () => {
        return act
          .then(() => expect(tasksService.updateSelfTestTaskAsset$).toHaveBeenCalledWith(expected.updateSelfTestTaskAsset))
          .catch((e: any) => fail(e));
      });
    });

    it(`should end process when payload is nothing`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(false);
      const arg = "" as any;
      const ctx = { getTopic: jest.fn() } as any;

      // assert
      return controller
        .handleSelfTest$(arg, ctx)
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
        .handleSelfTest$(arg, ctx)
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
        .handleSelfTest$(arg, ctx)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateSelfTestTaskSubAsset$).not.toHaveBeenCalled();
          expect(tasksService.updateSelfTestTaskAsset$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it(`should stop the process when status isn't InProgress `, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest
        .spyOn(assetStatusService, "getOwnerOrThis$")
        .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
      const getSelfTestTaskAsset = { taskId: "r1", typeId: "r2", assetId: "r3", status: ETaskAssetStatus.Complete } as SelfTestTaskAsset;
      jest.spyOn(tasksService, "getSelfTestTaskAsset$").mockReturnValue(of(getSelfTestTaskAsset));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "updateSelfTestTaskSubAsset$").mockReturnValue(throwError("test err"));
      jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));
      const arg = {
        assetMetaData: {
          typeId: "atat",
          assetId: "asas",
          sessionId: undefined,
          messageId: undefined,
        },
        result: EResult.Succeed,
      };
      const ctx = { getTopic: jest.fn() } as any;
      const expected = null;

      // assert
      return controller
        .handleSelfTest$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.getSelfTestTaskAsset$).toHaveBeenCalled();
          expect(tasksService.updateSelfTestTaskSubAsset$).not.toHaveBeenCalled();
          expect(tasksService.updateSelfTestTaskAsset$).not.toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it(`should return null when updateSelfTestTaskSubAsset$ exception`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest
        .spyOn(assetStatusService, "getOwnerOrThis$")
        .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
      const getSelfTestTaskAsset: SelfTestTaskAsset = {
        id: 1,
        taskId: "r1",
        typeId: "r2",
        assetId: "r3",
        status: ETaskAssetStatus.InProgress,
        startedAt: moment.utc(),
        updatedAt: moment.utc(),
      };
      jest.spyOn(tasksService, "getSelfTestTaskAsset$").mockReturnValue(of(getSelfTestTaskAsset));
      jest.spyOn(tasksService, "updateSelfTestTaskSubAsset$").mockReturnValue(throwError("test err"));
      jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      const arg = {
        assetMetaData: {
          typeId: "atat",
          assetId: "asas",
          sessionId: undefined,
          messageId: undefined,
        },
        result: EResult.Succeed,
      };
      const ctx = { getTopic: jest.fn() } as any;
      const expected = null;

      // assert
      return controller
        .handleSelfTest$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateSelfTestTaskSubAsset$).toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it(`should return null when updateSelfTestTaskAsset$ exception`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest
        .spyOn(assetStatusService, "getOwnerOrThis$")
        .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
      const getSelfTestTaskAsset: SelfTestTaskAsset = {
        id: 1,
        taskId: "r1",
        typeId: "r2",
        assetId: "r3",
        status: ETaskAssetStatus.InProgress,
        startedAt: moment.utc(),
        updatedAt: moment.utc(),
      };
      jest.spyOn(tasksService, "getSelfTestTaskAsset$").mockReturnValue(of(getSelfTestTaskAsset));
      jest.spyOn(tasksService, "updateSelfTestTaskSubAsset$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(throwError("test err"));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      const arg = {
        assetMetaData: {
          typeId: "atat",
          assetId: "asas",
          sessionId: undefined,
          messageId: undefined,
        },
        result: EResult.Succeed,
      };
      const ctx = { getTopic: jest.fn() } as any;
      const expected = null;

      // assert
      return controller
        .handleSelfTest$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateSelfTestTaskAsset$).toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it(`should return null when updateSelfTestTaskStatus$ exception`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest
        .spyOn(assetStatusService, "getOwnerOrThis$")
        .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
      const getSelfTestTaskAsset: SelfTestTaskAsset = {
        id: 1,
        taskId: "r1",
        typeId: "r2",
        assetId: "r3",
        status: ETaskAssetStatus.InProgress,
        startedAt: moment.utc(),
        updatedAt: moment.utc(),
      };
      jest.spyOn(tasksService, "getSelfTestTaskAsset$").mockReturnValue(of(getSelfTestTaskAsset));
      jest.spyOn(tasksService, "updateSelfTestTaskSubAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "updateSelfTestTaskStatus$").mockReturnValue(throwError({}));
      const arg = {
        assetMetaData: {
          typeId: "atat",
          assetId: "asas",
          sessionId: undefined,
          messageId: undefined,
        },
        result: EResult.Succeed,
      };
      const ctx = { getTopic: jest.fn() } as any;
      const expected = null;

      // assert
      return controller
        .handleSelfTest$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateSelfTestTaskAsset$).toHaveBeenCalled();
          expect(controller.updateSelfTestTaskStatus$).toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it(`should return null when result is not success`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest
        .spyOn(assetStatusService, "getOwnerOrThis$")
        .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
      const getSelfTestTaskAsset: SelfTestTaskAsset = {
        id: 1,
        taskId: "r1",
        typeId: "r2",
        assetId: "r3",
        status: ETaskAssetStatus.InProgress,
        startedAt: moment.utc(),
        updatedAt: moment.utc(),
      };
      jest.spyOn(tasksService, "getSelfTestTaskAsset$").mockReturnValue(of(getSelfTestTaskAsset));
      jest.spyOn(tasksService, "updateSelfTestTaskSubAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "updateSelfTestTaskStatus$").mockReturnValue(throwError({}));
      const arg = {
        assetMetaData: {
          typeId: "atat",
          assetId: "asas",
          sessionId: undefined,
          messageId: undefined,
        },
        result: EResult.Error,
      };
      const ctx = { getTopic: jest.fn() } as any;
      const expected = null;

      // assert
      return controller
        .handleSelfTest$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateSelfTestTaskAsset$).toHaveBeenCalled();
          expect(controller.updateSelfTestTaskStatus$).toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(SelfTestController.prototype.updateSelfTestTaskStatus$.name, () => {
    describe("when task-status is InProgress and asset-status is all Complete", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }],
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        expected = {
          getSelfTestTask: "argumen task id",
          updateSelfTestTask: {
            taskId: "argumen task id",
            status: ETaskStatus.Complete,
          },
          data: null,
        };
        // act
        act = controller.updateSelfTestTaskStatus$(arg).toPromise();
      });
      // assert
      it("should call getSelfTestTask$", () => {
        return act
          .then(() => expect(tasksService.getSelfTestTask$).toHaveBeenCalledWith(expected.getSelfTestTask))
          .catch((e: any) => fail(e));
      });
      it("should call updateSelfTestTask$ with Complete", () => {
        return act
          .then(() => expect(tasksService.updateSelfTestTask$).toHaveBeenCalledWith(expected.updateSelfTestTask))
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
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateSelfTestTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateSelfTestTask$", () => {
        return act.then(() => expect(tasksService.updateSelfTestTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
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
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateSelfTestTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateSelfTestTask$", () => {
        return act.then(() => expect(tasksService.updateSelfTestTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
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
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        expected = {
          getSelfTestTask: "argumen task id",
          updateSelfTestTask: {
            taskId: "argumen task id",
            status: ETaskStatus.Failure,
          },
          data: null,
        };
        // act
        act = controller.updateSelfTestTaskStatus$(arg).toPromise();
      });
      // assert
      it("should call updateSelfTestTask$ with Failure", () => {
        return act
          .then(() => expect(tasksService.updateSelfTestTask$).toHaveBeenCalledWith(expected.updateSelfTestTask))
          .catch((e: any) => fail(e));
      });
    });

    describe("when status of selftest-task is empty", () => {
      let arg: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }],
          selftests: [{ status: "" }, { status: "" }, { status: "" }],
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateSelfTestTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateSelfTestTask$", () => {
        return act.then(() => expect(tasksService.updateSelfTestTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
      });
    });
  });

  describe(SelfTestController.prototype.closeSession$.name, () => {
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

  describe(SelfTestController.prototype.saveEventLog$.name, () => {
    beforeEach(() => {
      jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(empty());
      jest.spyOn(bridgeEventListService.selfTestTask, "insertSuccess$").mockReturnValue(of(null));
      jest.spyOn(bridgeEventListService.selfTestTask, "insertFail$").mockReturnValue(of(null));
    });

    it("should call taskService.getTask$ with expected params", () => {
      // arrange
      const params: UpdateRebootSelfTestTaskAsset = {
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
        .then(() => expect(tasksService.getSelfTestTask$).toHaveBeenCalledWith(expected))
        .catch(fail);
    });

    it("should call insertSuccess$ with expected params", () => {
      // arrange
      const params: UpdateRebootSelfTestTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.Complete,
      };
      const task = {
        memo: "memo des",
      };
      const expected = {
        taskId: params.taskId,
        typeId: params.typeId,
        assetId: params.assetId,
        memo: task.memo,
      };

      jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task as any));

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(bridgeEventListService.selfTestTask.insertSuccess$).toHaveBeenCalledWith(expected))
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
        const params: UpdateRebootSelfTestTaskAsset = {
          taskId: "task des",
          typeId: "type des",
          assetId: "asset des",
          status,
        };
        const task = {
          memo: "memo des",
        };
        const expected = {
          taskId: params.taskId,
          typeId: params.typeId,
          assetId: params.assetId,
          memo: task.memo,
          errorResult,
        };

        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task as any));

        // act
        const p$ = controller.saveEventLog$(params).toPromise();

        // assert
        return p$ //
          .then(() => expect(bridgeEventListService.selfTestTask.insertFail$).toHaveBeenCalledWith(expected))
          .catch(fail);
      },
    );

    it("should return null immediately if status is unhandled", () => {
      // arrange
      const params: UpdateRebootSelfTestTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.InProgress,
      };

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(tasksService.getSelfTestTask$).not.toHaveBeenCalled())
        .catch(fail);
    });

    it("should write error log and complete normally if error occurs", () => {
      // arrange
      const params: UpdateRebootSelfTestTaskAsset = {
        taskId: "task des",
        typeId: "type des",
        assetId: "asset des",
        status: ETaskAssetStatus.Complete,
      };

      jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(throwError(new Error("error desu")));

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(loggerService.error).toHaveBeenCalled())
        .catch(fail);
    });
  });
});
