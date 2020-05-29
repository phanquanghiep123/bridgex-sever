import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common";
import { of, throwError, empty } from "rxjs";
import { AxiosResponse } from "axios";

import { StartDownloadPackageController } from "./start-download-package.controller";
import { GuardStartDownloadPackage } from "./start-download-package.controller.guard";
import {
  TasksService,
  DownloadPackageTask,
  ETaskStatus,
  DownloadPackageTaskAsset,
  ETaskAssetStatus,
  DownloadPackageTaskPackage,
} from "../../service/tasks";
import { IbmCosService } from "../../service/ibm-cos";
import { MqttPublishService, MqttCommandDownloadPackageDetail, MqttReturnData } from "../../service/mqtt-publish";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { ConfigService } from "../../service/config";
import { FtpConfig } from "../../environment/ftp";
import { HttpClientService } from "../../service/http-client";
import { SessionData } from "./start-download-package.controller.i";
import { AppConfig } from "../../environment/app";
import { AssetStatusService, EAssetStatus, AssetStatus } from "../../service/asset-status";
import { BridgeEventListService } from "../../service/event-list";
import * as EventListParams from "../../service/event-list";
import { Package } from "../../service/packages";

describe(StartDownloadPackageController.name, () => {
  let controller: StartDownloadPackageController;
  let tasksService: TasksService;
  let ibmCosService: IbmCosService;
  let mqttPublishService: MqttPublishService;
  let guardStartDeployment: GuardStartDownloadPackage;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let httpClientService: HttpClientService;
  let assetStatusService: AssetStatusService;
  let bridgeEventListService: BridgeEventListService;

  class TasksServiceMock {
    public getDownloadPackageTask$ = jest.fn().mockReturnValue(empty());
    public updateDownloadPackageTaskToInprogress$ = jest.fn().mockReturnValue(empty());
    public updateDownloadPackageTaskAsset$ = jest.fn().mockReturnValue(empty());
    public updateDownloadPackageTask$ = jest.fn().mockReturnValue(empty());
  }

  class IbmCosServiceMock {
    public getObjectUrl$ = jest.fn().mockReturnValue(empty());
  }

  class MqttPublishServiceMock {
    public downloadPackageCommand$ = jest.fn().mockReturnValue(empty());
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
    public downloadPackageTask = {
      insertExecute$: jest.fn().mockReturnValue(of(null)),
      insertFail$: jest.fn().mockReturnValue(of(null)),
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StartDownloadPackageController],
      providers: [
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: IbmCosService, useClass: IbmCosServiceMock },
        { provide: MqttPublishService, useClass: MqttPublishServiceMock },
        { provide: GuardStartDownloadPackage, useClass: GuardStartDeploymentMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: BridgeEventListService, useClass: BridgeEventListServiceMock },
      ],
    }).compile();

    controller = module.get(StartDownloadPackageController);
    tasksService = module.get(TasksService);
    ibmCosService = module.get(IbmCosService);
    mqttPublishService = module.get(MqttPublishService);
    guardStartDeployment = module.get(GuardStartDownloadPackage);
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

  describe(StartDownloadPackageController.prototype.post.name, () => {
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
        jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task));
        jest.spyOn(tasksService, "updateDownloadPackageTaskToInprogress$").mockReturnValue(of(null));
        const url = { protocol: "prpr", url: "urur", username: "usus", password: "papa" };
        jest.spyOn(controller, "getDownloadPackageUrl$").mockReturnValue(of(url));
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of([]));
        jest.spyOn(controller, "downloadPackage$").mockReturnValue(of(null));
        arg = { taskId: "tata" };
        expected = {
          isPostBody: arg,
          getDownloadPackageTask: "tata",
          updateDownloadPackageTaskToInprogress: task,
          getDownloadPackageUrl: task.package,
          downloadPackage: task.assets.map((t: any) => ["tata", t, url, [], task.package]),
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
      it("should call getDownloadPackageTask$", () => {
        return act
          .then(() => expect(tasksService.getDownloadPackageTask$).toHaveBeenCalledWith(expected.getDownloadPackageTask))
          .catch((e: any) => fail(e));
      });
      it("should call updateDownloadPackageTaskToInprogress$", () => {
        return act
          .then(() =>
            expect(tasksService.updateDownloadPackageTaskToInprogress$).toHaveBeenCalledWith(
              expected.updateDownloadPackageTaskToInprogress,
            ),
          )
          .catch((e: any) => fail(e));
      });
      it("should call getDownloadPackageUrl$", () => {
        return act
          .then(() => expect(controller.getDownloadPackageUrl$).toHaveBeenCalledWith(expected.getDownloadPackageUrl))
          .catch((e: any) => fail(e));
      });
      it("should call downloadPackage$", () => {
        return act
          .then(() => {
            expect(controller.downloadPackage$).toHaveBeenCalledTimes(3);
            expect(controller.downloadPackage$).toHaveBeenNthCalledWith(1, ...expected.downloadPackage[0]);
            expect(controller.downloadPackage$).toHaveBeenNthCalledWith(2, ...expected.downloadPackage[1]);
            expect(controller.downloadPackage$).toHaveBeenNthCalledWith(3, ...expected.downloadPackage[2]);
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
            expect(tasksService.getDownloadPackageTask$).not.toHaveBeenCalled();
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
        jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task));
        arg = { taskId: "tata" };
        expected = null;
        // act
        act = controller.post(arg).toPromise();
      });
      // assert
      it("should not call updateTaskToInprogress$", () => {
        return act
          .then((data: any) => {
            expect(tasksService.getDownloadPackageTask$).toHaveBeenCalled();
            expect(tasksService.updateDownloadPackageTaskToInprogress$).not.toHaveBeenCalled();
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
        jest.spyOn(tasksService, "getDownloadPackageTask$").mockReturnValue(of(task));
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(tasksService, "updateDownloadPackageTaskToInprogress$").mockReturnValue(throwError(error));
        jest.spyOn(controller, "getDownloadPackageUrl$").mockReturnValue(of(null as any));
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
            expect(tasksService.updateDownloadPackageTaskToInprogress$).toHaveBeenCalled();
            expect(controller.getDownloadPackageUrl$).not.toHaveBeenCalled();
            expect(e.getStatus()).toEqual(expected);
          });
      });
    });
  });

  describe(StartDownloadPackageController.prototype.findTargetAsset.name, () => {
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

  describe(StartDownloadPackageController.prototype.getDownloadPackageUrl$.name, () => {
    describe("normal pattern", () => {
      let arg: DownloadPackageTaskPackage;
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
        jest.spyOn(configService, "ftpConfig").mockReturnValue(ftpConfigMock);
        arg = {
          ftpFilePath: "ftft",
        } as any;
        expected = {
          protocol: "prpr",
          url: "prpr://hoho:123/ftft",
          username: "usus",
          password: "psps",
        };
        // act
        act = controller.getDownloadPackageUrl$(arg).toPromise();
      });
      // assert
      it("should call ftpConfig$", () => {
        return act.then(() => expect(configService.ftpConfig).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should return download package url info", () => {
        return act.then((data: any) => expect(data).toEqual(expected)).catch((e: any) => fail(e));
      });
    });

    describe("when port and pathPrefix are nothing", () => {
      let arg: DownloadPackageTaskPackage;
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
        jest.spyOn(configService, "ftpConfig").mockReturnValue(ftpConfigMock);
        arg = {
          ftpFilePath: "ftft",
        } as any;
        expected = {
          protocol: "prpr",
          url: "prpr://hoho/ftft",
          username: "usus",
          password: "psps",
        };
        // act
        act = controller.getDownloadPackageUrl$(arg).toPromise();
      });
      // assert
      it("should return download package url info", () => {
        return act.then((data: any) => expect(data).toEqual(expected)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartDownloadPackageController.prototype.downloadPackage$.name, () => {
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
        const downloadUrlInfo = null as any;
        const assets: AssetStatus[] = [];
        const pkg: DownloadPackageTaskPackage = { name: "package name" } as any;

        const expected = { typeId: taskAsset.typeId, assetId: taskAsset.assetId, taskId, status: ETaskAssetStatus.SystemError };
        const expectedEventLog = {
          taskId,
          typeId: taskAsset.typeId,
          assetId: taskAsset.assetId,
          packageName: pkg.name,
          errorResult: EventListParams.ETaskErrorResult.SystemError,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(null);
        jest.spyOn(tasksService, "updateDownloadPackageTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "createSession$").mockReturnValue(empty());

        // act
        return (
          controller
            .downloadPackage$(taskId, taskAsset, downloadUrlInfo, assets, pkg)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateDownloadPackageTaskAsset$).toHaveBeenCalledWith(expected))
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
        const downloadUrlInfo = null as any;
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
        jest.spyOn(tasksService, "updateDownloadPackageTaskAsset$").mockReturnValue(of(null));
        jest.spyOn(controller, "createSession$").mockReturnValue(empty());

        // act
        return (
          controller
            .downloadPackage$(taskId, taskAsset, downloadUrlInfo, assets, pkg)
            .toPromise()
            // assert
            .then(() => expect(tasksService.updateDownloadPackageTaskAsset$).toHaveBeenCalledWith(expected))
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
            protocol: "prpr",
            packageId: "packageId",
            url: "urur",
            username: "usus",
            password: "papa",
          },
          data: null,
        };

        jest.spyOn(controller, "findTargetAsset").mockReturnValue(arg.taskAsset);
        jest.spyOn(controller, "createSession$").mockReturnValue(of(sessionResponse));
        jest.spyOn(mqttPublishService, "downloadPackageCommand$").mockReturnValue(of(res));

        // act
        act = controller.downloadPackage$(arg.taskId, arg.taskAsset, arg.downloadUrlInfo, [], arg.pkg).toPromise();
      });
      // assert
      it("should call createSession$", () => {
        return act
          .then(() => expect(controller.createSession$).toHaveBeenCalledWith(expected.createSession.typeId, expected.createSession.assetId))
          .catch((e: any) => fail(e));
      });
      it("should call downloadPackageCommand$", () => {
        return act
          .then(() => expect(mqttPublishService.downloadPackageCommand$).toHaveBeenCalledWith(expected.downloadPackageCommand))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(StartDownloadPackageController.prototype.createSession$.name, () => {
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

  describe(StartDownloadPackageController.prototype.saveEventLogExecute$.name, () => {
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

      jest.spyOn(bridgeEventListService.downloadPackageTask, "insertExecute$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogExecute$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });

  describe(StartDownloadPackageController.prototype.saveEventLogFail$.name, () => {
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

      jest.spyOn(bridgeEventListService.downloadPackageTask, "insertFail$").mockReturnValue(throwError(error));

      // act
      const p$ = controller.saveEventLogFail$(params).toPromise();

      // assert
      return p$.then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected)).catch(fail);
    });
  });
});
