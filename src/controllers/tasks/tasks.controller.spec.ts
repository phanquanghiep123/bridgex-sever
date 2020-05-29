/* eslint-disable @typescript-eslint/camelcase */
import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common/exceptions";
import { of, throwError, empty } from "rxjs";
import { tap } from "rxjs/operators";
import express, { Request } from "express";

import { TasksController } from "./tasks.controller";
import {
  ETaskType,
  ETaskAssetStatus,
  TaskResponseBody,
  PostDeploymentTaskBody,
  PostLogTaskBody,
  PostRebootSelfTestTaskBody,
  ERetrieveLogsStatus,
} from "./tasks.controller.i";
import { UserAuthService } from "../../service/user-auth";
import { GuardTasks } from "./tasks.controller.guard";
import {
  TasksService,
  GetDepolymentTasksParam,
  GetTasks,
  ETaskStatus,
  InsertDownloadPackageTaskParams,
  InsertLogTaskParams,
  InsertInstallTaskParams,
  GetTask,
  InsertRebootSelfTestTaskParams,
} from "../../service/tasks";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { ErrorCode, BridgeXServerError } from "../../service/utils";

import { ConfigService } from "../../service/config";
import { HttpClientService } from "../../service/http-client";
import { AppConfig } from "../../environment/app";
import { PackagesService } from "../../service/packages";
import { BridgeEventListService } from "../../service/event-list";

describe(TasksController.name, () => {
  let controller: TasksController;
  let tasksService: TasksService;
  let userAuthService: UserAuthService;
  let guardTasks: GuardTasks;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let httpClientService: HttpClientService;
  let packagesService: PackagesService;
  let bridgeEventListService: BridgeEventListService;

  let res: express.Response;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class TasksServiceMock {
    public get$ = jest.fn();
    public getTask$ = jest.fn();
  }
  class UserAuthServiceMock {}

  class GuardTasksMock {
    public isGetTaskParams = jest.fn(() => false);
    public isPostBody = jest.fn(() => false);
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
    public post$ = jest.fn();
  }

  class PackagesServiceMock {
    public getMany$ = jest.fn(() => of([]));
  }

  class BridgeEventListServiceMock {
    public downloadPackageTask = {
      insertCreate$: jest.fn(() => of(null)),
    };

    public installTask = {
      insertCreate$: jest.fn(() => of(null)),
    };

    public retrieveLogTask = {
      insertCreate$: jest.fn(() => of(null)),
    };

    public rebootTask = {
      insertCreate$: jest.fn(() => of(null)),
    };

    public selfTestTask = {
      insertCreate$: jest.fn(() => of(null)),
    };
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useClass: TasksServiceMock },
        { provide: UserAuthService, useClass: UserAuthServiceMock },
        { provide: GuardTasks, useClass: GuardTasksMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: PackagesService, useClass: PackagesServiceMock },
        { provide: BridgeEventListService, useClass: BridgeEventListServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(TasksController);
    tasksService = module.get(TasksService);
    userAuthService = module.get(UserAuthService);
    guardTasks = module.get(GuardTasks);
    loggerService = module.get(LoggerService);
    configService = module.get(ConfigService);
    httpClientService = module.get(HttpClientService);
    packagesService = module.get(PackagesService);
    bridgeEventListService = module.get(BridgeEventListService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(tasksService).toBeDefined();
    expect(userAuthService).toBeDefined();
    expect(guardTasks).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(configService).toBeDefined();
    expect(httpClientService).toBeDefined();
  });

  describe(TasksController.prototype.getTasks.name, () => {
    let params: GetDepolymentTasksParam = {
      limit: "20",
      offset: "0",
      text: "name",
      sortName: "status",
      sort: "desc",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    } as any;
    describe("case that req.body is invalid", () => {
      it("should return 400 when request body is invalid form", () => {
        // arrange
        jest.spyOn(guardTasks, "isGetTaskParams").mockReturnValue(false);
        const expected = 400;

        // act
        controller.getTasks(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected);
      });

      it("should return specified message when request body is invalid form", () => {
        // arrange
        jest.spyOn(guardTasks, "isGetTaskParams").mockReturnValue(false);

        const expected = "Invalid Request Path Params";

        // act
        controller.getTasks(params, res);

        // assert
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should call res.end() when request body is invalid form", () => {
        // arrange
        jest.spyOn(guardTasks, "isGetTaskParams").mockReturnValue(false);

        // act
        controller.getTasks(params, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });

    describe("case that req.body is valid", () => {
      beforeEach(() => {
        jest.spyOn(guardTasks, "isGetTaskParams").mockReturnValue(true);
      });

      it("should call get$ with params", () => {
        // arrange
        jest.spyOn(tasksService, "get$").mockReturnValue(of([]));
        const expected = { ...params };
        expected.text = `%${expected.text}%`;

        // act
        controller.getTasks(params, res);

        // assert
        expect(tasksService.get$).toHaveBeenCalledWith(expected);
      });

      it("should call get$ with default", () => {
        // arrange
        params = {
          limit: undefined as any,
          offset: undefined as any,
        };
        jest.spyOn(tasksService, "get$").mockReturnValue(of([]));
        const expected = {
          limit: "20",
          offset: "0",
          text: "%",
          sort: "desc",
          sortName: "updateDate",
        };

        // act
        controller.getTasks(params, res);

        // assert
        expect(tasksService.get$).toHaveBeenCalledWith(expected);
      });

      it("should respond task list (1 record) when get$ succeeded", () => {
        // arrange
        const date = new Date("2020/01/01");

        const expected: TaskResponseBody[] = [
          {
            id: "some-id",
            name: "test",
            taskType: ETaskType.DownloadPackage,
            relatedTaskId: "id",
            relatedTaskType: "type",
            status: ETaskStatus.InProgress,
            createdBy: "string",
            updatedAt: date.toISOString(),
            downloadPackageTaskAssets: [
              {
                status: ETaskAssetStatus.InProgress,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                startedAt: date.toISOString(),
                updatedAt: date.toISOString(),
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            deploymentTaskPackages: {
              date: date.toISOString(),
              name: "CI-100_1.22",
              summary: "summary01",
              packageId: "some-package-id",
            },
            logTask: {
              logType: "Business",
              memo: "",
            },
            logTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                startedAt: date.toISOString(),
                updatedAt: date.toISOString(),
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            retrieveLogs: [
              {
                status: ERetrieveLogsStatus.Succeed,
                errorCode: "",
                errorMessage: "",
                filePath: "ftp://ftp.glory-cloud.dev:21/{0416fdd6-51be-5cc6-2c12-5a653ab00001}",
                createdAt: date.toISOString(),
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            rebootTask: {
              memo: "",
            },
            rebootTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                startedAt: "",
                updatedAt: "",
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            selfTestTask: {
              memo: "",
            },
            selfTestTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                startedAt: "",
                updatedAt: "",
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
          },
        ];
        const ret: GetTasks[] = [
          {
            id: "some-id",
            name: "test",
            taskType: ETaskType.DownloadPackage,
            status: ETaskStatus.InProgress,
            relatedTaskId: "id",
            relatedTaskType: "type",
            createdBy: "string",
            createdAt: date,
            updatedAt: date,
            downloadPackageTaskAssets: [
              {
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
                status: ETaskAssetStatus.InProgress,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                startedAt: date.toISOString(),
                updatedAt: date.toISOString(),
              },
            ],
            deploymentTaskPackages: {
              date: date.toISOString(),
              name: "CI-100_1.22",
              summary: "summary01",
              packageId: "some-package-id",
            },
            logTask: {
              logType: "Business",
              memo: "",
            },
            logTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                startedAt: date.toISOString(),
                updatedAt: date.toISOString(),
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            retrieveLogs: [
              {
                status: ERetrieveLogsStatus.Succeed,
                errorCode: "",
                errorMessage: "",
                filePath: "ftp://ftp.glory-cloud.dev:21/{0416fdd6-51be-5cc6-2c12-5a653ab00001}",
                createdAt: date.toISOString(),
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            rebootTask: {
              memo: "",
            },
            rebootTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            selfTestTask: {
              memo: "",
            },
            selfTestTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            totalCount: "1",
          },
        ];
        jest.spyOn(tasksService, "get$").mockReturnValue(of(ret));

        // act
        controller.getTasks(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should respond task aset and package data empty when record assets & package also empty", () => {
        // arrange
        const date = new Date("2020/01/01");

        const expected: TaskResponseBody[] = [
          {
            id: "some-id",
            name: "test",
            status: ETaskStatus.Complete,
            taskType: ETaskType.DownloadPackage,
            relatedTaskId: "",
            createdBy: "string",
            updatedAt: date.toISOString(),
            downloadPackageTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {
              logType: "Business",
              memo: "",
            },
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {
              memo: "",
            },
            rebootTaskAssets: [],
            selfTestTask: {
              memo: "",
            },
            selfTestTaskAssets: [],
          },
        ];
        const ret: GetTasks[] = [
          {
            id: "some-id",
            name: "test",
            status: ETaskStatus.Complete,
            taskType: ETaskType.DownloadPackage,
            relatedTaskId: "",
            createdBy: "string",
            createdAt: date,
            updatedAt: date,
            downloadPackageTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {
              logType: "Business",
              memo: "",
            },
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {
              memo: "",
            },
            rebootTaskAssets: [],
            selfTestTask: {
              memo: "",
            },
            selfTestTaskAssets: [],
            totalCount: "1",
          },
        ];
        jest.spyOn(tasksService, "get$").mockReturnValue(of(ret));

        // act
        controller.getTasks(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should be set X-Total-Count", () => {
        // arrange
        const date = new Date("2020/01/01");
        const ret: GetTasks[] = [
          {
            id: "some-id x1",
            name: "test",
            taskType: ETaskType.DownloadPackage,
            status: ETaskStatus.Failure,
            relatedTaskId: "",
            createdBy: "",
            createdAt: date,
            updatedAt: date,
            downloadPackageTaskAssets: [],
            deploymentTaskPackages: { name: "name" },
            logTask: {
              logType: "Business",
              memo: "",
            },
            logTaskAssets: [],
            retrieveLogs: [],
            rebootTask: {
              memo: "",
            },
            rebootTaskAssets: [],
            selfTestTask: {
              memo: "",
            },
            selfTestTaskAssets: [],
            totalCount: "2",
          },
          {
            id: "some-id x2",
            name: "test",
            taskType: ETaskType.DownloadPackage,
            status: ETaskStatus.InProgress,
            relatedTaskId: "",
            createdBy: "string",
            createdAt: date,
            downloadPackageTaskAssets: [
              {
                alias: "@ASSET-GATEWAY",
                status: ETaskAssetStatus.InProgress,
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
                regionId: "National capital Region",
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
              },
            ],
            deploymentTaskPackages: {
              name: "CI-100_1.22",
              summary: "summary01",
              packageId: "some-package-id",
            },
            logTask: {
              logType: "Business",
              memo: "",
            },
            logTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            retrieveLogs: [
              {
                status: ERetrieveLogsStatus.Succeed,
                errorCode: "",
                errorMessage: "",
                filePath: "ftp://ftp.glory-cloud.dev:21/{0416fdd6-51be-5cc6-2c12-5a653ab00001}",
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            rebootTask: {
              memo: "",
            },
            rebootTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                startedAt: date.toISOString(),
                updatedAt: date.toISOString(),
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            selfTestTask: {
              memo: "",
            },
            selfTestTaskAssets: [
              {
                status: ETaskAssetStatus.Complete,
                customerId: "GLORY 01 LTD.",
                locationId: "Location 01-1",
                regionId: "National capital Region",
                alias: "@ASSET-GATEWAY",
                startedAt: date.toISOString(),
                updatedAt: date.toISOString(),
                typeId: "GATEWAY",
                assetId: "@GATEWAY-02",
              },
            ],
            totalCount: "2",
          },
        ];
        jest.spyOn(tasksService, "get$").mockReturnValue(of(ret));
        const expected = {
          "Access-Control-Expose-Headers": "X-Total-Count",
          "X-Total-Count": "2",
        };

        // act
        controller.getTasks(params, res);

        // assert
        expect(res.set).toHaveBeenCalledWith(expected);
      });

      it("should respond error when lower layer emit error", () => {
        // arrange
        const error = new BridgeXServerError(500, "error");
        jest.spyOn(tasksService, "get$").mockReturnValue(throwError(error));

        const expected = ErrorCode.categorize(error);

        // act
        controller.getTasks(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected.code);
        expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
      });

      it("should call res.end() when error occured", () => {
        // arrange
        const error = Error("error");
        jest.spyOn(tasksService, "get$").mockReturnValue(throwError(error));

        // act
        controller.getTasks(params, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });
  });

  describe(TasksService.prototype.getTask$.name, () => {
    it("should call service to get a specified task", () => {
      // arrange
      const path = {
        taskId: "taskId",
      };
      const error = {
        code: 400,
        message: "message",
      };

      const expected = {
        getTask: {
          taskId: path.taskId,
        },
        error,
      };

      tasksService.getTask$ = jest.fn(() => throwError(error));

      // act
      controller.getTask(path, res);

      // assert
      expect(tasksService.getTask$).toHaveBeenCalledWith(expected.getTask);
      expect(res.status).toHaveBeenCalledWith(expected.error.code);
      expect(res.json).toHaveBeenCalledWith({ code: expected.error.code, message: expected.error.message });
      expect(res.end).toHaveBeenCalled();
    });

    it("should return a specified task", () => {
      // arrange
      const path = {
        taskId: "taskId",
      };
      const task = {
        id: "taskId",
      } as GetTask;

      const expected = {
        task,
      };

      tasksService.getTask$ = jest.fn(() => of(task));

      // act
      controller.getTask(path, res);

      // assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expected.task);
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe(TasksController.prototype.postDeploymentTask.name, () => {
    let arg: { body: any; req: any };

    beforeEach(() => {
      arg = {
        body: {
          name: "",
          packages: ["", ""],
          assets: [{ assetId: "", typeId: "" }],
        } as PostDeploymentTaskBody,
        req: {},
      };
    });

    it("should return 401 when request bearer token is invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "");

      const expected = { code: 401 };

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(e.getStatus()).toEqual(expected.code);
          expect(e).toBeInstanceOf(HttpException);
        });
    });

    it("should return 400 when request bodies are invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostBody = jest.fn(() => false);

      const expected = { code: 400 };

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(e.getStatus()).toEqual(expected.code);
          expect(e).toBeInstanceOf(HttpException);
        });
    });

    it("should call userAuthService.getUserInfo$ with token", () => {
      // arrange
      const token = "token";
      controller.getTokenFromHeader = jest.fn(() => token);
      guardTasks.isPostBody = jest.fn(() => true);

      userAuthService.getUserInfo$ = jest.fn(() => throwError({}));

      const expected = { token };

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(userAuthService.getUserInfo$).toHaveBeenCalledWith(expected.token);
          expect(e).toBeInstanceOf(HttpException);
        });
    });

    it("should register DownloadPackage task", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);

      tasksService.insertDownloadPackageTask$ = jest.fn(() => throwError({}));

      const expected = {
        taskId: expect.any(String),
        name: arg.body.name,
        status: ETaskStatus.Scheduled,
        createdBy: userName,
        assets:
          arg.body.assets.length > 0
            ? arg.body.assets.map((asset: any) => ({
                ...asset,
                status: ETaskAssetStatus.Scheduled,
              }))
            : [],
        packages:
          arg.body.packages.length > 0
            ? arg.body.packages.map((pkg: any) => ({
                packageId: pkg,
              }))
            : [],
      };

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(tasksService.insertDownloadPackageTask$).toHaveBeenCalledWith(expect.objectContaining(expected));
          expect(e).toBeInstanceOf(HttpException);
        });
    });

    it("should register event about creation of DownloadPackage task", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);
      tasksService.insertDownloadPackageTask$ = jest.fn(() => of({} as any));

      controller.saveDownloadPackageTaskEventLog$ = jest.fn(() => throwError({}));

      const expected = {
        taskId: expect.any(String),
        name: arg.body.name,
        status: ETaskStatus.Scheduled,
        createdBy: userName,
        assets:
          arg.body.assets.length > 0
            ? arg.body.assets.map((asset: any) => ({
                ...asset,
                status: ETaskAssetStatus.Scheduled,
              }))
            : [],
        packages:
          arg.body.packages.length > 0
            ? arg.body.packages.map((pkg: any) => ({
                packageId: pkg,
              }))
            : [],
      };

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(controller.saveDownloadPackageTaskEventLog$).toHaveBeenCalledWith(expect.objectContaining(expected));
          expect(e).toBeInstanceOf(HttpException);
        });
    });

    it("should register Install task", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);
      tasksService.insertDownloadPackageTask$ = jest.fn(() => of({} as any));
      controller.saveDownloadPackageTaskEventLog$ = jest.fn(() => of({} as any));
      tasksService.insertInstallTask$ = jest.fn(() => throwError({}));

      const expected = {
        taskId: expect.any(String),
        name: arg.body.name,
        status: ETaskStatus.Scheduled,
        createdBy: userName,
        assets:
          arg.body.assets.length > 0
            ? arg.body.assets.map((asset: any) => ({
                ...asset,
                status: ETaskAssetStatus.Scheduled,
              }))
            : [],
        packages:
          arg.body.packages.length > 0
            ? arg.body.packages.map((pkg: any) => ({
                packageId: pkg,
              }))
            : [],
      };

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(tasksService.insertInstallTask$).toHaveBeenCalledWith(expect.objectContaining(expected));
          expect(e).toBeInstanceOf(HttpException);
        });
    });

    it("should register event about creation of Install task", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);
      tasksService.insertDownloadPackageTask$ = jest.fn(() => of({} as any));
      controller.saveDownloadPackageTaskEventLog$ = jest.fn(() => of({} as any));
      tasksService.insertInstallTask$ = jest.fn(() => of({} as any));

      controller.saveInstallTaskEventLog$ = jest.fn(() => throwError({}));

      const expected = {
        taskId: expect.any(String),
        name: arg.body.name,
        status: ETaskStatus.Scheduled,
        createdBy: userName,
        assets:
          arg.body.assets.length > 0
            ? arg.body.assets.map((asset: any) => ({
                ...asset,
                status: ETaskAssetStatus.Scheduled,
              }))
            : [],
        packages:
          arg.body.packages.length > 0
            ? arg.body.packages.map((pkg: any) => ({
                packageId: pkg,
              }))
            : [],
      };

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(controller.saveInstallTaskEventLog$).toHaveBeenCalledWith(expect.objectContaining(expected));
          expect(e).toBeInstanceOf(HttpException);
        });
    });

    it("should relate DownloadPackage task to Install task", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);
      tasksService.insertDownloadPackageTask$ = jest.fn(() => of({} as any));
      tasksService.insertInstallTask$ = jest.fn(() => of({} as any));
      tasksService.insertInstallTask$ = jest.fn(() => of({} as any));
      controller.saveInstallTaskEventLog$ = jest.fn(() => of({} as any));

      tasksService.insertDeploymentRelation$ = jest.fn(() => throwError({}));

      const expected = {
        downloadPackageId: expect.any(String),
        installId: expect.any(String),
      };

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(tasksService.insertDeploymentRelation$).toHaveBeenCalledWith(expect.objectContaining(expected));
          expect(e).toBeInstanceOf(HttpException);
        });
    });

    it("should execute deployment task immediately", () => {
      // arrange
      guardTasks.isPostBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);
      tasksService.insertDownloadPackageTask$ = jest.fn(() => of({} as any));
      tasksService.insertInstallTask$ = jest.fn(() => of({} as any));
      tasksService.insertInstallTask$ = jest.fn(() => of({} as any));
      controller.saveInstallTaskEventLog$ = jest.fn(() => of({} as any));
      tasksService.insertDeploymentRelation$ = jest.fn(() => of({} as any));

      controller.immediateExecuteDownloadPackageTask$ = jest.fn(() => throwError({}));

      const expected = expect.any(String);

      // act
      return controller
        .postDeploymentTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(controller.immediateExecuteDownloadPackageTask$).toHaveBeenCalledWith(expected);
          expect(e).toBeInstanceOf(HttpException);
        });
    });
  });

  describe(TasksController.prototype.saveDownloadPackageTaskEventLog$.name, () => {
    it("should call packageService.getMany$ as expected params", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [],
        packages: [{ packageId: "packageId 1" }, { packageId: "packageId 2" }, { packageId: "packageId 3" }] as any[],
      };
      const expected = ["packageId 1", "packageId 2", "packageId 3"];

      jest.spyOn(packagesService, "getMany$").mockReturnValue(throwError({}));

      // act & assert
      return controller
        .saveDownloadPackageTaskEventLog$(params)
        .toPromise()
        .then(() => {
          expect(packagesService.getMany$).toHaveBeenCalledWith(expected);
        })
        .catch(fail);
    });

    it("should call eventListService.insertCreate$ expected times with expected params", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
        packages: [],
      };

      const packages = [
        { name: "name 1", id: "packageId-1" },
        { name: "name 2", id: "packageId-2" },
        { name: "name 3", id: "packageId-3" },
      ];

      const expected = params.assets.map((asset) => ({
        typeId: asset.typeId,
        assetId: asset.assetId,
        taskId: params.taskId,
        packageName: "name 1,name 2,name 3",
      }));

      jest.spyOn(packagesService, "getMany$").mockReturnValue(of(packages));
      jest.spyOn(bridgeEventListService.downloadPackageTask, "insertCreate$").mockReturnValue(empty());

      // act & assert
      return controller
        .saveDownloadPackageTaskEventLog$(params)
        .toPromise()
        .then(() => {
          expected.forEach((elm, i) => {
            expect(bridgeEventListService.downloadPackageTask.insertCreate$).toHaveBeenNthCalledWith(i + 1, elm);
          });
        })
        .catch(fail);
    });

    it("should return data once until complete", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
        packages: [],
      };

      jest.spyOn(packagesService, "getMany$").mockReturnValue(of([]));
      jest.spyOn(bridgeEventListService.downloadPackageTask, "insertCreate$").mockReturnValue(of(null));

      const spy = jest.fn();

      // act & assert
      return controller
        .saveDownloadPackageTaskEventLog$(params)
        .pipe(tap(spy))
        .toPromise()
        .then(() => expect(spy).toHaveBeenCalledTimes(1))
        .catch(fail);
    });

    it("should complete normally when packageService.getMany$ throws error", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
        packages: [],
      };

      const error = new Error("error des");
      jest.spyOn(packagesService, "getMany$").mockReturnValue(throwError(error));
      jest.spyOn(bridgeEventListService.downloadPackageTask, "insertCreate$").mockImplementation(fail);

      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      // act & assert
      return controller
        .saveDownloadPackageTaskEventLog$(params)
        .toPromise()
        .then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected))
        .catch(fail);
    });

    it("should complete normally when eventListService.insertCreate$ throws error", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
        packages: [],
      };

      const error = new Error("error des");
      jest.spyOn(packagesService, "getMany$").mockReturnValue(of([]));
      jest.spyOn(bridgeEventListService.downloadPackageTask, "insertCreate$").mockReturnValue(throwError(error));

      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      // act & assert
      return controller
        .saveDownloadPackageTaskEventLog$(params)
        .toPromise()
        .then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected))
        .catch(fail);
    });
  });

  describe(TasksController.prototype.saveInstallTaskEventLog$.name, () => {
    it("should call packageService.getMany$ as expected params", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [],
        packages: [{ packageId: "packageId 1" }, { packageId: "packageId 2" }, { packageId: "packageId 3" }] as any[],
      };
      const expected = ["packageId 1", "packageId 2", "packageId 3"];

      jest.spyOn(packagesService, "getMany$").mockReturnValue(throwError({}));

      // act & assert
      return controller
        .saveInstallTaskEventLog$(params)
        .toPromise()
        .then(() => {
          expect(packagesService.getMany$).toHaveBeenCalledWith(expected);
        })
        .catch(fail);
    });

    it("should call eventListService.insertCreate$ expected times with expected params", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
        packages: [],
      };

      const packages = [
        { name: "name 1", id: "packageId-1" },
        { name: "name 2", id: "packageId-2" },
        { name: "name 3", id: "packageId-3" },
      ];

      const expected = params.assets.map((asset) => ({
        typeId: asset.typeId,
        assetId: asset.assetId,
        taskId: params.taskId,
        packageName: "name 1,name 2,name 3",
      }));

      jest.spyOn(packagesService, "getMany$").mockReturnValue(of(packages));
      jest.spyOn(bridgeEventListService.installTask, "insertCreate$").mockReturnValue(empty());

      // act & assert
      return controller
        .saveInstallTaskEventLog$(params)
        .toPromise()
        .then(() => {
          expected.forEach((elm, i) => {
            expect(bridgeEventListService.installTask.insertCreate$).toHaveBeenNthCalledWith(i + 1, elm);
          });
        })
        .catch(fail);
    });

    it("should return data once until complete", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
        packages: [],
      };

      jest.spyOn(packagesService, "getMany$").mockReturnValue(of([]));
      jest.spyOn(bridgeEventListService.installTask, "insertCreate$").mockReturnValue(of(null));

      const spy = jest.fn();

      // act & assert
      return controller
        .saveInstallTaskEventLog$(params)
        .pipe(tap(spy))
        .toPromise()
        .then(() => expect(spy).toHaveBeenCalledTimes(1))
        .catch(fail);
    });

    it("should complete normally when packageService.getMany$ throws error", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
        packages: [],
      };

      const error = new Error("error des");
      jest.spyOn(packagesService, "getMany$").mockReturnValue(throwError(error));
      jest.spyOn(bridgeEventListService.installTask, "insertCreate$").mockImplementation(fail);

      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      // act & assert
      return controller
        .saveInstallTaskEventLog$(params)
        .toPromise()
        .then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected))
        .catch(fail);
    });

    it("should complete normally when eventListService.insertCreate$ throws error", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "task id no",
        name: "task name des",
        status: ETaskStatus.Scheduled,
        createdBy: "",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
        packages: [],
      };

      const error = new Error("error des");
      jest.spyOn(packagesService, "getMany$").mockReturnValue(of([]));
      jest.spyOn(bridgeEventListService.installTask, "insertCreate$").mockReturnValue(throwError(error));

      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      // act & assert
      return controller
        .saveInstallTaskEventLog$(params)
        .toPromise()
        .then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected))
        .catch(fail);
    });
  });

  describe(TasksController.prototype.postLogTask.name, () => {
    let arg: { body: any; req: any };

    beforeEach(() => {
      arg = {
        body: {
          logType: "Business",
          memo: "memo",
          assets: [
            {
              typeId: "typeId001",
              assetId: "assetId001",
            },
          ],
        } as PostLogTaskBody,
        req: {},
      };

      guardTasks.isPostLogTaskBody = jest.fn(() => false);
      controller.getTokenFromHeader = jest.fn(() => "");
      userAuthService.getUserInfo$ = jest.fn(() => of());
      tasksService.insertLogTask$ = jest.fn(() => of(null as any));
      controller.saveRetrieveLogTaskEventLog$ = jest.fn(() => of(null as any));
      jest.spyOn(controller, "kickLogTask$").mockReturnValue(of(null as any));
    });

    it("should return 401 when request bearer token is invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "");

      const expected = { code: 401 };

      // act
      return controller
        .postLogTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should return 400 when request bodies are invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostLogTaskBody = jest.fn(() => false);

      const expected = { code: 400 };

      // act
      return controller
        .postLogTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call userAuthService.getUserInfo$ with token", () => {
      // arrange
      guardTasks.isPostLogTaskBody = jest.fn(() => true);
      const token = "token";
      controller.getTokenFromHeader = jest.fn(() => token);

      const expected = { token };

      // act
      return controller
        .postLogTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(userAuthService.getUserInfo$).toHaveBeenCalledWith(expected.token);
        })
        .catch((e) => fail(e));
    });

    it("should return error when getUserInfo$ failed (e.g. 404)", () => {
      // arrange
      guardTasks.isPostLogTaskBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      userAuthService.getUserInfo$ = jest.fn(() => throwError({ code: 404, message: "" }));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postLogTask(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call tasksService.insertLogTask$", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostLogTaskBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);

      const expected = {
        taskId: expect.any(String),
        status: ETaskStatus.Scheduled,
        logType: arg.body.logType,
        createdBy: userName,
        memo: arg.body.memo,
        assets: arg.body.assets.map((asset: any) => ({
          ...asset,
          status: ETaskAssetStatus.Scheduled,
        })),
      };

      // act
      return controller
        .postLogTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(tasksService.insertLogTask$).toHaveBeenCalledWith(expect.objectContaining(expected));
        })
        .catch((e: any) => fail(e));
    });

    it("should call tasksService.insertLogTask$ (memo is empty)", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostLogTaskBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);

      const expected = {
        taskId: expect.any(String),
        status: ETaskStatus.Scheduled,
        logType: arg.body.logType,
        createdBy: userName,
        memo: "",
        assets: arg.body.assets.map((asset: any) => ({
          ...asset,
          status: ETaskAssetStatus.Scheduled,
        })),
      };
      arg.body.memo = undefined;

      // act
      return controller
        .postLogTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(tasksService.insertLogTask$).toHaveBeenCalledWith(expect.objectContaining(expected));
        })
        .catch((e: any) => fail(e));
    });

    it("should call controller.kickLogTask$", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostLogTaskBody = jest.fn(() => true);
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      tasksService.insertLogTask$ = jest.fn(() => of(null as any));

      const expected = expect.any(String);

      // act
      return controller
        .postLogTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(controller.kickLogTask$).toHaveBeenCalledWith(expected);
        })
        .catch((e: any) => fail(e));
    });

    it("should return error when insertLogTask$ failed (e.g. 404)", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostLogTaskBody = jest.fn(() => true);
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      tasksService.insertLogTask$ = jest.fn(() => throwError({ code: 404, message: "" }));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postLogTask(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });
  });

  describe(TasksController.prototype.saveRetrieveLogTaskEventLog$.name, () => {
    beforeEach(() => {
      jest.spyOn(bridgeEventListService.retrieveLogTask, "insertCreate$").mockReturnValue(of(null));
    });

    it("should call eventListService.insertCreate$ expected times with expected params", () => {
      // arrange
      const params: InsertLogTaskParams = {
        taskId: "task id no",
        logType: "task name des",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      const expected = params.assets.map((asset) => ({
        typeId: asset.typeId,
        assetId: asset.assetId,
        taskId: params.taskId,
        logType: params.logType,
      }));

      jest.spyOn(bridgeEventListService.retrieveLogTask, "insertCreate$").mockReturnValue(empty());

      // act & assert
      return controller
        .saveRetrieveLogTaskEventLog$(params)
        .toPromise()
        .then(() => {
          expect(bridgeEventListService.retrieveLogTask.insertCreate$).toHaveBeenCalledTimes(expected.length);
          expected.forEach((elm, i) => {
            expect(bridgeEventListService.retrieveLogTask.insertCreate$).toHaveBeenNthCalledWith(i + 1, elm);
          });
        })
        .catch(fail);
    });

    it("should return data once until complete", () => {
      // arrange
      const params: InsertLogTaskParams = {
        taskId: "task id no",
        logType: "task name des",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      jest.spyOn(bridgeEventListService.retrieveLogTask, "insertCreate$").mockReturnValue(of(null));

      const spy = jest.fn();

      // act & assert
      return controller
        .saveRetrieveLogTaskEventLog$(params)
        .pipe(tap(spy))
        .toPromise()
        .then(() => expect(spy).toHaveBeenCalledTimes(1))
        .catch(fail);
    });

    it("should complete normally when eventListService.insertCreate$ throws error", () => {
      // arrange
      const params: InsertLogTaskParams = {
        taskId: "task id no",
        logType: "task name des",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      const error = new Error("error des");
      jest.spyOn(bridgeEventListService.retrieveLogTask, "insertCreate$").mockReturnValue(throwError(error));

      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      // act & assert
      return controller
        .saveRetrieveLogTaskEventLog$(params)
        .toPromise()
        .then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected))
        .catch(fail);
    });
  });

  describe(TasksController.prototype.postRebootTask.name, () => {
    let arg: { body: any; req: any };

    beforeEach(() => {
      arg = {
        body: {
          memo: "memo",
          assets: [
            {
              typeId: "typeId001",
              assetId: "assetId001",
            },
          ],
        } as PostRebootSelfTestTaskBody,
        req: {},
      };

      controller.getTokenFromHeader = jest.fn(() => "");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => false);
      userAuthService.getUserInfo$ = jest.fn(() => of());
      tasksService.insertRebootSelfTestTask$ = jest.fn(() => of(null as any));
      controller.saveRebootTaskEventLog$ = jest.fn(() => of(null as any));
      jest.spyOn(controller, "kickRebootTask$").mockReturnValue(of(null as any));
    });

    it("should return 401 when request bearer token is invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "");

      const expected = { code: 401 };

      // act
      return controller
        .postRebootTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should return 400 when request bodies are invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => false);

      const expected = { code: 400 };

      // act
      return controller
        .postRebootTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call userAuthService.getUserInfo$ with token", () => {
      // arrange
      const token = "token";
      controller.getTokenFromHeader = jest.fn(() => token);
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);

      const expected = { token };

      // act
      return controller
        .postRebootTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(userAuthService.getUserInfo$).toHaveBeenCalledWith(expected.token);
        })
        .catch((e) => fail(e));
    });

    it("should return error when getUserInfo$ failed (e.g. 404)", () => {
      // arrange
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      userAuthService.getUserInfo$ = jest.fn(() => throwError({ code: 404, message: "" }));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postRebootTask(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call tasksService.insertRebootSelfTestTask$", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);

      const expected = {
        taskId: expect.any(String),
        status: ETaskStatus.Scheduled,
        createdBy: userName,
        memo: arg.body.memo,
        assets: arg.body.assets.map((asset: any) => ({
          ...asset,
          status: ETaskAssetStatus.Scheduled,
        })),
      };

      // act
      return controller
        .postRebootTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(tasksService.insertRebootSelfTestTask$).toHaveBeenCalledWith(arg.req, expect.objectContaining(expected));
        })
        .catch((e: any) => fail(e));
    });

    it("should call tasksService.insertRebootSelfTestTask$ (memo is empty)", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);

      const expected = {
        taskId: expect.any(String),
        status: ETaskStatus.Scheduled,
        createdBy: userName,
        memo: "",
        assets: arg.body.assets.map((asset: any) => ({
          ...asset,
          status: ETaskAssetStatus.Scheduled,
        })),
      };
      arg.body.memo = undefined;

      // act
      return controller
        .postRebootTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(tasksService.insertRebootSelfTestTask$).toHaveBeenCalledWith(arg.req, expect.objectContaining(expected));
        })
        .catch((e: any) => fail(e));
    });

    it("should call controller.kickRebootTask$", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      tasksService.insertRebootSelfTestTask$ = jest.fn(() => of(null as any));

      const expected = expect.any(String);

      // act
      return controller
        .postRebootTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(controller.kickRebootTask$).toHaveBeenCalledWith(expected);
        })
        .catch((e: any) => fail(e));
    });

    it("should return error when insertRebootSelfTestTask$ failed (e.g. 404)", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      tasksService.insertRebootSelfTestTask$ = jest.fn(() => throwError({ code: 404, message: "" }));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postRebootTask(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });
  });

  describe(TasksController.prototype.saveRebootTaskEventLog$.name, () => {
    beforeEach(() => {
      jest.spyOn(bridgeEventListService.rebootTask, "insertCreate$").mockReturnValue(of(null));
    });

    it("should call eventListService.insertCreate$ expected times with expected params", () => {
      // arrange
      const params: InsertRebootSelfTestTaskParams = {
        taskId: "task id no",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      const expected = params.assets.map((asset) => ({
        typeId: asset.typeId,
        assetId: asset.assetId,
        taskId: params.taskId,
        memo: params.memo,
      }));

      jest.spyOn(bridgeEventListService.rebootTask, "insertCreate$").mockReturnValue(empty());

      // act & assert
      return controller
        .saveRebootTaskEventLog$(params)
        .toPromise()
        .then(() => {
          expect(bridgeEventListService.rebootTask.insertCreate$).toHaveBeenCalledTimes(expected.length);
          expected.forEach((elm, i) => {
            expect(bridgeEventListService.rebootTask.insertCreate$).toHaveBeenNthCalledWith(i + 1, elm);
          });
        })
        .catch(fail);
    });

    it("should return data once until complete", () => {
      // arrange
      const params: InsertRebootSelfTestTaskParams = {
        taskId: "task id no",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      jest.spyOn(bridgeEventListService.rebootTask, "insertCreate$").mockReturnValue(of(null));

      const spy = jest.fn();

      // act & assert
      return controller
        .saveRebootTaskEventLog$(params)
        .pipe(tap(spy))
        .toPromise()
        .then(() => expect(spy).toHaveBeenCalledTimes(1))
        .catch(fail);
    });

    it("should complete normally when eventListService.insertCreate$ throws error", () => {
      // arrange
      const params: InsertRebootSelfTestTaskParams = {
        taskId: "task id no",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      const error = new Error("error des");
      jest.spyOn(bridgeEventListService.rebootTask, "insertCreate$").mockReturnValue(throwError(error));

      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      // act & assert
      return controller
        .saveRebootTaskEventLog$(params)
        .toPromise()
        .then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected))
        .catch(fail);
    });
  });

  describe(TasksController.prototype.postSelfTestTask.name, () => {
    let arg: { body: any; req: any };

    beforeEach(() => {
      arg = {
        body: {
          memo: "memo",
          assets: [
            {
              typeId: "typeId001",
              assetId: "assetId001",
            },
          ],
        } as PostRebootSelfTestTaskBody,
        req: {},
      };

      controller.getTokenFromHeader = jest.fn(() => "");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => false);
      userAuthService.getUserInfo$ = jest.fn(() => of());
      tasksService.insertRebootSelfTestTask$ = jest.fn(() => of(null as any));
      controller.saveSelfTestTaskEventLog$ = jest.fn(() => of(null as any));
      jest.spyOn(controller, "kickSelfTestTask$").mockReturnValue(of(null as any));
    });

    it("should return 401 when request bearer token is invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "");

      const expected = { code: 401 };

      // act
      return controller
        .postSelfTestTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should return 400 when request bodies are invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => false);

      const expected = { code: 400 };

      // act
      return controller
        .postSelfTestTask(arg.body, arg.req)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call userAuthService.getUserInfo$ with token", () => {
      // arrange
      const token = "token";
      controller.getTokenFromHeader = jest.fn(() => token);
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);

      const expected = { token };

      // act
      return controller
        .postSelfTestTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(userAuthService.getUserInfo$).toHaveBeenCalledWith(expected.token);
        })
        .catch((e) => fail(e));
    });

    it("should return error when getUserInfo$ failed (e.g. 404)", () => {
      // arrange
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      userAuthService.getUserInfo$ = jest.fn(() => throwError({ code: 404, message: "" }));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postSelfTestTask(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call tasksService.insertRebootSelfTestTask$", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);

      const expected = {
        taskId: expect.any(String),
        status: ETaskStatus.Scheduled,
        createdBy: userName,
        memo: arg.body.memo,
        assets: arg.body.assets.map((asset: any) => ({
          ...asset,
          status: ETaskAssetStatus.Scheduled,
        })),
      };

      // act
      return controller
        .postSelfTestTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(tasksService.insertRebootSelfTestTask$).toHaveBeenCalledWith(arg.req, expect.objectContaining(expected));
        })
        .catch((e: any) => fail(e));
    });

    it("should call tasksService.insertRebootSelfTestTask$ (memo is empty)", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);

      const expected = {
        taskId: expect.any(String),
        status: ETaskStatus.Scheduled,
        createdBy: userName,
        memo: "",
        assets: arg.body.assets.map((asset: any) => ({
          ...asset,
          status: ETaskAssetStatus.Scheduled,
        })),
      };
      arg.body.memo = undefined;

      // act
      return controller
        .postSelfTestTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(tasksService.insertRebootSelfTestTask$).toHaveBeenCalledWith(arg.req, expect.objectContaining(expected));
        })
        .catch((e: any) => fail(e));
    });

    it("should call controller.kickSelfTestTask$", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      tasksService.insertRebootSelfTestTask$ = jest.fn(() => of(null as any));

      const expected = expect.any(String);

      // act
      return controller
        .postSelfTestTask(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(controller.kickSelfTestTask$).toHaveBeenCalledWith(expected);
        })
        .catch((e: any) => fail(e));
    });

    it("should return error when insertRebootSelfTestTask$ failed (e.g. 404)", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "token");
      guardTasks.isPostRebootSelfTestTaskBody = jest.fn(() => true);
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      tasksService.insertRebootSelfTestTask$ = jest.fn(() => throwError({ code: 404, message: "" }));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postSelfTestTask(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });
  });

  describe(TasksController.prototype.saveSelfTestTaskEventLog$.name, () => {
    beforeEach(() => {
      jest.spyOn(bridgeEventListService.selfTestTask, "insertCreate$").mockReturnValue(of(null));
    });

    it("should call eventListService.insertCreate$ expected times with expected params", () => {
      // arrange
      const params: InsertRebootSelfTestTaskParams = {
        taskId: "task id no",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      const expected = params.assets.map((asset) => ({
        typeId: asset.typeId,
        assetId: asset.assetId,
        taskId: params.taskId,
        memo: params.memo,
      }));

      jest.spyOn(bridgeEventListService.selfTestTask, "insertCreate$").mockReturnValue(empty());

      // act & assert
      return controller
        .saveSelfTestTaskEventLog$(params)
        .toPromise()
        .then(() => {
          expect(bridgeEventListService.selfTestTask.insertCreate$).toHaveBeenCalledTimes(expected.length);
          expected.forEach((elm, i) => {
            expect(bridgeEventListService.selfTestTask.insertCreate$).toHaveBeenNthCalledWith(i + 1, elm);
          });
        })
        .catch(fail);
    });

    it("should return data once until complete", () => {
      // arrange
      const params: InsertRebootSelfTestTaskParams = {
        taskId: "task id no",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      jest.spyOn(bridgeEventListService.selfTestTask, "insertCreate$").mockReturnValue(of(null));

      const spy = jest.fn();

      // act & assert
      return controller
        .saveSelfTestTaskEventLog$(params)
        .pipe(tap(spy))
        .toPromise()
        .then(() => expect(spy).toHaveBeenCalledTimes(1))
        .catch(fail);
    });

    it("should complete normally when eventListService.insertCreate$ throws error", () => {
      // arrange
      const params: InsertRebootSelfTestTaskParams = {
        taskId: "task id no",
        status: ETaskStatus.Scheduled,
        memo: "memo des",
        createdBy: "Why I'm Me",
        assets: [
          { typeId: "type 1", assetId: "asset 1" },
          { typeId: "type 2", assetId: "asset 2" },
          { typeId: "type 3", assetId: "asset 3" },
        ] as any[],
      };

      const error = new Error("error des");
      jest.spyOn(bridgeEventListService.selfTestTask, "insertCreate$").mockReturnValue(throwError(error));

      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), error),
        params,
      };

      // act & assert
      return controller
        .saveSelfTestTaskEventLog$(params)
        .toPromise()
        .then(() => expect(loggerService.error).toHaveBeenCalledWith(expect.any(String), expected))
        .catch(fail);
    });
  });

  describe(TasksController.prototype.getTokenFromHeader.name, () => {
    let req: Request;

    beforeEach(() => {
      req = {
        headers: {
          authorization: "",
        },
      } as Request;
    });

    describe("should return token when authorization header has correct Bearer token", () => {
      it('should include "Bearer "', () => {
        // arrange
        const token = "token";
        req = {
          headers: {
            authorization: "Bearer " + token,
          },
        } as Request;

        const expected = token;

        // act
        const actual = controller.getTokenFromHeader(req);

        // assert
        expect(actual).toEqual(expected);
      });

      it('should include "bEaReR "', () => {
        // arrange
        const token = "token";
        req = {
          headers: {
            authorization: "bEaReR " + token,
          },
        } as Request;

        const expected = token;

        // act
        const actual = controller.getTokenFromHeader(req);

        // assert
        expect(actual).toEqual(expected);
      });
    });

    describe("should return empty string when authorization header has incorrect Bearer token", () => {
      it("authorization doesn't exist", () => {
        // arrange
        req = { headers: {} } as Request;

        const expected = "";

        // act
        const actual = controller.getTokenFromHeader(req);

        // assert
        expect(actual).toEqual(expected);
      });

      it('initial "Bearer " doesn\'t exist in authorization header', () => {
        // arrange
        req = {
          headers: {
            authorization: "token",
          },
        } as Request;

        const expected = "";

        // act
        const actual = controller.getTokenFromHeader(req);

        // assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe(TasksController.prototype.immediateExecuteDownloadPackageTask$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        jest.spyOn(httpClientService, "post$").mockReturnValue(of(null as any));
        arg = "argument task id";
        expected = {
          post: {
            endpoint: `http://localhost:1234/task-scheduler/schedules`,
            data: {
              taskId: "argument task id",
              callbackUrl: `http://localhost:1234/startDownloadPackage`,
            },
            config: {},
          },
          data: null,
        };
        // act
        act = controller.immediateExecuteDownloadPackageTask$(arg).toPromise();
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
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
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
        arg = "argument task id";
        expected = {
          data: null,
        };
        // act
        act = controller.immediateExecuteDownloadPackageTask$(arg).toPromise();
      });
      // assert
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(TasksController.prototype.kickLogTask$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        jest.spyOn(httpClientService, "post$").mockReturnValue(of(null as any));
        arg = "argument task id";
        expected = {
          post: {
            endpoint: `http://localhost:1234/task-scheduler/schedules`,
            data: {
              taskId: "argument task id",
              callbackUrl: `http://localhost:1234/startRetrieveLog`,
            },
            config: {},
          },
          data: null,
        };
        // act
        act = controller.kickLogTask$(arg).toPromise();
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
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
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
        arg = "argument task id";
        expected = {
          data: null,
        };
        // act
        act = controller.kickLogTask$(arg).toPromise();
      });
      // assert
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(TasksController.prototype.kickRebootTask$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        jest.spyOn(httpClientService, "post$").mockReturnValue(of(null as any));
        arg = "argument task id";
        expected = {
          post: {
            endpoint: `http://localhost:1234/task-scheduler/schedules`,
            data: {
              taskId: "argument task id",
              callbackUrl: `http://localhost:1234/startReboot`,
            },
            config: {},
          },
          data: null,
        };
        // act
        act = controller.kickRebootTask$(arg).toPromise();
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
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
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
        arg = "argument task id";
        expected = {
          data: null,
        };
        // act
        act = controller.kickRebootTask$(arg).toPromise();
      });
      // assert
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });

  describe(TasksController.prototype.kickSelfTestTask$.name, () => {
    describe("normal pattern", () => {
      let arg: any;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const appConfigMock = { port: 1234 } as AppConfig;
        jest.spyOn(configService, "appConfig").mockReturnValue(appConfigMock);
        jest.spyOn(httpClientService, "post$").mockReturnValue(of(null as any));
        arg = "argument task id";
        expected = {
          post: {
            endpoint: `http://localhost:1234/task-scheduler/schedules`,
            data: {
              taskId: "argument task id",
              callbackUrl: `http://localhost:1234/startSelfTest`,
            },
            config: {},
          },
          data: null,
        };
        // act
        act = controller.kickSelfTestTask$(arg).toPromise();
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
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
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
        arg = "argument task id";
        expected = {
          data: null,
        };
        // act
        act = controller.kickSelfTestTask$(arg).toPromise();
      });
      // assert
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });
  });
});
