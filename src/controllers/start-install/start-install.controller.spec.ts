import { Test, TestingModule } from "@nestjs/testing";
import { of, empty, throwError } from "rxjs";

import { AxiosResponse } from "axios";

import { StartInstallController } from "./start-install.controller";
import { GuardStartInstall } from "./start-install.controller.guard";
import {
  TasksService,
  ETaskStatus,
  DownloadPackageTask,
  DownloadPackageTaskAsset,
  ETaskAssetStatus,
  InstallTaskPackage,
} from "../../service/tasks";
import { IbmCosService } from "../../service/ibm-cos";
import { MqttPublishService, MqttReturnData, MqttCommandDownloadPackageDetail } from "../../service/mqtt-publish";
import { LoggerService } from "../../service/logger";
import { ConfigService } from "../../service/config";
import { HttpClientService } from "../../service/http-client";
import { AssetStatusService, AssetStatus, EAssetStatus } from "../../service/asset-status";
import { BridgeEventListService } from "../../service/event-list";
import { HttpException } from "@nestjs/common";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { Package } from "../../service/packages";
import { SessionData } from "../start-download-package/start-download-package.controller.i";
import { AppConfig } from "../../environment/app";
import * as EventListParams from "../../service/event-list";

describe(StartInstallController.name, () => {
  let controller: StartInstallController;
  let tasksService: TasksService;
  let ibmCosService: IbmCosService;
  let mqttPublishService: MqttPublishService;
  let guardStartDeployment: GuardStartInstall;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;

  class TasksServiceMock {
    public getInstallTask$ = jest.fn().mockReturnValue(empty());
    public updateInstallTaskToInprogress$ = jest.fn().mockReturnValue(empty());
    public updateInstallTaskAsset$ = jest.fn().mockReturnValue(empty());
  }

  class IbmCosServiceMock {
    public getObjectUrl$ = jest.fn().mockReturnValue(empty());
  }

  class MqttPublishServiceMock {
    public installCommand$ = jest.fn().mockReturnValue(empty());
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
    public installTask = {
      insertExecute$: jest.fn().mockReturnValue(of(null)),
      insertFail$: jest.fn().mockReturnValue(of(null)),
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StartInstallController],
      providers: [
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: IbmCosService, useClass: IbmCosServiceMock },
        { provide: MqttPublishService, useClass: MqttPublishServiceMock },
        { provide: GuardStartInstall, useClass: GuardStartDeploymentMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: BridgeEventListService, useClass: BridgeEventListServiceMock },
      ],
    }).compile();

    controller = module.get(StartInstallController);
    tasksService = module.get(TasksService);
    ibmCosService = module.get(IbmCosService);
    mqttPublishService = module.get(MqttPublishService);
    guardStartDeployment = module.get(GuardStartInstall);
    configService = module.get(ConfigService);
    loggerService = module.get(LoggerService);
    httpClientService = module.get(HttpClientService);
    assetStatusService = module.get(AssetStatusService);
    bridgeEventListService = module.get(BridgeEventListService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(tasksService).toBeDefined();
    expect(ibmCosService).toBeDefined();
    expect(mqttPublishService).toBeDefined();
    expect(guardStartDeployment).toBeDefined();
    expect(configService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(bridgeEventListService).toBeDefined();
  });

  describe(StartInstallController.prototype.post.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(guardStartDeployment, "isPostBody").mockReturnValue(true);
        const task = {
          id: "tata",
          status: ETaskStatus.Scheduled,
          package: { name: "package name", objectName: "obob", model: "model-name" },
          assets: [{ assetId: "1" }, { assetId: "2" }, { assetId: "3" }],
        } as any;
        jest.spyOn(tasksService, "getInstallTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateInstallTaskToInprogress$").mockReturnValue(of(null));
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of([]));
        jest.spyOn(controller, "install$").mockReturnValue(of(null));
        arg = { taskId: "tata" };
        expected = {
          isPostBody: arg,
          getInstallTask: "tata",
          updateInstallTaskToInprogress: task,
          install: task.assets.map((t: any) => ["tata", t, [], task.package]),
          updateTaskStatus: "tata",
          data: null,
        };
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should call isPostBody", () => {
        return act.then(() => expect(guardStartDeployment.isPostBody).toHaveBeenCalledWith(expected.isPostBody)).catch((e: any) => fail(e));
      });
      it("should call getInstallTask$", () => {
        return act
          .then(() => expect(tasksService.getInstallTask$).toHaveBeenCalledWith(expected.getInstallTask))
          .catch((e: any) => fail(e));
      });
      it("should call updateInstallTaskToInprogress$", () => {
        return act
          .then(() => expect(tasksService.updateInstallTaskToInprogress$).toHaveBeenCalledWith(expected.updateInstallTaskToInprogress))
          .catch((e: any) => fail(e));
      });
      it("should call install$", () => {
        return act
          .then(() => {
            expect(controller.install$).toHaveBeenCalledTimes(3);
            expect(controller.install$).toHaveBeenNthCalledWith(1, ...expected.install[0]);
            expect(controller.install$).toHaveBeenNthCalledWith(2, ...expected.install[1]);
            expect(controller.install$).toHaveBeenNthCalledWith(3, ...expected.install[2]);
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
            expect(tasksService.getInstallTask$).not.toHaveBeenCalled();
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
        } as DownloadPackageTask;
        jest.spyOn(tasksService, "getInstallTask$").mockReturnValue(of(task));
        arg = { taskId: "tata" };
        expected = null;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateTaskToInprogress$", () => {
        return act
          .then((data: any) => {
            expect(tasksService.getInstallTask$).toHaveBeenCalled();
            expect(tasksService.updateInstallTaskToInprogress$).not.toHaveBeenCalled();
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
          status: ETaskStatus.Scheduled,
          package: { objectName: "obob" },
          assets: [{ assetId: "1" }, { assetId: "2" }, { assetId: "3" }],
        } as any;
        jest.spyOn(tasksService, "getInstallTask$").mockReturnValue(of(task));
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(tasksService, "updateInstallTaskToInprogress$").mockReturnValue(throwError(error));
        arg = { taskId: "tata" };
        expected = 123;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateTaskToInprogress$", () => {
        return act
          .then((data: any) => fail(data))
          .catch((e: HttpException) => {
            expect(tasksService.updateInstallTaskToInprogress$).toHaveBeenCalled();
            expect(e.getStatus()).toEqual(expected);
          });
      });
    });
  });

  describe(StartInstallController.prototype.findTargetAsset.name, () => {
    it("return null if assets is not defined", () => {
      // arrage
      const typeId = "target-type";
      const assetId = "target-asset";
      const assets: AssetStatus[] = undefined as any;

      const taskAsset: DownloadPackageTaskAsset = {
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
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

      const taskAsset: DownloadPackageTaskAsset = {
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
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

      const taskAsset: DownloadPackageTaskAsset = {
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
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

      const taskAsset: DownloadPackageTaskAsset = {
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
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

      const taskAsset: DownloadPackageTaskAsset = {
        typeId,
        assetId,
        status: ETaskAssetStatus.Scheduled,
        startedAt: null as any,
        updatedAt: null as any,
      };

      // act
      const actual = controller.findTargetAsset(taskAsset, targetSubAssetType, assets);

      // assert
      expect(actual).toBeNull();
    });
  });

  describe(StartInstallController.prototype.install$.name, () => {
    beforeEach(() => {
      jest.spyOn(controller, "saveEventLogExecute$").mockReturnValue(of(null));
      jest.spyOn(controller, "saveEventLogFail$").mockReturnValue(of(null));
    });

    describe("error occurs before execution", () => {
      it("end with SystemError if target asset is not found", () => {
        // arrange
        const taskAsset: DownloadPackageTaskAsset = {
          typeId: "typeId desu",
          assetId: "assetId desu",
          status: ETaskAssetStatus.InProgress,
          startedAt: null as any,
          updatedAt: null as any,
        };
        const taskId = "taskId";
        const assets: AssetStatus[] = [];
        const pkg: InstallTaskPackage = { name: "package name" } as any;

        const expected = { typeId: taskAsset.typeId, assetId: taskAsset.assetId, taskId, status: ETaskAssetStatus.SystemError };
        const expectedEventLog = {
          taskId,
          typeId: taskAsset.typeId,
          assetId: taskAsset.assetId,
          packageName: pkg.name,
          errorResult: EventListParams.ETaskErrorResult.SystemError,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(null);
        jest.spyOn(tasksService, "updateInstallTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "createSession$").mockReturnValue(empty());

        // act
        return (
          controller
            .install$(taskId, taskAsset, assets, pkg)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateInstallTaskAsset$).toHaveBeenCalledWith(expected))
            .then(() => expect(controller.saveEventLogFail$).toHaveBeenCalledWith(expectedEventLog))
            .then(() => expect(controller.createSession$).not.toHaveBeenCalled())
            .catch(fail)
        );
      });

      it("end with ConnectionError if target asset is missing", () => {
        // arrange
        const taskAsset: DownloadPackageTaskAsset = {
          typeId: "typeId desu",
          assetId: "assetId desu",
          status: ETaskAssetStatus.InProgress,
          startedAt: null as any,
          updatedAt: null as any,
        };
        const taskId = "taskId desu";
        const assets: AssetStatus[] = [];
        const findTargetAssetResponse = { ...taskAsset, status: EAssetStatus.Missing };
        const pkg: Package = { name: "package name" } as any;

        const expected = { typeId: taskAsset.typeId, assetId: taskAsset.assetId, taskId, status: ETaskAssetStatus.ConnectionError };
        const expectedEventLog = {
          taskId,
          typeId: taskAsset.typeId,
          assetId: taskAsset.assetId,
          packageName: pkg.name,
          errorResult: EventListParams.ETaskErrorResult.ConnectionError,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(findTargetAssetResponse);
        jest.spyOn(tasksService, "updateInstallTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "createSession$").mockReturnValue(empty());

        // act
        return (
          controller
            .install$(taskId, taskAsset, assets, pkg)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateInstallTaskAsset$).toHaveBeenCalledWith(expected))
            .then(() => expect(controller.saveEventLogFail$).toHaveBeenCalledWith(expectedEventLog))
            .then(() => expect(controller.createSession$).not.toHaveBeenCalled())
            .catch(fail)
        );
      });
    });

    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const sessionResponse = { sessionId: "sese", topicPrefix: "toto" } as SessionData;
        const res = {} as MqttReturnData<MqttCommandDownloadPackageDetail>;
        arg = {
          taskId: "tata",
          taskAsset: {
            taskId: "tata",
            typeId: "tyty",
            assetId: "asas",
          } as any,
          model: "hoge",
          downloadUrlInfo: {
            protocol: "prpr",
            url: "urur",
            username: "usus",
            password: "papa",
          },
          pkg: {
            id: "packageId",
            name: "packageName",
            model: "model",
          },
        };
        expected = {
          createSession: {
            typeId: "tyty",
            assetId: "asas",
          },
          downloadPackageCommand: {
            typeId: "tyty",
            assetId: "asas",
            sessionTopic: "toto",
            sessionId: "sese",
            messageId: "tata",
            packageId: "packageId",
          },
          data: null,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(arg.taskAsset);
        jest.spyOn(controller, "createSession$").mockReturnValue(of(sessionResponse));
        jest.spyOn(mqttPublishService, "installCommand$").mockReturnValue(of(res));

        // act
        act = controller.install$(arg.taskId, arg.taskAsset, [], arg.pkg).toPromise();
      });
      // assert
      it("should call createSession$", () => {
        return act
          .then(() => expect(controller.createSession$).toHaveBeenCalledWith(expected.createSession.typeId, expected.createSession.assetId))
          .catch((e: any) => fail(e));
      });
      it("should call installCommand$", () => {
        return act
          .then(() => expect(mqttPublishService.installCommand$).toHaveBeenCalledWith(expected.downloadPackageCommand))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartInstallController.prototype.createSession$.name, () => {
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

  describe(StartInstallController.prototype.saveEventLogExecute$.name, () => {
    it("should complete successfully", () => {
      // arrange
      const params: EventListParams.CreateTaskParams & EventListParams.DownloadPackageTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        packageName: "package name des",
      };

      // act
      const p$ = controller.saveEventLogExecute$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).not.toHaveBeenCalled()).catch(fail);
    });

    it("should not throw error when error occurs", () => {
      // arrange
      const params: EventListParams.CreateTaskParams & EventListParams.DownloadPackageTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        packageName: "package name des",
      };
      const error = new Error("error des");
      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      jest.spyOn(bridgeEventListService.installTask, "insertExecute$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogExecute$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });

  describe(StartInstallController.prototype.saveEventLogFail$.name, () => {
    it("should complete successfully", () => {
      // arrange
      const params: EventListParams.FailTaskParams & EventListParams.DownloadPackageTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        packageName: "package name des",
        errorResult: EventListParams.ETaskErrorResult.ConnectionError,
      };

      // act
      const p$ = controller.saveEventLogFail$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).not.toHaveBeenCalled()).catch(fail);
    });

    it("should not throw error when error occurs", () => {
      // arrange
      const params: EventListParams.FailTaskParams & EventListParams.DownloadPackageTaskParams = {
        typeId: "type id des",
        assetId: "asset id des",
        taskId: "task id des",
        packageName: "package name des",
        errorResult: EventListParams.ETaskErrorResult.ConnectionError,
      };
      const error = new Error("error des");
      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      jest.spyOn(bridgeEventListService.installTask, "insertFail$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogFail$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });
});
