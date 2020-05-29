import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common";
import moment from "moment";
import { of, throwError, empty } from "rxjs";
import { AxiosResponse } from "axios";

import { StartSelfTestController } from "./start-selftest.controller";
import { GuardStartSelfTest } from "./start-selftest.controller.guard";
import { TasksService, ETaskStatus, ETaskAssetStatus, ESelfTestStatus, SelfTestTask, SelfTestTaskAsset } from "../../service/tasks";
import { MqttPublishService } from "../../service/mqtt-publish";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { ConfigService } from "../../service/config";
import { HttpClientService } from "../../service/http-client";
import { SessionData } from "./start-selftest.controller.i";
import { AppConfig } from "../../environment/app";
import { AssetStatusService, EAssetStatus, AssetStatus } from "../../service/asset-status";
import { BridgeEventListService } from "../../service/event-list";
import * as EventListParams from "../../service/event-list";

describe(StartSelfTestController.name, () => {
  let controller: StartSelfTestController;
  let tasksService: TasksService;
  let mqttPublishService: MqttPublishService;
  let guardStartDeployment: GuardStartSelfTest;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;

  class TasksServiceMock {
    public getSelfTestTask$ = jest.fn().mockReturnValue(empty());
    public updateSelfTestTaskToInprogress$ = jest.fn().mockReturnValue(empty());
    public insertSelfTest$ = jest.fn().mockReturnValue(empty());
    public updateSelfTestTaskAsset$ = jest.fn().mockReturnValue(empty());
    public updateSelfTestTask$ = jest.fn().mockReturnValue(empty());
    public updateSelfTestTaskStatus$ = jest.fn().mockReturnValue(empty());
  }

  class MqttPublishServiceMock {
    public sendSelfTestCommand$ = jest.fn().mockReturnValue(empty());
  }

  class GuardStartSelfTestMock {
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
    public selfTestTask = {
      insertExecute$: jest.fn().mockReturnValue(of(null)),
      insertFail$: jest.fn().mockReturnValue(of(null)),
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StartSelfTestController],
      providers: [
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: MqttPublishService, useClass: MqttPublishServiceMock },
        { provide: GuardStartSelfTest, useClass: GuardStartSelfTestMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: BridgeEventListService, useClass: BridgeEventListServiceMock },
      ],
    }).compile();

    controller = module.get(StartSelfTestController);
    tasksService = module.get(TasksService);
    mqttPublishService = module.get(MqttPublishService);
    guardStartDeployment = module.get(GuardStartSelfTest);
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

  describe(StartSelfTestController.prototype.post.name, () => {
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
          selftests: [
            {
              id: 1,
              taskId: "tata",
              assetId: "assetId",
              typeId: "typeId",
              subTypeId: "subTypeId",
              subAssetId: "subAssetId",
              status: ESelfTestStatus.Succeed,
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
              status: ESelfTestStatus.Succeed,
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
        } as SelfTestTask;
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

        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateSelfTestTaskToInprogress$").mockReturnValue(of(null));
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of(assetStatus));
        jest.spyOn(controller, "startSelfTest$").mockReturnValue(of(null));
        jest.spyOn(controller, "findTargetAsset").mockReturnValue(null);
        jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "sendSelfTest$").mockReturnValue(of(null));
        jest.spyOn(controller, "updateSelfTestTaskStatus$").mockReturnValue(of(null));

        arg = { taskId: "tata" };

        expected = {
          isPostBody: arg,
          getSelfTestTask: "tata",
          updateSelfTestTaskToInprogress: "tata",
          getMany: task.assets,
          startSelfTest: task.assets.map((t) => [task, t, assetStatus]),
          sendSelfTest: task.assets.map((t) => [task, t, assetStatus]),
          updateSelfTestTaskStatus: "tata",
          data: null,
        };
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should call isPostBody", () => {
        return act.then(() => expect(guardStartDeployment.isPostBody).toHaveBeenCalledWith(expected.isPostBody)).catch((e: any) => fail(e));
      });
      it("should call getSelfTestTask$", () => {
        return act
          .then(() => expect(tasksService.getSelfTestTask$).toHaveBeenCalledWith(expected.getSelfTestTask))
          .catch((e: any) => fail(e));
      });
      it("should call updateSelfTestTaskToInprogress$", () => {
        return act
          .then(() => expect(tasksService.updateSelfTestTaskToInprogress$).toHaveBeenCalledWith(expected.updateSelfTestTaskToInprogress))
          .catch((e: any) => fail(e));
      });
      it("should call getMany$", () => {
        return act.then(() => expect(assetStatusService.getMany$).toHaveBeenCalledWith(expected.getMany)).catch((e: any) => fail(e));
      });
      it("should call startSelfTest$", () => {
        return act
          .then(() => {
            expect(controller.startSelfTest$).toHaveBeenCalledTimes(2);
            expect(controller.startSelfTest$).toHaveBeenNthCalledWith(1, ...expected.startSelfTest[0]);
            expect(controller.startSelfTest$).toHaveBeenNthCalledWith(2, ...expected.startSelfTest[1]);
          })
          .catch((e: any) => fail(e));
      });
      it("should call updateSelfTestTaskStatus$", () => {
        return act
          .then(() => {
            expect(controller.updateSelfTestTaskStatus$).toHaveBeenCalledTimes(1);
            expect(controller.updateSelfTestTaskStatus$).toHaveBeenCalledWith(expected.updateSelfTestTaskStatus);
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
            expect(tasksService.getSelfTestTask$).not.toHaveBeenCalled();
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
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        arg = { taskId: "tata" };
        expected = null;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateSelfTestTaskToInprogress$", () => {
        return act
          .then((data: any) => {
            expect(tasksService.getSelfTestTask$).toHaveBeenCalled();
            expect(tasksService.updateSelfTestTaskToInprogress$).not.toHaveBeenCalled();
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
          selftests: [
            {
              id: 1,
              taskId: "tata",
              assetId: "assetId",
              typeId: "typeId",
              subTypeId: "subTypeId",
              subAssetId: "subAssetId",
              status: ESelfTestStatus.Succeed,
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
              status: ESelfTestStatus.Succeed,
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
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(tasksService, "updateSelfTestTaskToInprogress$").mockReturnValue(throwError(error));
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of([]));
        jest.spyOn(controller, "startSelfTest$").mockReturnValue(of(null));
        arg = { taskId: "tata" };
        expected = 123;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateSelfTestTaskToInprogress$", () => {
        return act
          .then((data: any) => fail(data))
          .catch((e: HttpException) => {
            expect(tasksService.updateSelfTestTaskToInprogress$).toHaveBeenCalled();
            expect(assetStatusService.getMany$).not.toHaveBeenCalled();
            expect(controller.startSelfTest$).not.toHaveBeenCalled();
            expect(e.getStatus()).toEqual(expected);
          });
      });
    });
  });

  describe(StartSelfTestController.prototype.startSelfTest$.name, () => {
    beforeEach(() => {
      jest.spyOn(controller, "saveEventLogExecute$").mockReturnValue(of(null));
      jest.spyOn(controller, "saveEventLogFail$").mockReturnValue(of(null));
    });

    describe("error occurs before execution", () => {
      it("end with SystemError if target asset does not have a child asset", () => {
        // arrange
        const task: SelfTestTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          selftests: [],
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
        jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));

        // act
        return (
          controller
            .startSelfTest$(task, task.assets[0], assetStatus)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateSelfTestTaskAsset$).toHaveBeenCalledWith(expected))
            .then(() => expect(controller.saveEventLogFail$).toHaveBeenCalledWith(expectedEventLog))
            .catch(fail)
        );
      });

      it("end with ConnectionError if target asset is missing", () => {
        // arrange
        const task: SelfTestTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          selftests: [],
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
        jest.spyOn(tasksService, "updateSelfTestTaskAsset$").mockReturnValue(of(null));

        // act
        return (
          controller
            .startSelfTest$(task, task.assets[0], assetStatus)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateSelfTestTaskAsset$).toHaveBeenCalledWith(expected))
            .then(() => expect(controller.saveEventLogFail$).toHaveBeenCalledWith(expectedEventLog))
            .catch(fail)
        );
      });
    });

    describe("normal pattern (1)", () => {
      let argSelfTestTask: SelfTestTask;
      let argSelfTestTaskAsset: SelfTestTaskAsset;
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
        argSelfTestTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          selftests: [],
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
        argSelfTestTaskAsset = {
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
        jest.spyOn(controller, "sendSelfTest$").mockReturnValue(of(null));
        // act
        act = controller.startSelfTest$(argSelfTestTask, argSelfTestTaskAsset, assetStatus).toPromise();
      });
      // assert
      it("should call sendSelfTest$", () => {
        return act
          .then(() => expect(controller.sendSelfTest$).toHaveBeenCalledWith(argSelfTestTask, argSelfTestTaskAsset, argSubAsset))
          .catch((e: any) => fail(e));
      });
    });

    describe("normal pattern (2)", () => {
      let argSelfTestTask: SelfTestTask;
      let argSelfTestTaskAsset: SelfTestTaskAsset;
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
        argSelfTestTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          selftests: [],
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
        argSelfTestTaskAsset = {
          id: 1,
          taskId: "tata",
          typeId: "typeId",
          assetId: "assetId",
          status: ETaskAssetStatus.Scheduled,
          startedAt: null as any,
          updatedAt: moment.utc(),
        };
        jest.spyOn(controller, "findTargetAsset").mockReturnValue(targetAsset);
        jest.spyOn(controller, "sendSelfTest$").mockReturnValue(of(null));
        // act
        act = controller.startSelfTest$(argSelfTestTask, argSelfTestTaskAsset, assetStatus).toPromise();
      });
      // assert
      it("should not call sendSelfTest$", () => {
        return act.then(() => expect(controller.sendSelfTest$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartSelfTestController.prototype.findTargetAsset.name, () => {
    it("return null if assets is not defined", () => {
      // arrage
      const typeId = "target-type";
      const assetId = "target-asset";
      const assets: AssetStatus[] = undefined as any;

      const taskAsset: SelfTestTaskAsset = {
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

      const taskAsset: SelfTestTaskAsset = {
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

      const taskAsset: SelfTestTaskAsset = {
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

      const taskAsset: SelfTestTaskAsset = {
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

      const taskAsset: SelfTestTaskAsset = {
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

  describe(StartSelfTestController.prototype.sendSelfTest$.name, () => {
    describe("normal pattern", () => {
      let argSelfTestTask: SelfTestTask;
      let argSelfTestTaskAsset: SelfTestTaskAsset;
      let argAssetStatus: AssetStatus;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const sessionResponse = { sessionId: "sese", topicPrefix: "toto" } as SessionData;
        const res = {};
        argSelfTestTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          createdBy: "createdBy",
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          selftests: [],
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
        argSelfTestTaskAsset = {
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
          insertSelfTest: {
            taskId: "tata",
            assetId: "assetId",
            typeId: "typeId",
            subTypeId: "typeId",
            subAssetId: "assetId",
            status: "",
            errorCode: "",
            errorMsg: "",
          },
          sendSelfTestCommand: {
            typeId: "typeId",
            assetId: "assetId",
            sessionId: "sese",
            sessionTopic: "toto",
            messageId: "tata",
          },
          data: null,
        };

        jest.spyOn(controller, "createSession$").mockReturnValue(of(sessionResponse));
        jest.spyOn(tasksService, "insertSelfTest$").mockReturnValue(of(null));
        jest.spyOn(mqttPublishService, "sendSelfTestCommand$").mockReturnValue(of(res as any));

        // act
        act = controller.sendSelfTest$(argSelfTestTask, argSelfTestTaskAsset, argAssetStatus).toPromise();
      });
      // assert
      it("should call createSession$", () => {
        return act
          .then(() => expect(controller.createSession$).toHaveBeenCalledWith(expected.createSession.typeId, expected.createSession.assetId))
          .catch((e: any) => fail(e));
      });
      it("should call insertSelfTest$", () => {
        return act
          .then(() => expect(tasksService.insertSelfTest$).toHaveBeenCalledWith(expected.insertSelfTest))
          .catch((e: any) => fail(e));
      });
      it("should call sendSelfTestCommand$", () => {
        return act
          .then(() => expect(mqttPublishService.sendSelfTestCommand$).toHaveBeenCalledWith(expected.sendSelfTestCommand))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartSelfTestController.prototype.computeTaskStatus.name, () => {
    describe("when all task-asset is Scheduled", () => {
      it("return Scheduled", () => {
        // arrange
        const arg = [
          { status: ETaskAssetStatus.Scheduled },
          { status: ETaskAssetStatus.Scheduled },
          { status: ETaskAssetStatus.Scheduled },
        ] as SelfTestTaskAsset[];
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
        ] as SelfTestTaskAsset[];
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
        ] as SelfTestTaskAsset[];
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
        ] as SelfTestTaskAsset[];
        const expected = ETaskStatus.Failure;
        // act
        const actual = controller.computeTaskStatus(arg);
        // assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe(StartSelfTestController.prototype.updateSelfTestTaskStatus$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ assetId: "1" }, { assetId: "2" }, { assetId: "3" }],
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Complete);
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          getSelfTestTask: "tata",
          computeTaskStatus: task.assets,
          updateTask: { taskId: "tata", status: ETaskStatus.Complete },
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
      it("should call computeTaskStatus$", () => {
        return act
          .then(() => expect(controller.computeTaskStatus).toHaveBeenCalledWith(expected.computeTaskStatus))
          .catch((e: any) => fail(e));
      });
      it("should call updateTask", () => {
        return act
          .then(() => expect(tasksService.updateSelfTestTask$).toHaveBeenCalledWith(expected.updateTask))
          .catch((e: any) => fail(e));
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
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Complete);
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateSelfTestTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateSelfTestTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getSelfTestTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).not.toHaveBeenCalled();
            expect(tasksService.updateSelfTestTask$).not.toHaveBeenCalled();
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
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.InProgress);
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateSelfTestTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateSelfTestTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getSelfTestTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).toHaveBeenCalled();
            expect(tasksService.updateSelfTestTask$).not.toHaveBeenCalled();
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
        } as SelfTestTask;
        jest.spyOn(tasksService, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Scheduled);
        jest.spyOn(tasksService, "updateSelfTestTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateSelfTestTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateSelfTestTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getSelfTestTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).toHaveBeenCalled();
            expect(tasksService.updateSelfTestTask$).not.toHaveBeenCalled();
          })
          .catch((e: any) => fail(e));
      });
      it("should return data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartSelfTestController.prototype.createSession$.name, () => {
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

  describe(StartSelfTestController.prototype.saveEventLogExecute$.name, () => {
    it("should complete successfully", () => {
      // arrange
      const params: EventListParams.CreateTaskParams & EventListParams.SelfTestTaskParams = {
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
      const params: EventListParams.CreateTaskParams & EventListParams.SelfTestTaskParams = {
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

      jest.spyOn(bridgeEventListService.selfTestTask, "insertExecute$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogExecute$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });

  describe(StartSelfTestController.prototype.saveEventLogFail$.name, () => {
    it("should complete successfully", () => {
      // arrange
      const params: EventListParams.FailTaskParams & EventListParams.SelfTestTaskParams = {
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
      const params: EventListParams.FailTaskParams & EventListParams.SelfTestTaskParams = {
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

      jest.spyOn(bridgeEventListService.selfTestTask, "insertFail$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogFail$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });
});
