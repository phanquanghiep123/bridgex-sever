import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common";
import moment from "moment";
import { of, throwError, empty } from "rxjs";
import { AxiosResponse } from "axios";

import { StartRebootController } from "./start-reboot.controller";
import { GuardStartReboot } from "./start-reboot.controller.guard";
import { TasksService, ETaskStatus, ETaskAssetStatus, ERebootStatus, RebootTask, RebootTaskAsset } from "../../service/tasks";
import { MqttPublishService } from "../../service/mqtt-publish";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { ConfigService } from "../../service/config";
import { HttpClientService } from "../../service/http-client";
import { SessionData } from "./start-reboot.controller.i";
import { AppConfig } from "../../environment/app";
import { AssetStatusService, EAssetStatus, AssetStatus } from "../../service/asset-status";
import { BridgeEventListService } from "../../service/event-list";
import * as EventListParams from "../../service/event-list";

describe(StartRebootController.name, () => {
  let controller: StartRebootController;
  let tasksService: TasksService;
  let mqttPublishService: MqttPublishService;
  let guardStartDeployment: GuardStartReboot;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;

  class TasksServiceMock {
    public getRebootTask$ = jest.fn().mockReturnValue(empty());
    public updateRebootTaskToInprogress$ = jest.fn().mockReturnValue(empty());
    public insertReboot$ = jest.fn().mockReturnValue(empty());
    public updateRebootTaskAsset$ = jest.fn().mockReturnValue(empty());
    public updateRebootTask$ = jest.fn().mockReturnValue(empty());
    public updateRebootTaskStatus$ = jest.fn().mockReturnValue(empty());
  }

  class MqttPublishServiceMock {
    public sendRebootCommand$ = jest.fn().mockReturnValue(empty());
  }

  class GuardStartRebootMock {
    public isPostBody = jest.fn();
    public isSessionData = jest.fn();
  }

  class ConfigServiceMock {
    public ftpConfig = jest.fn();
    public appConfig = jest.fn();
  }

  class HttpClientServiceMock {
    public post$ = jest.fn().mockReturnValue(empty());
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class AssetStatusServiceMock {
    public getMany$ = jest.fn().mockReturnValue(empty());
  }

  class BridgeEventListServiceMock {
    public rebootTask = {
      insertExecute$: jest.fn().mockReturnValue(of(null)),
      insertFail$: jest.fn().mockReturnValue(of(null)),
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StartRebootController],
      providers: [
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: MqttPublishService, useClass: MqttPublishServiceMock },
        { provide: GuardStartReboot, useClass: GuardStartRebootMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: BridgeEventListService, useClass: BridgeEventListServiceMock },
      ],
    }).compile();

    controller = module.get(StartRebootController);
    tasksService = module.get(TasksService);
    mqttPublishService = module.get(MqttPublishService);
    guardStartDeployment = module.get(GuardStartReboot);
    configService = module.get(ConfigService);
    loggerService = module.get(LoggerService);
    httpClientService = module.get(HttpClientService);
    assetStatusService = module.get(AssetStatusService);
    bridgeEventListService = module.get(BridgeEventListService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(tasksService).toBeDefined();
    expect(mqttPublishService).toBeDefined();
    expect(guardStartDeployment).toBeDefined();
    expect(configService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(httpClientService).toBeDefined();
    expect(bridgeEventListService).toBeDefined();
  });

  describe(StartRebootController.prototype.post.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(guardStartDeployment, "isPostBody").mockReturnValue(true);

        const task = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          reboots: [
            {
              id: 1,
              taskId: "tata",
              assetId: "assetId",
              typeId: "typeId",
              subTypeId: "subTypeId",
              subAssetId: "subAssetId",
              status: ERebootStatus.Succeed,
              errorCode: "errorCode",
              errorMessage: "errorMessage",
              createdAt: moment.utc(),
              updatedAt: moment.utc(),
            },
            {
              id: 2,
              taskId: "tata",
              assetId: "assetId",
              typeId: "typeId",
              subTypeId: "subTypeId",
              subAssetId: "subAssetId",
              status: ERebootStatus.Succeed,
              errorCode: "errorCode",
              errorMessage: "errorMessage",
              createdAt: moment.utc(),
              updatedAt: moment.utc(),
            },
          ],
          assets: [
            {
              id: 1,
              taskId: "tata",
              typeId: "typeId",
              assetId: "assetId",
              status: ETaskAssetStatus.Scheduled,
              startedAt: moment.utc(),
              updatedAt: moment.utc(),
            },
            {
              id: 2,
              taskId: "tata",
              typeId: "typeId",
              assetId: "assetId",
              status: ETaskAssetStatus.Scheduled,
              startedAt: moment.utc(),
              updatedAt: moment.utc(),
            },
          ],
        } as RebootTask;
        const assetStatus = [
          {
            typeId: "typeId",
            assetId: "assetId",
            status: EAssetStatus.Good,
            subAssets: [
              {
                typeId: "typeId",
                assetId: "assetId",
                status: EAssetStatus.Good,
              },
              {
                typeId: "typeId",
                assetId: "assetId",
                status: EAssetStatus.Good,
              },
            ],
          },
        ] as AssetStatus[];

        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateRebootTaskToInprogress$").mockReturnValue(of(null));
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of(assetStatus));
        jest.spyOn(controller, "startReboot$").mockReturnValue(of(null));
        jest.spyOn(controller, "findTargetAsset").mockReturnValue(null);
        jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "sendReboot$").mockReturnValue(of(null));
        jest.spyOn(controller, "updateRebootTaskStatus$").mockReturnValue(of(null));

        arg = { taskId: "tata" };

        expected = {
          isPostBody: arg,
          getRebootTask: "tata",
          updateRebootTaskToInprogress: "tata",
          getMany: task.assets,
          startReboot: task.assets.map((t) => [task, t, assetStatus]),
          sendReboot: task.assets.map((t) => [task, t, assetStatus]),
          updateRebootTaskStatus: "tata",
          data: null,
        };
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should call isPostBody", () => {
        return act.then(() => expect(guardStartDeployment.isPostBody).toHaveBeenCalledWith(expected.isPostBody)).catch((e: any) => fail(e));
      });
      it("should call getRebootTask$", () => {
        return act.then(() => expect(tasksService.getRebootTask$).toHaveBeenCalledWith(expected.getRebootTask)).catch((e: any) => fail(e));
      });
      it("should call updateRebootTaskToInprogress$", () => {
        return act
          .then(() => expect(tasksService.updateRebootTaskToInprogress$).toHaveBeenCalledWith(expected.updateRebootTaskToInprogress))
          .catch((e: any) => fail(e));
      });
      it("should call getMany$", () => {
        return act.then(() => expect(assetStatusService.getMany$).toHaveBeenCalledWith(expected.getMany)).catch((e: any) => fail(e));
      });
      it("should call startReboot$", () => {
        return act
          .then(() => {
            expect(controller.startReboot$).toHaveBeenCalledTimes(2);
            expect(controller.startReboot$).toHaveBeenNthCalledWith(1, ...expected.startReboot[0]);
            expect(controller.startReboot$).toHaveBeenNthCalledWith(2, ...expected.startReboot[1]);
          })
          .catch((e: any) => fail(e));
      });
      it("should call updateRebootTaskStatus$", () => {
        return act
          .then(() => {
            expect(controller.updateRebootTaskStatus$).toHaveBeenCalledTimes(1);
            expect(controller.updateRebootTaskStatus$).toHaveBeenCalledWith(expected.updateRebootTaskStatus);
          })
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when the received body is error", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(guardStartDeployment, "isPostBody").mockReturnValue(false);
        arg = { taskId: "tata" };
        expected = 400;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should throw BadRequestException", () => {
        return act
          .then((data: any) => fail(data))
          .catch((e: HttpException) => {
            expect(guardStartDeployment.isPostBody).toHaveBeenCalled();
            expect(tasksService.getRebootTask$).not.toHaveBeenCalled();
            expect(e.getStatus()).toEqual(expected);
          });
      });
    });

    describe("when the task status is not Scheduled", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(guardStartDeployment, "isPostBody").mockReturnValue(true);
        const task = {
          status: ETaskStatus.InProgress,
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        arg = { taskId: "tata" };
        expected = null;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTaskToInprogress$", () => {
        return act
          .then((data: any) => {
            expect(tasksService.getRebootTask$).toHaveBeenCalled();
            expect(tasksService.updateRebootTaskToInprogress$).not.toHaveBeenCalled();
            expect(data).toEqual(expected);
          })
          .catch((e: any) => fail(e));
      });
    });

    describe("when a service throw error", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(guardStartDeployment, "isPostBody").mockReturnValue(true);
        const task = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          reboots: [
            {
              id: 1,
              taskId: "tata",
              assetId: "assetId",
              typeId: "typeId",
              subTypeId: "subTypeId",
              subAssetId: "subAssetId",
              status: ERebootStatus.Succeed,
              errorCode: "errorCode",
              errorMessage: "errorMessage",
              createdAt: moment.utc(),
              updatedAt: moment.utc(),
            },
            {
              id: 2,
              taskId: "tata",
              assetId: "assetId",
              typeId: "typeId",
              subTypeId: "subTypeId",
              subAssetId: "subAssetId",
              status: ERebootStatus.Succeed,
              errorCode: "errorCode",
              errorMessage: "errorMessage",
              createdAt: moment.utc(),
              updatedAt: moment.utc(),
            },
          ],
          assets: [
            {
              id: 1,
              taskId: "tata",
              typeId: "typeId1",
              assetId: "assetId1",
              status: ETaskAssetStatus.Scheduled,
              startedAt: moment.utc(),
              updatedAt: moment.utc(),
            },
            {
              id: 2,
              taskId: "tata",
              typeId: "typeId2",
              assetId: "assetId2",
              status: ETaskAssetStatus.Scheduled,
              startedAt: moment.utc(),
              updatedAt: moment.utc(),
            },
          ],
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(tasksService, "updateRebootTaskToInprogress$").mockReturnValue(throwError(error));
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of([]));
        jest.spyOn(controller, "startReboot$").mockReturnValue(of(null));
        arg = { taskId: "tata" };
        expected = 123;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTaskToInprogress$", () => {
        return act
          .then((data: any) => fail(data))
          .catch((e: HttpException) => {
            expect(tasksService.updateRebootTaskToInprogress$).toHaveBeenCalled();
            expect(assetStatusService.getMany$).not.toHaveBeenCalled();
            expect(controller.startReboot$).not.toHaveBeenCalled();
            expect(e.getStatus()).toEqual(expected);
          });
      });
    });
  });

  describe(StartRebootController.prototype.startReboot$.name, () => {
    beforeEach(() => {
      jest.spyOn(controller, "saveEventLogExecute$").mockReturnValue(of(null));
      jest.spyOn(controller, "saveEventLogFail$").mockReturnValue(of(null));
    });

    describe("error occurs before execution", () => {
      it("end with SystemError if target asset does not have a child asset", () => {
        // arrange
        const task: RebootTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          reboots: [],
          assets: [
            {
              id: 1,
              taskId: "tata",
              typeId: "typeId",
              assetId: "assetId",
              status: ETaskAssetStatus.InProgress,
              startedAt: null as any,
              updatedAt: moment.utc(),
            },
          ],
        };
        const assetStatus = [
          {
            typeId: "typeId",
            assetId: "assetId",
            status: EAssetStatus.Good,
          },
        ] as AssetStatus[];

        const expected = { ...task.assets[0], status: ETaskAssetStatus.SystemError };
        const expectedEventLog = {
          taskId: task.assets[0].taskId,
          typeId: task.assets[0].typeId,
          assetId: task.assets[0].assetId,
          memo: task.memo,
          errorResult: EventListParams.ETaskErrorResult.SystemError,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(null);
        jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));

        // act
        return (
          controller
            .startReboot$(task, task.assets[0], assetStatus)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateRebootTaskAsset$).toHaveBeenCalledWith(expected))
            .then(() => expect(controller.saveEventLogFail$).toHaveBeenCalledWith(expectedEventLog))
            .catch(fail)
        );
      });

      it("end with ConnectionError if target asset is missing", () => {
        // arrange
        const task: RebootTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          reboots: [],
          assets: [
            {
              id: 1,
              taskId: "tata",
              typeId: "typeId",
              assetId: "assetId",
              status: ETaskAssetStatus.SystemError,
              startedAt: null as any,
              updatedAt: moment.utc(),
            },
          ],
        };
        const assetStatus = [
          {
            typeId: "typeId",
            assetId: "assetId",
            status: EAssetStatus.Missing,
            subAssets: [
              {
                typeId: "typeId",
                assetId: "assetId",
                status: EAssetStatus.Missing,
              },
            ],
          },
        ] as AssetStatus[];

        const targetAsset = {
          typeId: "typeId",
          assetId: "assetId",
          status: EAssetStatus.Missing,
        } as AssetStatus;

        const expected = { ...task.assets[0], status: ETaskAssetStatus.ConnectionError };
        const expectedEventLog = {
          taskId: task.assets[0].taskId,
          typeId: task.assets[0].typeId,
          assetId: task.assets[0].assetId,
          memo: task.memo,
          errorResult: EventListParams.ETaskErrorResult.ConnectionError,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(targetAsset);
        jest.spyOn(tasksService, "updateRebootTaskAsset$").mockReturnValue(of(null));

        // act
        return (
          controller
            .startReboot$(task, task.assets[0], assetStatus)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateRebootTaskAsset$).toHaveBeenCalledWith(expected))
            .then(() => expect(controller.saveEventLogFail$).toHaveBeenCalledWith(expectedEventLog))
            .catch(fail)
        );
      });
    });

    describe("normal pattern (1)", () => {
      let argRebootTask: RebootTask;
      let argRebootTaskAsset: RebootTaskAsset;
      let argSubAsset: AssetStatus;
      let act: any;
      beforeEach(() => {
        // arrange
        const assetStatus = [
          {
            typeId: "typeId",
            assetId: "assetId",
            status: EAssetStatus.Good,
            subAssets: [
              {
                typeId: "typeId",
                assetId: "assetId",
                status: EAssetStatus.Good,
              },
              {
                typeId: "typeId",
                assetId: "assetId",
                status: EAssetStatus.Good,
              },
            ],
          },
        ] as AssetStatus[];
        const targetAsset = {
          typeId: "typeId",
          assetId: "assetId",
          status: EAssetStatus.Good,
          subAssets: [
            {
              typeId: "typeId",
              assetId: "assetId",
              status: EAssetStatus.Good,
            },
          ],
        } as AssetStatus;
        argRebootTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          reboots: [],
          assets: [
            {
              id: 1,
              taskId: "tata",
              typeId: "typeId",
              assetId: "assetId",
              status: ETaskAssetStatus.Scheduled,
              startedAt: null as any,
              updatedAt: moment.utc(),
            },
          ],
        };
        argRebootTaskAsset = {
          id: 1,
          taskId: "tata",
          typeId: "typeId",
          assetId: "assetId",
          status: ETaskAssetStatus.Scheduled,
          startedAt: null as any,
          updatedAt: moment.utc(),
        };
        argSubAsset = {
          typeId: "typeId",
          assetId: "assetId",
          status: EAssetStatus.Good,
        };
        jest.spyOn(controller, "findTargetAsset").mockReturnValue(targetAsset);
        jest.spyOn(controller, "sendReboot$").mockReturnValue(of(null));
        // act
        act = controller.startReboot$(argRebootTask, argRebootTaskAsset, assetStatus).toPromise();
      });
      // assert
      it("should call sendReboot$", () => {
        return act
          .then(() => expect(controller.sendReboot$).toHaveBeenCalledWith(argRebootTask, argRebootTaskAsset, argSubAsset))
          .catch((e: any) => fail(e));
      });
    });

    describe("normal pattern (2)", () => {
      let argRebootTask: RebootTask;
      let argRebootTaskAsset: RebootTaskAsset;
      let act: any;
      beforeEach(() => {
        // arrange
        const assetStatus = [
          {
            typeId: "typeId",
            assetId: "assetId",
            status: EAssetStatus.Good,
            subAssets: [
              {
                typeId: "typeId",
                assetId: "assetId",
                status: EAssetStatus.Good,
              },
              {
                typeId: "typeId",
                assetId: "assetId",
                status: EAssetStatus.Good,
              },
            ],
          },
        ] as AssetStatus[];
        const targetAsset = {
          typeId: "typeId",
          assetId: "assetId",
          status: EAssetStatus.Good,
        } as AssetStatus;
        argRebootTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          reboots: [],
          assets: [
            {
              id: 1,
              taskId: "tata",
              typeId: "typeId",
              assetId: "assetId",
              status: ETaskAssetStatus.Scheduled,
              startedAt: null as any,
              updatedAt: moment.utc(),
            },
          ],
        };
        argRebootTaskAsset = {
          id: 1,
          taskId: "tata",
          typeId: "typeId",
          assetId: "assetId",
          status: ETaskAssetStatus.Scheduled,
          startedAt: null as any,
          updatedAt: moment.utc(),
        };
        jest.spyOn(controller, "findTargetAsset").mockReturnValue(targetAsset);
        jest.spyOn(controller, "sendReboot$").mockReturnValue(of(null));
        // act
        act = controller.startReboot$(argRebootTask, argRebootTaskAsset, assetStatus).toPromise();
      });
      // assert
      it("should not call sendReboot$", () => {
        return act.then(() => expect(controller.sendReboot$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartRebootController.prototype.findTargetAsset.name, () => {
    it("return null if assets is not defined", () => {
      // arrage
      const typeId = "target-type";
      const assetId = "target-asset";
      const assets: AssetStatus[] = undefined as any;

      const taskAsset: RebootTaskAsset = {
        id: 1,
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
        taskId: "task id",
        startedAt: null as any,
        updatedAt: null as any,
      };

      // act
      const actual = controller.findTargetAsset(taskAsset, typeId, assets);

      // assert
      expect(actual).toBeNull();
    });

    it("return expected asset if target asset is specified assetType", () => {
      // arrage
      const typeId = "target-type";
      const assetId = "target-asset";
      const expected = { typeId, assetId, status: EAssetStatus.Error };
      const targetAsset = { ...expected };

      const assets: AssetStatus[] = [
        { typeId: "chigau-type", assetId: "chigau-asset", status: EAssetStatus.Good },
        {} as any,
        targetAsset,
        { typeId: "koremo-chigau-type", assetId: "koremo-chigau-asset", status: EAssetStatus.Good },
      ];

      const taskAsset: RebootTaskAsset = {
        id: 1,
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
        taskId: "task id",
        startedAt: null as any,
        updatedAt: null as any,
      };

      // act
      const actual = controller.findTargetAsset(taskAsset, typeId, assets);

      // assert
      expect(actual).toEqual(expected);
    });

    it("return expected sub asset if target asset has expected assetType of sub asset", () => {
      // arrage
      const typeId = "target-type";
      const assetId = "target-asset";
      const targetSubAssetType = "target-subasset-type";
      const expected = { typeId: targetSubAssetType, assetId: "target-subasset", status: EAssetStatus.Error };

      const assets: AssetStatus[] = [
        { typeId: "chigau-type", assetId: "chigau-asset", status: EAssetStatus.Good },
        {} as any,
        { typeId, assetId, status: EAssetStatus.Error, subAssets: [expected, {}] },
        { typeId: "koremo-chigau-type", assetId: "koremo-chigau-asset", status: EAssetStatus.Good },
      ];

      const taskAsset: RebootTaskAsset = {
        id: 1,
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
        taskId: "task id",
        startedAt: null as any,
        updatedAt: null as any,
      };

      // act
      const actual = controller.findTargetAsset(taskAsset, targetSubAssetType, assets);

      // assert
      expect(actual).toEqual(expected);
    });

    it("return null if target asset does not subAssets", () => {
      // arrage
      const typeId = "target-type";
      const assetId = "target-asset";
      const targetSubAssetType = "target-subasset-type";

      const assets: AssetStatus[] = [{ typeId, assetId, status: EAssetStatus.Error }];

      const taskAsset: RebootTaskAsset = {
        id: 1,
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
        taskId: "task id",
        startedAt: null as any,
        updatedAt: null as any,
      };

      // act
      const actual = controller.findTargetAsset(taskAsset, targetSubAssetType, assets);

      // assert
      expect(actual).toBeNull();
    });

    it("return null if target asset does not have expected assetType of sub asset", () => {
      // arrage
      const typeId = "target-type";
      const assetId = "target-asset";
      const targetSubAssetType = "target-subasset-type";

      const assets: AssetStatus[] = [
        {
          typeId,
          assetId,
          status: EAssetStatus.Error,
          subAssets: [{ typeId: "siranai-type-no-subasset-type", assetId: "target-subasset", status: EAssetStatus.Error }],
        },
      ];

      const taskAsset: RebootTaskAsset = {
        id: 1,
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
        taskId: "task id",
        startedAt: null as any,
        updatedAt: null as any,
      };

      // act
      const actual = controller.findTargetAsset(taskAsset, targetSubAssetType, assets);

      // assert
      expect(actual).toBeNull();
    });
  });

  describe(StartRebootController.prototype.sendReboot$.name, () => {
    describe("normal pattern", () => {
      let argRebootTask: RebootTask;
      let argRebootTaskAsset: RebootTaskAsset;
      let argAssetStatus: AssetStatus;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const sessionResponse = { sessionId: "sese", topicPrefix: "toto" } as SessionData;
        const res = {};
        argRebootTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          reboots: [],
          assets: [
            {
              id: 1,
              taskId: "tata",
              typeId: "typeId",
              assetId: "assetId",
              status: ETaskAssetStatus.InProgress,
              startedAt: null as any,
              updatedAt: moment.utc(),
            },
          ],
        };
        argRebootTaskAsset = {
          id: 1,
          taskId: "tata",
          typeId: "typeId",
          assetId: "assetId",
          status: ETaskAssetStatus.InProgress,
          startedAt: null as any,
          updatedAt: moment.utc(),
        };
        argAssetStatus = {
          typeId: "typeId",
          assetId: "assetId",
          status: EAssetStatus.Good,
        };
        expected = {
          createSession: {
            typeId: "typeId",
            assetId: "assetId",
          },
          insertReboot: {
            taskId: "tata",
            assetId: "assetId",
            typeId: "typeId",
            subTypeId: "typeId",
            subAssetId: "assetId",
            status: "",
            errorCode: "",
            errorMsg: "",
          },
          sendRebootCommand: {
            typeId: "typeId",
            assetId: "assetId",
            sessionId: "sese",
            sessionTopic: "toto",
            messageId: "tata",
          },
          data: null,
        };

        jest.spyOn(controller, "createSession$").mockReturnValue(of(sessionResponse));
        jest.spyOn(tasksService, "insertReboot$").mockReturnValue(of(null));
        jest.spyOn(mqttPublishService, "sendRebootCommand$").mockReturnValue(of(res as any));

        // act
        act = controller.sendReboot$(argRebootTask, argRebootTaskAsset, argAssetStatus).toPromise();
      });
      // assert
      it("should call createSession$", () => {
        return act
          .then(() => expect(controller.createSession$).toHaveBeenCalledWith(expected.createSession.typeId, expected.createSession.assetId))
          .catch((e: any) => fail(e));
      });
      it("should call insertReboot$", () => {
        return act.then(() => expect(tasksService.insertReboot$).toHaveBeenCalledWith(expected.insertReboot)).catch((e: any) => fail(e));
      });
      it("should call sendRebootCommand$", () => {
        return act
          .then(() => expect(mqttPublishService.sendRebootCommand$).toHaveBeenCalledWith(expected.sendRebootCommand))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartRebootController.prototype.computeTaskStatus.name, () => {
    describe("when all task-asset is Scheduled", () => {
      it("return Scheduled", () => {
        // arrange
        const arg = [
          { status: ETaskAssetStatus.Scheduled },
          { status: ETaskAssetStatus.Scheduled },
          { status: ETaskAssetStatus.Scheduled },
        ] as RebootTaskAsset[];
        const expected = ETaskStatus.Scheduled;
        // act
        const actual = controller.computeTaskStatus(arg);
        // assert
        expect(actual).toEqual(expected);
      });
    });

    describe("when all task-asset is Complete", () => {
      it("return Complete", () => {
        // arrange
        const arg = [
          { status: ETaskAssetStatus.Complete },
          { status: ETaskAssetStatus.Complete },
          { status: ETaskAssetStatus.Complete },
        ] as RebootTaskAsset[];
        const expected = ETaskStatus.Complete;
        // act
        const actual = controller.computeTaskStatus(arg);
        // assert
        expect(actual).toEqual(expected);
      });
    });

    describe("when any task-asset is InProgress", () => {
      it("return InProgress", () => {
        // arrange
        const arg = [
          { status: ETaskAssetStatus.Scheduled },
          { status: ETaskAssetStatus.InProgress },
          { status: ETaskAssetStatus.Complete },
          { status: ETaskAssetStatus.ConnectionError },
          { status: ETaskAssetStatus.DeviceError },
          { status: ETaskAssetStatus.SystemError },
        ] as RebootTaskAsset[];
        const expected = ETaskStatus.InProgress;
        // act
        const actual = controller.computeTaskStatus(arg);
        // assert
        expect(actual).toEqual(expected);
      });
    });

    describe("when any task-asset is error", () => {
      it("return Failure", () => {
        // arrange
        const arg = [
          { status: ETaskAssetStatus.Complete },
          { status: ETaskAssetStatus.Complete },
          { status: ETaskAssetStatus.Complete },
          { status: ETaskAssetStatus.ConnectionError },
        ] as RebootTaskAsset[];
        const expected = ETaskStatus.Failure;
        // act
        const actual = controller.computeTaskStatus(arg);
        // assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe(StartRebootController.prototype.updateRebootTaskStatus$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ assetId: "1" }, { assetId: "2" }, { assetId: "3" }],
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Complete);
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          getRebootTask: "tata",
          computeTaskStatus: task.assets,
          updateTask: { taskId: "tata", status: ETaskStatus.Complete },
          data: null,
        };
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should call getRebootTask$", () => {
        return act.then(() => expect(tasksService.getRebootTask$).toHaveBeenCalledWith(expected.getRebootTask)).catch((e: any) => fail(e));
      });
      it("should call computeTaskStatus$", () => {
        return act
          .then(() => expect(controller.computeTaskStatus).toHaveBeenCalledWith(expected.computeTaskStatus))
          .catch((e: any) => fail(e));
      });
      it("should call updateTask", () => {
        return act.then(() => expect(tasksService.updateRebootTask$).toHaveBeenCalledWith(expected.updateTask)).catch((e: any) => fail(e));
      });
      it("should return data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when task.status is not InProgress", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.Complete,
          assets: [{ assetId: "1" }, { assetId: "2" }, { assetId: "3" }],
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Complete);
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getRebootTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).not.toHaveBeenCalled();
            expect(tasksService.updateRebootTask$).not.toHaveBeenCalled();
          })
          .catch((e: any) => fail(e));
      });
      it("should return data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when computed task.status is InProgress", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ assetId: "1" }, { assetId: "2" }, { assetId: "3" }],
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.InProgress);
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getRebootTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).toHaveBeenCalled();
            expect(tasksService.updateRebootTask$).not.toHaveBeenCalled();
          })
          .catch((e: any) => fail(e));
      });
      it("should return data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when computed task.status is Scheduled", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ assetId: "1" }, { assetId: "2" }, { assetId: "3" }],
        } as RebootTask;
        jest.spyOn(tasksService, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Scheduled);
        jest.spyOn(tasksService, "updateRebootTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateRebootTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateRebootTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getRebootTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).toHaveBeenCalled();
            expect(tasksService.updateRebootTask$).not.toHaveBeenCalled();
          })
          .catch((e: any) => fail(e));
      });
      it("should return data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartRebootController.prototype.createSession$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        const postResponse = {
          data: {
            typeId: "session typeId",
            assetId: "session assetId",
            sessionId: "session sessionId",
            topicPrefix: "session topicPrefix",
          } as SessionData,
        } as AxiosResponse<SessionData>;
        jest.spyOn(httpClientService, "post$").mockReturnValue(of(postResponse));
        jest.spyOn(guardStartDeployment, "isSessionData").mockReturnValue(true);
        arg = {
          typeId: "tyty",
          assetId: "asas",
        };
        expected = {
          post: {
            endpoint: `http://localhost:1234/session-manager/sessions`,
            data: {
              typeId: "tyty",
              assetId: "asas",
            },
            config: {},
          },
          isSessionData: postResponse.data,
          data: postResponse.data,
        };
        // act
        act = controller.createSession$(arg.typeId, arg.assetId).toPromise();
      });
      // assert
      it("should call appConfig$", () => {
        return act.then(() => expect(configService.appConfig).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call post$", () => {
        return act
          .then(() =>
            expect(httpClientService.post$).toHaveBeenCalledWith(expected.post.endpoint, expected.post.data, expected.post.config),
          )
          .catch((e: any) => fail(e));
      });
      it("should call isSessionData", () => {
        return act
          .then(() => expect(guardStartDeployment.isSessionData).toHaveBeenCalledWith(expected.isSessionData))
          .catch((e: any) => fail(e));
      });
      it("should return data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when returned invalid value from a service", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        const postResponse = {} as AxiosResponse<SessionData>;
        jest.spyOn(httpClientService, "post$").mockReturnValue(of(postResponse));
        arg = "argument session id";
        expected = {
          error: new BridgeXServerError(500, `Invalid response from session-manager`),
        };
        // act
        act = controller.createSession$(arg.typeId, arg.assetId).toPromise();
      });
      // assert
      it("should return exception", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected.error));
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
        jest.spyOn(httpClientService, "post$").mockReturnValue(throwError(error));
        arg = "argument session id";
        expected = {
          error,
        };
        // act
        act = controller.createSession$(arg.typeId, arg.assetId).toPromise();
      });
      // assert
      it("should return exception", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected.error));
      });
    });
  });

  describe(StartRebootController.prototype.saveEventLogExecute$.name, () => {
    it("should complete successfully", () => {
      // arrange
      const params: EventListParams.CreateTaskParams & EventListParams.RebootTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        memo: "memo des",
      };

      // act
      const p$ = controller.saveEventLogExecute$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).not.toHaveBeenCalled()).catch(fail);
    });

    it("should not throw error when error occurs", () => {
      // arrange
      const params: EventListParams.CreateTaskParams & EventListParams.RebootTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        memo: "memo des",
      };
      const error = new Error("error des");
      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      jest.spyOn(bridgeEventListService.rebootTask, "insertExecute$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogExecute$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });

  describe(StartRebootController.prototype.saveEventLogFail$.name, () => {
    it("should complete successfully", () => {
      // arrange
      const params: EventListParams.FailTaskParams & EventListParams.RebootTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        memo: "memo des",
        errorResult: EventListParams.ETaskErrorResult.ConnectionError,
      };

      // act
      const p$ = controller.saveEventLogFail$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).not.toHaveBeenCalled()).catch(fail);
    });

    it("should not throw error when error occurs", () => {
      // arrange
      const params: EventListParams.FailTaskParams & EventListParams.RebootTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        memo: "memo des",
        errorResult: EventListParams.ETaskErrorResult.ConnectionError,
      };
      const error = new Error("error des");
      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      jest.spyOn(bridgeEventListService.rebootTask, "insertFail$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogFail$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });
});
