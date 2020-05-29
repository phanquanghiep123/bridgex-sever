import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common";
import moment from "moment";
import { of, throwError, empty } from "rxjs";
import { AxiosResponse } from "axios";

import { StartRetrieveLogController } from "./start-retrievelog.controller";
import { GuardStartRetrieveLog } from "./start-retrievelog.controller.guard";
import { TasksService, ETaskStatus, ETaskAssetStatus, ETaskLogType, ERetrieveLogsStatus, LogTask, LogTaskAsset } from "../../service/tasks";
import { MqttPublishService } from "../../service/mqtt-publish";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { ConfigService } from "../../service/config";
import { FtpConfig } from "../../environment/ftp";
import { HttpClientService } from "../../service/http-client";
import { SessionData } from "./start-retrievelog.controller.i";
import { AppConfig } from "../../environment/app";
import { AssetStatusService, EAssetStatus, AssetStatus } from "../../service/asset-status";
import { BridgeEventListService } from "../../service/event-list";
import * as EventListParams from "../../service/event-list";

describe(StartRetrieveLogController.name, () => {
  let controller: StartRetrieveLogController;
  let tasksService: TasksService;
  let mqttPublishService: MqttPublishService;
  let guardStartDeployment: GuardStartRetrieveLog;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;

  class TasksServiceMock {
    public getLogTask$ = jest.fn().mockReturnValue(empty());
    public updateLogTaskToInprogress$ = jest.fn().mockReturnValue(empty());
    public insertTaskLogRetrievelog$ = jest.fn().mockReturnValue(empty());
    public updateLogTaskAsset$ = jest.fn().mockReturnValue(empty());
    public updateLogTask$ = jest.fn().mockReturnValue(empty());
  }

  class MqttPublishServiceMock {
    public uploadRetrieveLogCommand$ = jest.fn().mockReturnValue(empty());
  }

  class GuardStartDeploymentMock {
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
    public retrieveLogTask = {
      insertExecute$: jest.fn().mockReturnValue(of(null)),
      insertFail$: jest.fn().mockReturnValue(of(null)),
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StartRetrieveLogController],
      providers: [
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: MqttPublishService, useClass: MqttPublishServiceMock },
        { provide: GuardStartRetrieveLog, useClass: GuardStartDeploymentMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: BridgeEventListService, useClass: BridgeEventListServiceMock },
      ],
    }).compile();

    controller = module.get(StartRetrieveLogController);
    tasksService = module.get(TasksService);
    mqttPublishService = module.get(MqttPublishService);
    guardStartDeployment = module.get(GuardStartRetrieveLog);
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

  describe(StartRetrieveLogController.prototype.post.name, () => {
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
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [
            {
              id: 1,
              taskId: "tata",
              assetId: "assetId",
              typeId: "typeId",
              status: ERetrieveLogsStatus.Succeed,
              errorCode: "errorCode",
              errorMessage: "errorMessage",
              filePath: "filePath",
              createdAt: moment.utc(),
            },
            {
              id: 2,
              taskId: "tata",
              assetId: "assetId",
              typeId: "typeId",
              status: ERetrieveLogsStatus.Succeed,
              errorCode: "errorCode",
              errorMessage: "errorMessage",
              filePath: "filePath",
              createdAt: moment.utc(),
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
        } as LogTask;
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
        const url = { type: ["Trace"], protocol: "prpr", url: "urur", filename: "fifi", username: "usus", password: "papa" };

        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateLogTaskToInprogress$").mockReturnValue(of(null));
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of(assetStatus));
        jest.spyOn(controller, "startRetrieveLog$").mockReturnValue(of(null));
        jest.spyOn(controller, "findTargetAsset").mockReturnValue(null);
        jest.spyOn(tasksService, "updateLogTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "uploadRetrieveLog$").mockReturnValue(of(null));
        jest.spyOn(controller, "getUploadRetrieveLogUrl$").mockReturnValue(of(url));
        jest.spyOn(controller, "updateLogTaskStatus$").mockReturnValue(of(null));

        arg = { taskId: "tata" };

        expected = {
          isPostBody: arg,
          getLogTask: "tata",
          updateLogTaskToInprogress: "tata",
          getMany: task.assets,
          startRetrieveLog: task.assets.map((t) => [task, t, assetStatus]),
          getUploadRetrieveLogUrl: task.assets.map((t) => [task, t]),
          uploadRetrieveLog: task.assets.map((t) => [t, url, assetStatus]),
          updateLogTaskStatus: "tata",
          data: null,
        };
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should call isPostBody", () => {
        return act.then(() => expect(guardStartDeployment.isPostBody).toHaveBeenCalledWith(expected.isPostBody)).catch((e: any) => fail(e));
      });
      it("should call getLogTask$", () => {
        return act.then(() => expect(tasksService.getLogTask$).toHaveBeenCalledWith(expected.getLogTask)).catch((e: any) => fail(e));
      });
      it("should call updateLogTaskToInprogress$", () => {
        return act
          .then(() => expect(tasksService.updateLogTaskToInprogress$).toHaveBeenCalledWith(expected.updateLogTaskToInprogress))
          .catch((e: any) => fail(e));
      });
      it("should call getMany$", () => {
        return act.then(() => expect(assetStatusService.getMany$).toHaveBeenCalledWith(expected.getMany)).catch((e: any) => fail(e));
      });
      it("should call startRetrieveLog$", () => {
        return act
          .then(() => {
            expect(controller.startRetrieveLog$).toHaveBeenCalledTimes(2);
            expect(controller.startRetrieveLog$).toHaveBeenNthCalledWith(1, ...expected.startRetrieveLog[0]);
            expect(controller.startRetrieveLog$).toHaveBeenNthCalledWith(2, ...expected.startRetrieveLog[1]);
          })
          .catch((e: any) => fail(e));
      });
      it("should call updateLogTaskStatus$", () => {
        return act
          .then(() => {
            expect(controller.updateLogTaskStatus$).toHaveBeenCalledTimes(1);
            expect(controller.updateLogTaskStatus$).toHaveBeenCalledWith(expected.updateLogTaskStatus);
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
            expect(tasksService.getLogTask$).not.toHaveBeenCalled();
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
        } as LogTask;
        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task));
        arg = { taskId: "tata" };
        expected = null;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateLogTaskToInprogress$", () => {
        return act
          .then((data: any) => {
            expect(tasksService.getLogTask$).toHaveBeenCalled();
            expect(tasksService.updateLogTaskToInprogress$).not.toHaveBeenCalled();
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
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [
            {
              id: 1,
              taskId: "tata",
              assetId: "assetId1",
              typeId: "typeId1",
              status: ERetrieveLogsStatus.Succeed,
              errorCode: "errorCode",
              errorMessage: "errorMessage",
              filePath: "filePath",
              createdAt: moment.utc(),
            },
            {
              id: 2,
              taskId: "tata",
              assetId: "assetId2",
              typeId: "typeId2",
              status: ERetrieveLogsStatus.Succeed,
              errorCode: "errorCode",
              errorMessage: "errorMessage",
              filePath: "filePath",
              createdAt: moment.utc(),
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
        } as LogTask;
        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task));
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(tasksService, "updateLogTaskToInprogress$").mockReturnValue(throwError(error));
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of([]));
        jest.spyOn(controller, "startRetrieveLog$").mockReturnValue(of(null));
        arg = { taskId: "tata" };
        expected = 123;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateLogTaskToInprogress$", () => {
        return act
          .then((data: any) => fail(data))
          .catch((e: HttpException) => {
            expect(tasksService.updateLogTaskToInprogress$).toHaveBeenCalled();
            expect(assetStatusService.getMany$).not.toHaveBeenCalled();
            expect(controller.startRetrieveLog$).not.toHaveBeenCalled();
            expect(e.getStatus()).toEqual(expected);
          });
      });
    });
  });

  describe(StartRetrieveLogController.prototype.startRetrieveLog$.name, () => {
    beforeEach(() => {
      jest.spyOn(controller, "saveEventLogExecute$").mockReturnValue(of(null));
      jest.spyOn(controller, "saveEventLogFail$").mockReturnValue(of(null));
    });

    describe("error occurs before execution", () => {
      it("end with SystemError if target asset does not have a child asset", () => {
        // arrange
        const task: LogTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [],
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
          logType: task.logType,
          errorResult: EventListParams.ETaskErrorResult.SystemError,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(null);
        jest.spyOn(tasksService, "updateLogTaskAsset$").mockReturnValue(of(null));

        // act
        return (
          controller
            .startRetrieveLog$(task, task.assets[0], assetStatus)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateLogTaskAsset$).toHaveBeenCalledWith(expected))
            .then(() => expect(controller.saveEventLogFail$).toHaveBeenCalledWith(expectedEventLog))
            .catch(fail)
        );
      });

      it("end with ConnectionError if target asset is missing", () => {
        // arrange
        const task: LogTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [],
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
          logType: task.logType,
          errorResult: EventListParams.ETaskErrorResult.ConnectionError,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(targetAsset);
        jest.spyOn(tasksService, "updateLogTaskAsset$").mockReturnValue(of(null));

        // act
        return (
          controller
            .startRetrieveLog$(task, task.assets[0], assetStatus)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateLogTaskAsset$).toHaveBeenCalledWith(expected))
            .then(() => expect(controller.saveEventLogFail$).toHaveBeenCalledWith(expectedEventLog))
            .catch(fail)
        );
      });
    });

    describe("normal pattern (1)", () => {
      let argLogTask: LogTask;
      let argLogTaskAsset: LogTaskAsset;
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
        argLogTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [],
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
        argLogTaskAsset = {
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
        jest.spyOn(controller, "uploadRetrieveLog$").mockReturnValue(of(null));
        // act
        act = controller.startRetrieveLog$(argLogTask, argLogTaskAsset, assetStatus).toPromise();
      });
      // assert
      it("should call uploadRetrieveLog$", () => {
        return act
          .then(() => expect(controller.uploadRetrieveLog$).toHaveBeenCalledWith(argLogTask, argSubAsset))
          .catch((e: any) => fail(e));
      });
    });

    describe("normal pattern (2)", () => {
      let argLogTask: LogTask;
      let argLogTaskAsset: LogTaskAsset;
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
        argLogTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [],
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
        argLogTaskAsset = {
          id: 1,
          taskId: "tata",
          typeId: "typeId",
          assetId: "assetId",
          status: ETaskAssetStatus.Scheduled,
          startedAt: null as any,
          updatedAt: moment.utc(),
        };
        jest.spyOn(controller, "findTargetAsset").mockReturnValue(targetAsset);
        jest.spyOn(controller, "uploadRetrieveLog$").mockReturnValue(of(null));
        // act
        act = controller.startRetrieveLog$(argLogTask, argLogTaskAsset, assetStatus).toPromise();
      });
      // assert
      it("should not call uploadRetrieveLog$", () => {
        return act.then(() => expect(controller.uploadRetrieveLog$).not.toHaveBeenCalled()).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartRetrieveLogController.prototype.findTargetAsset.name, () => {
    it("return null if assets is not defined", () => {
      // arrage
      const typeId = "target-type";
      const assetId = "target-asset";
      const assets: AssetStatus[] = undefined as any;

      const taskAsset: LogTaskAsset = {
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

      const taskAsset: LogTaskAsset = {
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

      const taskAsset: LogTaskAsset = {
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

      const taskAsset: LogTaskAsset = {
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

      const taskAsset: LogTaskAsset = {
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

  describe(StartRetrieveLogController.prototype.getUploadRetrieveLogUrl$.name, () => {
    describe("normal pattern", () => {
      let argLogTask: LogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const ftpConfigMock = {
          protocol: "prpr",
          host: "hoho",
          port: 123,
          pathPrefix: "papa",
          user: "usus",
          pass: "psps",
        } as FtpConfig;
        const assetStatus = { typeId: "typeId", assetId: "assetId", status: EAssetStatus.Good } as AssetStatus;
        jest.spyOn(configService, "ftpConfig").mockReturnValue(ftpConfigMock);
        argLogTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [],
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
        expected = {
          type: ["Trace"],
          protocol: "prpr",
          url: "prpr://hoho:123/tata/",
          filename: "typeId-assetId.tar.gz",
          username: "usus",
          password: "psps",
        };
        // act
        act = controller.getUploadRetrieveLogUrl$(argLogTask, assetStatus).toPromise();
      });
      // assert
      it("should call ftpConfig$", () => {
        return act.then(() => expect(configService.ftpConfig).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should return download log url info", () => {
        return act.then((data: any) => expect(data).toEqual(expected)).catch((e: any) => fail(e));
      });
    });

    describe("when port and pathPrefix are nothing", () => {
      let argLogTask: LogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const ftpConfigMock = {
          protocol: "prpr",
          host: "hoho",
          user: "usus",
          pass: "psps",
        } as FtpConfig;
        const assetStatus = { typeId: "typeId", assetId: "assetId", status: EAssetStatus.Good } as AssetStatus;
        jest.spyOn(configService, "ftpConfig").mockReturnValue(ftpConfigMock);
        argLogTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.Scheduled,
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [],
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
        expected = {
          type: ["Trace"],
          protocol: "prpr",
          url: "prpr://hoho/tata/",
          filename: "typeId-assetId.tar.gz",
          username: "usus",
          password: "psps",
        };
        // act
        act = controller.getUploadRetrieveLogUrl$(argLogTask, assetStatus).toPromise();
      });
      // assert
      it("should return download log url info", () => {
        return act.then((data: any) => expect(data).toEqual(expected)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartRetrieveLogController.prototype.uploadRetrieveLog$.name, () => {
    describe("normal pattern", () => {
      let argLogTask: LogTask;
      let argAssetStatus: AssetStatus;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const sessionResponse = { sessionId: "sese", topicPrefix: "toto" } as SessionData;
        const res = {};
        const url = { type: ["Trace"], protocol: "prpr", url: "urur", filename: "fifi", username: "usus", password: "papa" };
        argLogTask = {
          id: 1,
          taskId: "tata",
          status: ETaskStatus.InProgress,
          logType: ETaskLogType.Trace,
          memo: "memo",
          createdAt: moment.utc(),
          updatedAt: moment.utc(),
          logs: [],
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
          insertLogTaskRetrievelog: {
            taskId: "tata",
            assetId: "assetId",
            typeId: "typeId",
            filePath: "ururfifi",
          },
          uploadRetrieveLogCommand: {
            typeId: "typeId",
            assetId: "assetId",
            sessionId: "sese",
            sessionTopic: "toto",
            messageId: "tata",
            type: ["Trace"],
            protocol: "prpr",
            url: "urur",
            filename: "fifi",
            username: "usus",
            password: "papa",
          },
          data: null,
        };

        jest.spyOn(controller, "createSession$").mockReturnValue(of(sessionResponse));
        jest.spyOn(controller, "getUploadRetrieveLogUrl$").mockReturnValue(of(url));
        jest.spyOn(tasksService, "insertTaskLogRetrievelog$").mockReturnValue(of(null));
        jest.spyOn(mqttPublishService, "uploadRetrieveLogCommand$").mockReturnValue(of(res as any));

        // act
        act = controller.uploadRetrieveLog$(argLogTask, argAssetStatus).toPromise();
      });
      // assert
      it("should call createSession$", () => {
        return act
          .then(() => expect(controller.createSession$).toHaveBeenCalledWith(expected.createSession.typeId, expected.createSession.assetId))
          .catch((e: any) => fail(e));
      });
      it("should call getUploadRetrieveLogUrl$", () => {
        return act
          .then(() => expect(controller.getUploadRetrieveLogUrl$).toHaveBeenCalledWith(argLogTask, argAssetStatus))
          .catch((e: any) => fail(e));
      });
      it("should call insertTaskLogRetrievelog$", () => {
        return act
          .then(() => expect(tasksService.insertTaskLogRetrievelog$).toHaveBeenCalledWith(expected.insertLogTaskRetrievelog))
          .catch((e: any) => fail(e));
      });
      it("should call uploadRetrieveLogCommand$", () => {
        return act
          .then(() => expect(mqttPublishService.uploadRetrieveLogCommand$).toHaveBeenCalledWith(expected.uploadRetrieveLogCommand))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartRetrieveLogController.prototype.computeTaskStatus.name, () => {
    describe("when all task-asset is Scheduled", () => {
      it("return Scheduled", () => {
        // arrange
        const arg = [
          { status: ETaskAssetStatus.Scheduled },
          { status: ETaskAssetStatus.Scheduled },
          { status: ETaskAssetStatus.Scheduled },
        ] as LogTaskAsset[];
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
        ] as LogTaskAsset[];
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
        ] as LogTaskAsset[];
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
        ] as LogTaskAsset[];
        const expected = ETaskStatus.Failure;
        // act
        const actual = controller.computeTaskStatus(arg);
        // assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe(StartRetrieveLogController.prototype.updateLogTaskStatus$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const task = {
          status: ETaskStatus.InProgress,
          assets: [{ assetId: "1" }, { assetId: "2" }, { assetId: "3" }],
        } as LogTask;
        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Complete);
        jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          getLogTask: "tata",
          computeTaskStatus: task.assets,
          updateTask: { taskId: "tata", status: ETaskStatus.Complete },
          data: null,
        };
        // act
        act = controller.updateLogTaskStatus$(arg).toPromise();
      });
      // assert
      it("should call getLogTask$", () => {
        return act.then(() => expect(tasksService.getLogTask$).toHaveBeenCalledWith(expected.getLogTask)).catch((e: any) => fail(e));
      });
      it("should call computeTaskStatus$", () => {
        return act
          .then(() => expect(controller.computeTaskStatus).toHaveBeenCalledWith(expected.computeTaskStatus))
          .catch((e: any) => fail(e));
      });
      it("should call updateTask", () => {
        return act.then(() => expect(tasksService.updateLogTask$).toHaveBeenCalledWith(expected.updateTask)).catch((e: any) => fail(e));
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
        } as LogTask;
        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Complete);
        jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateLogTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateLogTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getLogTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).not.toHaveBeenCalled();
            expect(tasksService.updateLogTask$).not.toHaveBeenCalled();
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
        } as LogTask;
        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.InProgress);
        jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateLogTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateLogTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getLogTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).toHaveBeenCalled();
            expect(tasksService.updateLogTask$).not.toHaveBeenCalled();
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
        } as LogTask;
        jest.spyOn(tasksService, "getLogTask$").mockReturnValue(of(task));
        jest.spyOn(controller, "computeTaskStatus").mockReturnValue(ETaskStatus.Scheduled);
        jest.spyOn(tasksService, "updateLogTask$").mockReturnValue(of(null));
        arg = "tata";
        expected = {
          data: null,
        };
        // act
        act = controller.updateLogTaskStatus$(arg).toPromise();
      });
      // assert
      it("should not call updateLogTask$", () => {
        return act
          .then(() => {
            expect(tasksService.getLogTask$).toHaveBeenCalled();
            expect(controller.computeTaskStatus).toHaveBeenCalled();
            expect(tasksService.updateLogTask$).not.toHaveBeenCalled();
          })
          .catch((e: any) => fail(e));
      });
      it("should return data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartRetrieveLogController.prototype.createSession$.name, () => {
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

  describe(StartRetrieveLogController.prototype.saveEventLogExecute$.name, () => {
    it("should complete successfully", () => {
      // arrange
      const params: EventListParams.CreateTaskParams & EventListParams.RetrieveLogTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        logType: "log type des",
      };

      // act
      const p$ = controller.saveEventLogExecute$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).not.toHaveBeenCalled()).catch(fail);
    });

    it("should not throw error when error occurs", () => {
      // arrange
      const params: EventListParams.CreateTaskParams & EventListParams.RetrieveLogTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        logType: "log type des",
      };
      const error = new Error("error des");
      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      jest.spyOn(bridgeEventListService.retrieveLogTask, "insertExecute$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogExecute$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });

  describe(StartRetrieveLogController.prototype.saveEventLogFail$.name, () => {
    it("should complete successfully", () => {
      // arrange
      const params: EventListParams.FailTaskParams & EventListParams.RetrieveLogTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        logType: "log type des",
        errorResult: EventListParams.ETaskErrorResult.ConnectionError,
      };

      // act
      const p$ = controller.saveEventLogFail$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).not.toHaveBeenCalled()).catch(fail);
    });

    it("should not throw error when error occurs", () => {
      // arrange
      const params: EventListParams.FailTaskParams & EventListParams.RetrieveLogTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        logType: "log type des",
        errorResult: EventListParams.ETaskErrorResult.ConnectionError,
      };
      const error = new Error("error des");
      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      jest.spyOn(bridgeEventListService.retrieveLogTask, "insertFail$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogFail$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });
});
