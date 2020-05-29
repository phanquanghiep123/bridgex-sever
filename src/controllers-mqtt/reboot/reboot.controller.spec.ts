import moment from "moment";

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError, empty } from "rxjs";

import { RebootController } from "./reboot.controller";
import {
  TasksService,
  ETaskStatus,
  ETaskAssetStatus,
  ERebootStatus,
  RebootTask,
  RebootTaskAsset,
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

describe(RebootController.name, () => {
  let controller: RebootController;
  let tasksService: TasksService;
  let guardMqttMessage: GuardMqttMessage;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;
  let mqttPublishService: MqttPublishService;

  class TasksServiceMock {
    public getRebootTask$ = jest.fn().mockReturnValue(empty());
    public getRebootTaskAsset$ = jest.fn().mockReturnValue(empty());
    public updateRebootTaskSubAsset$ = jest.fn().mockReturnValue(empty());
    public updateRebootTaskAsset$ = jest.fn().mockReturnValue(empty());
    public updateRebootTask$ = jest.fn().mockReturnValue(empty());
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
    public rebootTask = {
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
      controllers: [RebootController],
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

    controller = module.get<RebootController>(RebootController);
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

  describe(RebootController.prototype.handleReboot$.name, () => {
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
        const getRebootTaskAsset = { taskId: "r1", typeId: "r2", assetId: "r3", status: ETaskAssetStatus.InProgress } as RebootTaskAsset;
        jest
          .spyOn(assetStatusService, "getOwnerOrThis$")
          .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
        jest.spyOn(tasksService, "getRebootTaskAsset$").mockReturnValue(of(getRebootTaskAsset));
        jest.spyOn(tasksService, "updateRebootTaskSubAsset$").mockReturnValue(of(null));
        jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
        jest.spyOn(controller, "updateRebootTaskStatus$").mockReturnValue(of(null));
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
          getRebootTaskAsset: {
            taskId: "meme",
            typeId: "atat",
            status: EAssetStatus.Missing,
            assetId: "asas",
          },
          updateReboot: {
            taskId: "meme",
            assetId: "asas",
            typeId: "atat",
            subAssetId: "asas",
            subTypeId: "atat",
            status: EResult.Succeed,
            errorCode: "coco",
            errorMessage: "msms",
          },
          updateRebootTaskAsset: {
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
        act = controller.handleReboot$(arg, ctx).toPromise();
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
      it("should call getRebootTaskAsset$", () => {
        return act
          .then(() => expect(tasksService.getRebootTaskAsset$).toHaveBeenCalledWith(expected.getRebootTaskAsset))
          .catch((e: any) => fail(e));
      });
      it("should call updateRebootTaskSubAsset$", () => {
        return act
          .then(() => expect(tasksService.updateRebootTaskSubAsset$).toHaveBeenCalledWith(expected.updateReboot))
          .catch((e: any) => fail(e));
      });
      it("should call closeSession$", () => {
        return act.then(() => expect(controller.closeSession$).toHaveBeenCalledWith(expected.closeSession)).catch((e: any) => fail(e));
      });
      it("should call updateRebootTaskAsset$ with ETaskAssetStatus.Completed", () => {
        return act
          .then(() => expect(tasksService.updateRebootTaskAsset$).toHaveBeenCalledWith(expected.updateRebootTaskAsset))
          .catch((e: any) => fail(e));
      });
      it("should call updateRebootTaskStatus$ with taskId", () => {
        return act.then(() => expect(controller.updateRebootTaskStatus$).toHaveBeenCalledWith(expected.taskId)).catch((e: any) => fail(e));
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
        const getRebootTaskAsset = { taskId: "r1", typeId: "r2", assetId: "r3", status: ETaskAssetStatus.InProgress } as RebootTaskAsset;
        jest.spyOn(tasksService, "getRebootTaskAsset$").mockReturnValue(of(getRebootTaskAsset));
        jest.spyOn(tasksService, "updateRebootTaskSubAsset$").mockReturnValue(of(null));
        jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));
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
          updateReboot: {
            taskId: "meme",
            assetId: "asas",
            typeId: "atat",
            subAssetId: "asas",
            subTypeId: "atat",
            status: EResult.Error,
            errorCode: "coco",
            errorMessage: "msms",
          },
          updateRebootTaskAsset: {
            taskId: "meme",
            typeId: "atat",
            assetId: "asas",
            status: ETaskAssetStatus.DeviceError,
          },
          data: null,
        };
        // act
        act = controller.handleReboot$(arg, ctx).toPromise();
      });
      // assert
      it("should call updateRebootTaskSubAsset$ with EResult.Error", () => {
        return act
          .then(() => expect(tasksService.updateRebootTaskSubAsset$).toHaveBeenCalledWith(expected.updateReboot))
          .catch((e: any) => fail(e));
      });
      it("should call updateRebootTaskAsset$ with ETaskAssetStatus.DeviceError", () => {
        return act
          .then(() => expect(tasksService.updateRebootTaskAsset$).toHaveBeenCalledWith(expected.updateRebootTaskAsset))
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
        .handleReboot$(arg, ctx)
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
        .handleReboot$(arg, ctx)
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
        .handleReboot$(arg, ctx)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateRebootTaskSubAsset$).not.toHaveBeenCalled();
          expect(tasksService.updateRebootTaskAsset$).not.toHaveBeenCalled();
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
      const getRebootTaskAsset = { taskId: "r1", typeId: "r2", assetId: "r3", status: ETaskAssetStatus.Complete } as RebootTaskAsset;
      jest.spyOn(tasksService, "getRebootTaskAsset$").mockReturnValue(of(getRebootTaskAsset));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "updateRebootTaskSubAsset$").mockReturnValue(throwError("test err"));
      jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));
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
        .handleReboot$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.getRebootTaskAsset$).toHaveBeenCalled();
          expect(tasksService.updateRebootTaskSubAsset$).not.toHaveBeenCalled();
          expect(tasksService.updateRebootTaskAsset$).not.toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it(`should return null when updateRebootTaskSubAsset$ exception`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest
        .spyOn(assetStatusService, "getOwnerOrThis$")
        .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
      const getRebootTaskAsset: RebootTaskAsset = {
        id: 1,
        taskId: "r1",
        typeId: "r2",
        assetId: "r3",
        status: ETaskAssetStatus.InProgress,
        startedAt: moment.utc(),
        updatedAt: moment.utc(),
      };
      jest.spyOn(tasksService, "getRebootTaskAsset$").mockReturnValue(of(getRebootTaskAsset));
      jest.spyOn(tasksService, "updateRebootTaskSubAsset$").mockReturnValue(throwError("test err"));
      jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));
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
        .handleReboot$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateRebootTaskSubAsset$).toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it(`should return null when updateRebootTaskAsset$ exception`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest
        .spyOn(assetStatusService, "getOwnerOrThis$")
        .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
      const getRebootTaskAsset: RebootTaskAsset = {
        id: 1,
        taskId: "r1",
        typeId: "r2",
        assetId: "r3",
        status: ETaskAssetStatus.InProgress,
        startedAt: moment.utc(),
        updatedAt: moment.utc(),
      };
      jest.spyOn(tasksService, "getRebootTaskAsset$").mockReturnValue(of(getRebootTaskAsset));
      jest.spyOn(tasksService, "updateRebootTaskSubAsset$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(throwError("test err"));
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
        .handleReboot$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateRebootTaskAsset$).toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it(`should return null when updateRebootTaskStatus$ exception`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardMqttMessage, "isMqttResponsePayload").mockReturnValue(true);
      jest
        .spyOn(assetStatusService, "getOwnerOrThis$")
        .mockImplementation((params) => of({ typeId: params.typeId, assetId: params.assetId, status: EAssetStatus.Missing }));
      const getRebootTaskAsset: RebootTaskAsset = {
        id: 1,
        taskId: "r1",
        typeId: "r2",
        assetId: "r3",
        status: ETaskAssetStatus.InProgress,
        startedAt: moment.utc(),
        updatedAt: moment.utc(),
      };
      jest.spyOn(tasksService, "getRebootTaskAsset$").mockReturnValue(of(getRebootTaskAsset));
      jest.spyOn(tasksService, "updateRebootTaskSubAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "updateRebootTaskStatus$").mockReturnValue(throwError({}));
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
        .handleReboot$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateRebootTaskAsset$).toHaveBeenCalled();
          expect(controller.updateRebootTaskStatus$).toHaveBeenCalled();
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
      const getRebootTaskAsset: RebootTaskAsset = {
        id: 1,
        taskId: "r1",
        typeId: "r2",
        assetId: "r3",
        status: ETaskAssetStatus.InProgress,
        startedAt: moment.utc(),
        updatedAt: moment.utc(),
      };
      jest.spyOn(tasksService, "getRebootTaskAsset$").mockReturnValue(of(getRebootTaskAsset));
      jest.spyOn(tasksService, "updateRebootTaskSubAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "closeSession$").mockReturnValue(of(null));
      jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));
      jest.spyOn(controller, "updateRebootTaskStatus$").mockReturnValue(throwError({}));
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
        .handleReboot$(arg, ctx)
        .toPromise()
        .then((data) => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalled();
          expect(guardMqttMessage.isMqttResponsePayload).toHaveBeenCalled();
          expect(tasksService.updateRebootTaskAsset$).toHaveBeenCalled();
          expect(controller.updateRebootTaskStatus$).toHaveBeenCalled();
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(RebootController.prototype.updateRebootTaskStatus$.name, () => {
    describe("when task-status is InProgress and asset-status is all Complete", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }],
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        expected = {
          getRebootTask: "argumen task id",
          updateRebootTask: {
            taskId: "argumen task id",
            status: ETaskStatus.Complete,
          },
          data: null,
        };
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should call getRebootTask$", () => {
        return act.then(() => expect(tasksService.getRebootTask$).toHaveBeenCalledWith(expected.getRebootTask)).catch((e: any) => fail(e));
      });
      it("should call updateRebootTask$ with Complete", () => {
        return act
          .then(() => expect(tasksService.updateRebootTask$).toHaveBeenCalledWith(expected.updateRebootTask))
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
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTask$", () => {
        return act.then(() => expect(tasksService.updateRebootTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
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
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTask$", () => {
        return act.then(() => expect(tasksService.updateRebootTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
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
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        expected = {
          getRebootTask: "argumen task id",
          updateRebootTask: {
            taskId: "argumen task id",
            status: ETaskStatus.Failure,
          },
          data: null,
        };
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should call updateRebootTask$ with Failure", () => {
        return act
          .then(() => expect(tasksService.updateRebootTask$).toHaveBeenCalledWith(expected.updateRebootTask))
          .catch((e: any) => fail(e));
      });
    });

    describe("when status of reboot-task is Accepted", () => {
      let arg: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }],
          reboots: [{ status: ERebootStatus.Accepted }, { status: ERebootStatus.Accepted }, { status: ERebootStatus.Accepted }],
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTask$", () => {
        return act.then(() => expect(tasksService.updateRebootTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
      });
    });

    describe("when status of reboot-task is empty", () => {
      let arg: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }, { status: ETaskAssetStatus.Complete }],
          reboots: [{ status: "" }, { status: "" }, { status: "" }],
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "argumen task id";
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTask$", () => {
        return act.then(() => expect(tasksService.updateRebootTask$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
      });
    });
  });

  describe(RebootController.prototype.closeSession$.name, () => {
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

  describe(RebootController.prototype.saveEventLog$.name, () => {
    beforeEach(() => {
      jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(empty());
      jest.spyOn(bridgeEventListService.rebootTask, "insertSuccess$").mockReturnValue(of(null));
      jest.spyOn(bridgeEventListService.rebootTask, "insertFail$").mockReturnValue(of(null));
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
        .then(() => expect(tasksService.getRebootTask$).toHaveBeenCalledWith(expected))
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

      jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task as any));

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(bridgeEventListService.rebootTask.insertSuccess$).toHaveBeenCalledWith(expected))
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

        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task as any));

        // act
        const p$ = controller.saveEventLog$(params).toPromise();

        // assert
        return p$ //
          .then(() => expect(bridgeEventListService.rebootTask.insertFail$).toHaveBeenCalledWith(expected))
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
        .then(() => expect(tasksService.getRebootTask$).not.toHaveBeenCalled())
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

      jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(throwError(new Error("error desu")));

      // act
      const p$ = controller.saveEventLog$(params).toPromise();

      // assert
      return p$ //
        .then(() => expect(loggerService.error).toHaveBeenCalled())
        .catch(fail);
    });
  });
});
