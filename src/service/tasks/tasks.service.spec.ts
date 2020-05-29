jest.mock("path");

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { TasksService } from "./tasks.service";
import { PostgresService, IClient, IClientResponse } from "../postgres";
import { ConfigService } from "../config";
import { LoggerService } from "../logger";
import { PostgresConfig } from "../../environment/postgres";
import { BridgeXServerError, ErrorCode } from "../utils";
import {
  GetTasks,
  GetDepolymentTasksParam,
  InsertDownloadPackageTaskParams,
  InsertLogTaskParams,
  ETaskStatus,
  ETaskAssetStatus,
  UpdateDownloadPackageTaskAsset,
  DownloadPackageTask,
  UpdateDownloadPackageTask,
  InsertLogTaskRetrievelogParams,
  InsertRetrievelogParams,
  InsertRebootSelfTestTaskParams,
  GetLogTaskAssetParam,
  LogTask,
  UpdateLogTask,
  UpdateLogTaskAsset,
  GetAssetLogFilePath,
  InsertInstallTaskParams,
  InsertDeploymentRelationParams,
  InstallTask,
  UpdateInstallTask,
  UpdateInstallTaskAsset,
  GetTask,
  ETaskType,
  GetTaskStatusParams,
  GetRebootTaskAssetParam,
  GetSelfTestTaskAssetParam,
  InsertRebootSelfTestParams,
  UpdateRebootTaskSubAsset,
  UpdateSelfTestTaskSubAsset,
  ERebootStatus,
  ESelfTestStatus,
} from "./tasks.service.i";
import { GuardTasksResponse } from "./tasks.service.guard";
import moment from "moment";

describe(TasksService.name, () => {
  let service: TasksService;
  let configService: ConfigService;
  let postgresService: PostgresService;
  let loggerService: LoggerService;

  const clientMock: IClient = {
    query$: jest.fn(() => of(null as any)),
    queryByFile$: jest.fn(() => of(null as any)),
    beginTrans$: jest.fn(() => of(null as any)),
    commit$: jest.fn(() => of(null as any)),
    rollback$: jest.fn(() => of(null as any)),
    disconnect: jest.fn(() => null),
  };

  class ConfigServiceMock {
    public appConfig = jest.fn();
    public postgresConfig = jest.fn(() => ({} as PostgresConfig));
  }

  class PostgresServiceMock {
    public logger = { trace: () => {} } as any;
    public getClient$ = jest.fn(() => of());
    public transactBySql$ = jest.fn(() => of(null as any));
    public controlTransaction$ = jest.fn(PostgresService.prototype.controlTransaction$);
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        GuardTasksResponse,
        { provide: PostgresService, useClass: PostgresServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    postgresService = module.get<PostgresService>(PostgresService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(postgresService).toBeDefined();
    expect(configService).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(TasksService.prototype.get$.name, () => {
    let client: IClient;

    beforeEach(() => {
      client = {
        query$: jest.fn(),
        queryByFile$: jest.fn(),
        beginTrans$: jest.fn(),
        commit$: jest.fn(),
        rollback$: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    it("should call getClient$ with postgresConfig", (done) => {
      // arrange
      const params: GetDepolymentTasksParam = {
        limit: "10",
        offset: "0",
      };
      const postgresConfig = {} as PostgresConfig;

      jest.spyOn(configService, "postgresConfig").mockReturnValue(postgresConfig);
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of());

      const expected = postgresConfig;

      // act
      service.get$(params).subscribe(
        () => {},
        (err) => fail(err),
        () => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalledWith(expected);
          done();
        },
      );
    });

    it("should call queryByFile$ with sqlPath and placeHolder", (done) => {
      // arrange
      const params: GetDepolymentTasksParam = {
        limit: "10",
        offset: "0",
        text: "%name%",
        sortName: "status",
        sort: "desc",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of());
      jest.spyOn(client, "disconnect").mockReturnValue();

      const expected = {
        sqlPath: `${service.sqlDir}/select-tasks.sql`,
        placeHolder: ["10", "0", "%name%", "status desc"],
      };

      // act
      service.get$(params).subscribe(
        () => {},
        (err) => fail(err),
        () => {
          // assert
          expect(client.queryByFile$).toHaveBeenCalledTimes(1);
          expect(client.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder);
          expect(client.disconnect).toHaveBeenCalled();
          done();
        },
      );
    });

    it("should return empty when no records", (done) => {
      // arrange
      const params: GetDepolymentTasksParam = {
        limit: "10",
        offset: "0",
      };
      const response: IClientResponse<GetTasks> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = [] as any;

      // act
      service.get$(params).subscribe(
        (data) => {
          // assert
          expect(data).toEqual(expected);
          done();
        },
        (err) => fail(err),
      );
    });

    it("should execute select task", (done) => {
      // arrange
      const date = new Date("2020/01/22");
      const params: GetDepolymentTasksParam = {
        limit: "10",
        offset: "20",
        text: "%name%",
        sortName: "status",
        sort: "desc",
      };
      const response: IClientResponse<GetTasks> = {
        count: 2,
        records: [
          {
            id: "1",
            name: "test",
            taskType: "DownloadPackage",
            status: "InProgress",
            relatedTaskId: "",
            createdBy: "aaa",
            createdAt: date,
            updatedAt: date,
            downloadPackageTaskAssets: [],
            deploymentTaskPackages: {
              name: "name",
              packageId: "id",
            },
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
          } as GetTasks,
          {
            id: "2",
            name: "test 2",
            taskType: "Install",
            status: "Complete",
            relatedTaskId: "",
            createdBy: "aaa",
            createdAt: date,
            updatedAt: date,
            downloadPackageTaskAssets: [],
            deploymentTaskPackages: {
              name: "name",
              packageId: "id",
            },
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
          } as GetTasks,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-tasks.sql`,
            placeHolder: [params.limit, params.offset, params.text, `${params.sortName} ${params.sort}`],
          },
        },
      };

      // act
      service.get$(params).subscribe(
        () => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalled();
          expect(client.queryByFile$).toHaveBeenCalledTimes(1);
          expect(client.queryByFile$).toHaveBeenNthCalledWith(
            1,
            expected.asset.insertState.sqlPath,
            expected.asset.insertState.placeHolder,
          );
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return invalid data error when records failed to match guard schema", (done) => {
      // arrange
      const params: GetDepolymentTasksParam = {
        limit: "10",
        offset: "0",
      };
      const response = {
        count: 1,
        records: [
          {
            typeId: "aaaa",
            subpartName: "",
            subpartVersion: "1.0.0",
          },
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");

      // act
      service.get$(params).subscribe(
        (data) => fail(data),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });

    it("should throw Error(500) when sql error. ", (done) => {
      // arrange
      const params: GetDepolymentTasksParam = {
        limit: "10",
        offset: "20",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      service.get$(params).subscribe(
        () => {
          fail("Not expected here");
        },
        (err) => {
          expect(err.code).toEqual(expected.code);
          done();
        },
      );
    });
  });

  describe(TasksService.prototype.getTask$.name, () => {
    let client: IClient;

    beforeEach(() => {
      client = {
        query$: jest.fn(),
        queryByFile$: jest.fn(),
        beginTrans$: jest.fn(),
        commit$: jest.fn(),
        rollback$: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    it("should call getClient$ with postgresConfig", (done) => {
      // arrange
      const params: { taskId: string } = {
        taskId: "taskId",
      };
      const postgresConfig = {} as PostgresConfig;

      jest.spyOn(configService, "postgresConfig").mockReturnValue(postgresConfig);
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of());

      const expected = postgresConfig;

      // act
      service.getTask$(params).subscribe(
        () => {},
        (err) => fail(err),
        () => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalledWith(expected);
          done();
        },
      );
    });

    it("should call queryByFile$ with sqlPath and placeHolder", (done) => {
      // arrange
      const params: { taskId: string } = {
        taskId: "taskId",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of());
      jest.spyOn(client, "disconnect").mockReturnValue();

      const expected = {
        sqlPath: `${service.sqlDir}/select-task.sql`,
        placeHolder: [params.taskId],
      };

      // act
      service.getTask$(params).subscribe(
        () => {},
        (err) => fail(err),
        () => {
          // assert
          expect(client.queryByFile$).toHaveBeenCalledTimes(1);
          expect(client.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder);
          expect(client.disconnect).toHaveBeenCalled();
          done();
        },
      );
    });

    it("should return empty when no records", (done) => {
      // arrange
      const params: { taskId: string } = {
        taskId: "taskId",
      };
      const response: IClientResponse<GetTasks> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        code: ErrorCode.NOT_FOUND,
      };

      // act
      service.getTask$(params).subscribe(
        () => fail("unexpected here"),
        (e) => {
          // assert
          expect(e.code).toEqual(expected.code);
          done();
        },
      );
    });

    it("should execute select task", (done) => {
      // arrange
      const date = new Date("2020/01/22");
      const params: { taskId: string } = {
        taskId: "taskId",
      };
      const response: IClientResponse<GetTask> = {
        count: 1,
        records: [
          {
            id: "1",
            name: "test",
            taskType: "DownloadPackage",
            status: "InProgress",
            createdBy: "aaa",
            createdAt: date,
            updatedAt: date,
            downloadPackageTaskAssets: [],
            installTaskAssets: [],
            deploymentTaskPackages: {
              name: "name",
              packageId: "id",
            },
          } as GetTask,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-task.sql`,
            placeHolder: [params.taskId],
          },
        },
      };

      // act
      service.getTask$(params).subscribe(
        () => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalled();
          expect(client.queryByFile$).toHaveBeenCalledTimes(1);
          expect(client.queryByFile$).toHaveBeenNthCalledWith(
            1,
            expected.asset.insertState.sqlPath,
            expected.asset.insertState.placeHolder,
          );
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return invalid data error when records failed to match guard schema", (done) => {
      // arrange
      const params: { taskId: string } = {
        taskId: "taskId",
      };
      const response = {
        count: 1,
        records: [
          {
            typeId: "aaaa",
            subpartName: "",
            subpartVersion: "1.0.0",
          },
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");

      // act
      service.getTask$(params).subscribe(
        (data) => fail(data),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });

    it("should throw Error(500) when sql error. ", (done) => {
      // arrange
      const params: { taskId: string } = {
        taskId: "taskId",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      service.getTask$(params).subscribe(
        () => {
          fail("Not expected here");
        },
        (err) => {
          expect(err.code).toEqual(expected.code);
          done();
        },
      );
    });
  });

  describe(TasksService.prototype.getRelatedTaskId$.name, () => {
    it("should call sql with placeholder", () => {
      const params = "tata";

      const expected = {
        sqlPath: `${service.sqlDir}/select-related-task-id.sql`,
        placeHolder: ["tata"],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockReturnValue(throwError({}));

      return service
        .getRelatedTaskId$(params)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder);
          expect(e).toBeInstanceOf(BridgeXServerError);
        });
    });

    it("should return Not Found when count !== 1", () => {
      const params = "tata";

      const expected = ErrorCode.NOT_FOUND;

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
      const rtn = {
        count: 0,
      } as any;
      jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of(rtn));

      return service
        .getRelatedTaskId$(params)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch((e: any) => {
          expect(e).toBeInstanceOf(BridgeXServerError);
          expect(e.code).toEqual(expected);
        });
    });

    it("should return taskId", () => {
      const params = "tata";

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
      const rtn = {
        count: 1,
        records: [{ relatedTaskId: "id" }],
      } as any;
      jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of(rtn));

      const expected = rtn.records[0].relatedTaskId;

      return service
        .getRelatedTaskId$(params)
        .toPromise()
        .then((d: any) => {
          expect(d).toEqual(expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(TasksService.prototype.getDownloadPackageTask$.name, () => {
    describe("normal pattern", () => {
      let arg: string;
      let expected: any;
      let act: any;
      const utcMock = moment.utc("2020/04/23 5:19:14");

      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        const recordTask = {
          taskId: "tata",
          name: "nana",
          status: "stst",
          createdBy: "crby",
          createdAt: "2020/04/23 5:19:14",
          updatedAt: "2020/04/23 5:19:14",
        };
        const recordPackage = {
          packageId: "pa-idid",
          packageName: "pa-nana",
          packageStatus: "pa-stst",
          packageComment: "pa-coco",
          packageUploadUtc: "pa-uput",
          packageUploadBy: "pa-upby",
          packageDescription: "pa-dede",
          packageSummary: "pa-susu",
          packageModel: "pa-momo",
          packageMemo: "pa-meme",
          packageBucketName: "pa-bubu",
          packageObjectName: "pa-obob",
          packageFtpFilePath: "pa-ftft",
        };
        const records = [
          {
            ...recordTask,
            ...recordPackage,
            assetTypeId: "as01-tyty",
            assetId: "as01-asas",
            assetStatus: "as01-stst",
            assetStartedAt: "2020/04/23 5:19:14",
            assetUpdatedAt: "2020/04/23 5:19:14",
          },
          {
            ...recordTask,
            ...recordPackage,
            assetTypeId: "as02-tyty",
            assetId: "as02-asas",
            assetStatus: "as02-stst",
            assetStartedAt: "2020/04/23 5:19:14",
            assetUpdatedAt: "2020/04/23 5:19:14",
          },
          {
            ...recordTask,
            ...recordPackage,
            assetTypeId: "as03-tyty",
            assetId: "as03-asas",
            assetStatus: "as03-stst",
            assetStartedAt: "2020/04/23 5:19:14",
            assetUpdatedAt: "2020/04/23 5:19:14",
          },
        ];
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 3, records }));
        arg = "tata";
        expected = {
          sqlPath: `${service.sqlDir}/select-task-download-package.sql`,
          placeHolder: ["tata"],
          data: {
            id: "tata",
            name: "nana",
            status: "stst",
            createdBy: "crby",
            createdAt: utcMock,
            updatedAt: utcMock,
            package: {
              id: "pa-idid",
              name: "pa-nana",
              model: "pa-momo",
              ftpFilePath: "pa-ftft",
            },
            assets: [
              {
                typeId: "as01-tyty",
                assetId: "as01-asas",
                status: "as01-stst",
                startedAt: utcMock,
                updatedAt: utcMock,
              },
              {
                typeId: "as02-tyty",
                assetId: "as02-asas",
                status: "as02-stst",
                startedAt: utcMock,
                updatedAt: utcMock,
              },
              {
                typeId: "as03-tyty",
                assetId: "as03-asas",
                status: "as03-stst",
                startedAt: utcMock,
                updatedAt: utcMock,
              },
            ],
          },
        };
        // act
        act = service.getDownloadPackageTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.getClient$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return task data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = "tata";
        expected = new BridgeXServerError(404, "not found");
        // act
        act = service.getDownloadPackageTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getInstallTask$.name, () => {
    describe("normal pattern", () => {
      let arg: string;
      let expected: any;
      let act: any;
      const utcMock = moment.utc("2020/04/23 5:19:14");

      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        const recordTask = {
          taskId: "tata",
          name: "nana",
          status: "stst",
          createdBy: "crby",
          createdAt: "2020/04/23 5:19:14",
          updatedAt: "2020/04/23 5:19:14",
        };
        const recordPackage = {
          packageId: "pa-idid",
          packageName: "pa-nana",
          packageStatus: "pa-stst",
          packageComment: "pa-coco",
          packageUploadUtc: "pa-uput",
          packageUploadBy: "pa-upby",
          packageDescription: "pa-dede",
          packageSummary: "pa-susu",
          packageModel: "pa-momo",
          packageMemo: "pa-meme",
          packageBucketName: "pa-bubu",
          packageObjectName: "pa-obob",
          packageFtpFilePath: "pa-ftft",
        };
        const records = [
          {
            ...recordTask,
            ...recordPackage,
            assetTypeId: "as01-tyty",
            assetId: "as01-asas",
            assetStatus: "as01-stst",
            assetStartedAt: "2020/04/23 5:19:14",
            assetUpdatedAt: "2020/04/23 5:19:14",
          },
          {
            ...recordTask,
            ...recordPackage,
            assetTypeId: "as02-tyty",
            assetId: "as02-asas",
            assetStatus: "as02-stst",
            assetStartedAt: "2020/04/23 5:19:14",
            assetUpdatedAt: "2020/04/23 5:19:14",
          },
          {
            ...recordTask,
            ...recordPackage,
            assetTypeId: "as03-tyty",
            assetId: "as03-asas",
            assetStatus: "as03-stst",
            assetStartedAt: "2020/04/23 5:19:14",
            assetUpdatedAt: "2020/04/23 5:19:14",
          },
        ];
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 3, records }));
        arg = "tata";
        expected = {
          sqlPath: `${service.sqlDir}/select-task-install.sql`,
          placeHolder: ["tata"],
          data: {
            id: "tata",
            name: "nana",
            status: "stst",
            createdBy: "crby",
            createdAt: utcMock,
            updatedAt: utcMock,
            package: {
              id: "pa-idid",
              name: "pa-nana",
              model: "pa-momo",
            },
            assets: [
              {
                typeId: "as01-tyty",
                assetId: "as01-asas",
                status: "as01-stst",
                startedAt: utcMock,
                updatedAt: utcMock,
              },
              {
                typeId: "as02-tyty",
                assetId: "as02-asas",
                status: "as02-stst",
                startedAt: utcMock,
                updatedAt: utcMock,
              },
              {
                typeId: "as03-tyty",
                assetId: "as03-asas",
                status: "as03-stst",
                startedAt: utcMock,
                updatedAt: utcMock,
              },
            ],
          },
        };
        // act
        act = service.getInstallTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.getClient$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return task data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = "tata";
        expected = new BridgeXServerError(404, "not found");
        // act
        act = service.getInstallTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getLogTask$.name, () => {
    describe("normal pattern", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        const recordTask = {
          id: 1,
          taskId: "taskId",
          status: "status",
          logType: "logType",
          memo: "memo",
          createdAt: "createdAt",
          updatedAt: "updatedAt",
        };
        const records = [
          {
            ...recordTask,
            logAssetTypeId: "rl01-logAssetTypeId",
            logAssetId: "rl01-logAssetId",
            logFtpFilePath: "rl01-logFtpFilePath",
            logStatus: "rl01-logStatus",
            logErrorCode: "rl01-logErrorCode",
            logErrorMsg: "rl01-logErrorMsg",
            logCreatedAt: "rl01-logCreatedAt",
            assetTypeId: "as01-assetTypeId",
            assetId: "as01-assetId",
            assetStatus: "as01-assetStatus",
            assetStartedAt: "as01-assetStartedAt",
            assetUpdatedAt: "as01-assetUpdatedAt",
          },
          {
            ...recordTask,
            logAssetTypeId: "rl02-logAssetTypeId",
            logAssetId: "rl02-logAssetId",
            logFtpFilePath: "rl02-logFtpFilePath",
            logStatus: "rl02-logStatus",
            logErrorCode: "rl02-logErrorCode",
            logErrorMsg: "rl02-logErrorMsg",
            logCreatedAt: "rl02-logCreatedAt",
            assetTypeId: "as02-assetTypeId",
            assetId: "as02-assetId",
            assetStatus: "as02-assetStatus",
            assetStartedAt: "as02-assetStartedAt",
            assetUpdatedAt: "as02-assetUpdatedAt",
          },
        ];
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records }));
        arg = "taskId";
        expected = {
          sqlPath: `${service.sqlDir}/select-task-log.sql`,
          placeHolder: ["taskId"],
          data: {
            id: 1,
            taskId: "taskId",
            status: "status",
            logType: "logType",
            memo: "memo",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
            logs: [
              {
                id: 1,
                taskId: "taskId",
                typeId: "rl01-logAssetTypeId",
                assetId: "rl01-logAssetId",
                filePath: "rl01-logFtpFilePath",
                status: "rl01-logStatus",
                errorCode: "rl01-logErrorCode",
                errorMessage: "rl01-logErrorMsg",
                createdAt: "rl01-logCreatedAt",
              },
              {
                id: 1,
                taskId: "taskId",
                typeId: "rl02-logAssetTypeId",
                assetId: "rl02-logAssetId",
                filePath: "rl02-logFtpFilePath",
                status: "rl02-logStatus",
                errorCode: "rl02-logErrorCode",
                errorMessage: "rl02-logErrorMsg",
                createdAt: "rl02-logCreatedAt",
              },
            ],
            assets: [
              {
                id: 1,
                taskId: "taskId",
                typeId: "as01-assetTypeId",
                assetId: "as01-assetId",
                status: "as01-assetStatus",
                startedAt: "as01-assetStartedAt",
                updatedAt: "as01-assetUpdatedAt",
              },
              {
                id: 1,
                taskId: "taskId",
                typeId: "as02-assetTypeId",
                assetId: "as02-assetId",
                status: "as02-assetStatus",
                startedAt: "as02-assetStartedAt",
                updatedAt: "as02-assetUpdatedAt",
              },
            ],
          },
        };
        // act
        act = service.getLogTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.getClient$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return task data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = "taskId";
        expected = new BridgeXServerError(404, "not found");
        // act
        act = service.getLogTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getLogTaskAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: GetLogTaskAssetParam;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        const record = { id: 1, taskId: "r1", typeId: "r2", assetId: "r3", status: "r4", startedAt: "r5" };
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [record] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = {
          sqlPath: `${service.sqlDir}/select-task-log-asset.sql`,
          placeHolder: ["tata", "tyty", "asas"],
          data: record,
        };
        // act
        act = service.getLogTaskAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.getClient$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return record data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: GetLogTaskAssetParam;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(404, "not found");
        // act
        act = service.getLogTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getRebootTask$.name, () => {
    describe("normal pattern", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        const recordTask = {
          id: 1,
          taskId: "taskId",
          status: "status",
          createdBy: "createdBy",
          memo: "memo",
          createdAt: "createdAt",
          updatedAt: "updatedAt",
        };
        const records = [
          {
            ...recordTask,
            assetTypeId: "as01-assetTypeId",
            assetId: "as01-assetId",
            assetStatus: "as01-assetStatus",
            assetStartedAt: "as01-assetStartedAt",
            assetUpdatedAt: "as01-assetUpdatedAt",
            rebootTypeId: "rb01-rebootTypeId",
            rebootAssetId: "rb01-rebootAssetId",
            rebootSubTypeId: "rb01-rebootSubTypeId",
            rebootSubAssetId: "rb01-rebootSubAssetId",
            rebootStatus: "rb01-rebootStatus",
            rebootErrorCode: "rb01-rebootErrorCode",
            rebootErrorMsg: "rb01-rebootErrorMsg",
            rebootCreatedAt: "rb01-rebootCreatedAt",
            rebootUpdatedAt: "rb01-rebootUpdatedAt",
          },
          {
            ...recordTask,
            assetTypeId: "as02-assetTypeId",
            assetId: "as02-assetId",
            assetStatus: "as02-assetStatus",
            assetStartedAt: "as02-assetStartedAt",
            assetUpdatedAt: "as02-assetUpdatedAt",
            rebootTypeId: "rb02-rebootTypeId",
            rebootAssetId: "rb02-rebootAssetId",
            rebootSubTypeId: "rb02-rebootSubTypeId",
            rebootSubAssetId: "rb02-rebootSubAssetId",
            rebootStatus: "rb02-rebootStatus",
            rebootErrorCode: "rb02-rebootErrorCode",
            rebootErrorMsg: "rb02-rebootErrorMsg",
            rebootCreatedAt: "rb02-rebootCreatedAt",
            rebootUpdatedAt: "rb02-rebootUpdatedAt",
          },
        ];
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records }));
        arg = "taskId";
        expected = {
          sqlPath: `${service.sqlDir}/select-task-reboot.sql`,
          placeHolder: ["taskId"],
          data: {
            id: 1,
            taskId: "taskId",
            status: "status",
            createdBy: "createdBy",
            memo: "memo",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
            assets: [
              {
                id: 1,
                taskId: "taskId",
                typeId: "as01-assetTypeId",
                assetId: "as01-assetId",
                status: "as01-assetStatus",
                startedAt: "as01-assetStartedAt",
                updatedAt: "as01-assetUpdatedAt",
              },
              {
                id: 1,
                taskId: "taskId",
                typeId: "as02-assetTypeId",
                assetId: "as02-assetId",
                status: "as02-assetStatus",
                startedAt: "as02-assetStartedAt",
                updatedAt: "as02-assetUpdatedAt",
              },
            ],
            reboots: [
              {
                id: 1,
                taskId: "taskId",
                typeId: "rb01-rebootTypeId",
                assetId: "rb01-rebootAssetId",
                subTypeId: "rb01-rebootSubTypeId",
                subAssetId: "rb01-rebootSubAssetId",
                status: "rb01-rebootStatus",
                errorCode: "rb01-rebootErrorCode",
                errorMessage: "rb01-rebootErrorMsg",
                createdAt: "rb01-rebootCreatedAt",
                updatedAt: "rb01-rebootUpdatedAt",
              },
              {
                id: 1,
                taskId: "taskId",
                typeId: "rb02-rebootTypeId",
                assetId: "rb02-rebootAssetId",
                subTypeId: "rb02-rebootSubTypeId",
                subAssetId: "rb02-rebootSubAssetId",
                status: "rb02-rebootStatus",
                errorCode: "rb02-rebootErrorCode",
                errorMessage: "rb02-rebootErrorMsg",
                createdAt: "rb02-rebootCreatedAt",
                updatedAt: "rb02-rebootUpdatedAt",
              },
            ],
          },
        };
        // act
        act = service.getRebootTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.getClient$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return task data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = "taskId";
        expected = new BridgeXServerError(404, "not found");
        // act
        act = service.getRebootTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getRebootTaskAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: GetRebootTaskAssetParam;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        const record = { id: 1, taskId: "r1", typeId: "r2", assetId: "r3", status: "r4", startedAt: "r5" };
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [record] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = {
          sqlPath: `${service.sqlDir}/select-task-reboot-asset.sql`,
          placeHolder: ["tata", "tyty", "asas"],
          data: record,
        };
        // act
        act = service.getRebootTaskAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.getClient$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return record data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: GetRebootTaskAssetParam;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(404, "not found");
        // act
        act = service.getRebootTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getSelfTestTask$.name, () => {
    describe("normal pattern", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        const recordTask = {
          id: 1,
          taskId: "taskId",
          status: "status",
          createdBy: "createdBy",
          memo: "memo",
          createdAt: "createdAt",
          updatedAt: "updatedAt",
        };
        const records = [
          {
            ...recordTask,
            assetTypeId: "as01-assetTypeId",
            assetId: "as01-assetId",
            assetStatus: "as01-assetStatus",
            assetStartedAt: "as01-assetStartedAt",
            assetUpdatedAt: "as01-assetUpdatedAt",
            selftestTypeId: "st01-selftestTypeId",
            selftestAssetId: "st01-selftestAssetId",
            selftestSubTypeId: "st01-selftestSubTypeId",
            selftestSubAssetId: "st01-selftestSubAssetId",
            selftestStatus: "st01-selftestStatus",
            selftestErrorCode: "st01-selftestErrorCode",
            selftestErrorMsg: "st01-selftestErrorMsg",
            selftestCreatedAt: "st01-selftestCreatedAt",
            selftestUpdatedAt: "st01-selftestUpdatedAt",
          },
          {
            ...recordTask,
            assetTypeId: "as02-assetTypeId",
            assetId: "as02-assetId",
            assetStatus: "as02-assetStatus",
            assetStartedAt: "as02-assetStartedAt",
            assetUpdatedAt: "as02-assetUpdatedAt",
            selftestTypeId: "st02-selftestTypeId",
            selftestAssetId: "st02-selftestAssetId",
            selftestSubTypeId: "st02-selftestSubTypeId",
            selftestSubAssetId: "st02-selftestSubAssetId",
            selftestStatus: "st02-selftestStatus",
            selftestErrorCode: "st02-selftestErrorCode",
            selftestErrorMsg: "st02-selftestErrorMsg",
            selftestCreatedAt: "st02-selftestCreatedAt",
            selftestUpdatedAt: "st02-selftestUpdatedAt",
          },
        ];
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records }));
        arg = "taskId";
        expected = {
          sqlPath: `${service.sqlDir}/select-task-selftest.sql`,
          placeHolder: ["taskId"],
          data: {
            id: 1,
            taskId: "taskId",
            status: "status",
            createdBy: "createdBy",
            memo: "memo",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
            assets: [
              {
                id: 1,
                taskId: "taskId",
                typeId: "as01-assetTypeId",
                assetId: "as01-assetId",
                status: "as01-assetStatus",
                startedAt: "as01-assetStartedAt",
                updatedAt: "as01-assetUpdatedAt",
              },
              {
                id: 1,
                taskId: "taskId",
                typeId: "as02-assetTypeId",
                assetId: "as02-assetId",
                status: "as02-assetStatus",
                startedAt: "as02-assetStartedAt",
                updatedAt: "as02-assetUpdatedAt",
              },
            ],
            selftests: [
              {
                id: 1,
                taskId: "taskId",
                typeId: "st01-selftestTypeId",
                assetId: "st01-selftestAssetId",
                subTypeId: "st01-selftestSubTypeId",
                subAssetId: "st01-selftestSubAssetId",
                status: "st01-selftestStatus",
                errorCode: "st01-selftestErrorCode",
                errorMessage: "st01-selftestErrorMsg",
                createdAt: "st01-selftestCreatedAt",
                updatedAt: "st01-selftestUpdatedAt",
              },
              {
                id: 1,
                taskId: "taskId",
                typeId: "st02-selftestTypeId",
                assetId: "st02-selftestAssetId",
                subTypeId: "st02-selftestSubTypeId",
                subAssetId: "st02-selftestSubAssetId",
                status: "st02-selftestStatus",
                errorCode: "st02-selftestErrorCode",
                errorMessage: "st02-selftestErrorMsg",
                createdAt: "st02-selftestCreatedAt",
                updatedAt: "st02-selftestUpdatedAt",
              },
            ],
          },
        };
        // act
        act = service.getSelfTestTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.getClient$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return task data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = "taskId";
        expected = new BridgeXServerError(404, "not found");
        // act
        act = service.getSelfTestTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getSelfTestTaskAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: GetSelfTestTaskAssetParam;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        const record = { id: 1, taskId: "r1", typeId: "r2", assetId: "r3", status: "r4", startedAt: "r5" };
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [record] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = {
          sqlPath: `${service.sqlDir}/select-task-selftest-asset.sql`,
          placeHolder: ["tata", "tyty", "asas"],
          data: record,
        };
        // act
        act = service.getSelfTestTaskAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.getClient$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return record data", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: GetSelfTestTaskAssetParam;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(404, "not found");
        // act
        act = service.getSelfTestTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.insertDownloadPackageTask$.name, () => {
    it("should execute transaction to insert DownloadPackage task", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "001",
        name: "task1",
        status: ETaskStatus.Scheduled,
        createdBy: "Jack",
        assets: [],
        packages: [
          {
            packageId: "00000000-0000-0000-0000-000000000000",
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementationOnce(() => throwError({}));

      // act
      return service
        .insertDownloadPackageTask$(params)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch(() => {
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(configService.postgresConfig(), expect.anything());
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(1);
        });
    });

    it("should not execute insert assets of DownloadPackage task when assets are empty", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "001",
        name: "task1",
        status: ETaskStatus.Scheduled,
        createdBy: "Jack",
        assets: [],
        packages: [
          {
            packageId: "00000000-0000-0000-0000-000000000000",
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementationOnce(() => of({} as any));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-task-download-package.sql`,
        placeHolder: [params.taskId, params.name, params.packages[0].packageId, params.status, params.createdBy],
      };

      // act
      return service
        .insertDownloadPackageTask$(params)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.sqlPath, expected.placeHolder);
        })
        .catch((e) => fail(e));
    });

    it("should execute transaction to insert an asset of DownloadPackage task", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "001",
        name: "task1",
        status: ETaskStatus.Scheduled,
        createdBy: "Jack",
        assets: [
          {
            status: ETaskAssetStatus.Scheduled,
            assetId: "ai01",
            typeId: "ty01",
          },
        ],
        packages: [
          {
            packageId: "00000000-0000-0000-0000-000000000000",
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementationOnce(() => of({} as any));
      jest.spyOn(clientMock, "queryByFile$").mockImplementationOnce(() => throwError({}));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-task-download-package-assets.sql`,
        placeHolder: [params.taskId, params.assets[0].assetId, params.assets[0].typeId, params.assets[0].status],
      };

      // act
      return service
        .insertDownloadPackageTask$(params)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch(() => {
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(configService.postgresConfig(), expect.anything());
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(2, expected.sqlPath, expected.placeHolder);
        });
    });

    it("should execute transaction to insert assets of DownloadPackage task for each asset", () => {
      // arrange
      const params: InsertDownloadPackageTaskParams = {
        taskId: "001",
        name: "task1",
        status: ETaskStatus.Scheduled,
        createdBy: "Jack",
        assets: [
          {
            status: ETaskAssetStatus.Scheduled,
            assetId: "ai01",
            typeId: "ty01",
          },
          {
            status: ETaskAssetStatus.Scheduled,
            assetId: "ai02",
            typeId: "ty02",
          },
        ],
        packages: [
          {
            packageId: "00000000-0000-0000-0000-000000000000",
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of({} as any));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-task-download-package-assets.sql`,
        placeHolder1: [params.taskId, params.assets[0].assetId, params.assets[0].typeId, params.assets[0].status],
        placeHolder2: [params.taskId, params.assets[1].assetId, params.assets[1].typeId, params.assets[1].status],
      };

      // act
      return service
        .insertDownloadPackageTask$(params)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(3);
          expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder1);
          expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder2);
        })
        .catch((e) => fail(e));
    });
  });

  describe(TasksService.prototype.insertInstallTask$.name, () => {
    it("should execute transaction to insert Install task", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "001",
        name: "task1",
        status: ETaskStatus.Scheduled,
        createdBy: "Jack",
        assets: [],
        packages: [
          {
            packageId: "00000000-0000-0000-0000-000000000000",
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementationOnce(() => throwError({}));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-task-install.sql`,
        placeHolder: [params.taskId, params.name, params.packages[0].packageId, params.status, params.createdBy],
      };

      // act
      return service
        .insertInstallTask$(params)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch(() => {
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(configService.postgresConfig(), expect.anything());
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.sqlPath, expected.placeHolder);
        });
    });

    it("should not execute insert assets of Install task when assets are empty", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "001",
        name: "task1",
        status: ETaskStatus.Scheduled,
        createdBy: "Jack",
        assets: [],
        packages: [
          {
            packageId: "00000000-0000-0000-0000-000000000000",
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementationOnce(() => of({} as any));

      // act
      return service
        .insertInstallTask$(params)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(1);
        })
        .catch((e) => fail(e));
    });

    it("should execute transaction to insert Install task", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "001",
        name: "task1",
        status: ETaskStatus.Scheduled,
        createdBy: "Jack",
        assets: [
          {
            status: ETaskAssetStatus.Scheduled,
            assetId: "ai01",
            typeId: "ty01",
          },
        ],
        packages: [
          {
            packageId: "00000000-0000-0000-0000-000000000000",
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementationOnce(() => of({} as any));
      jest.spyOn(clientMock, "queryByFile$").mockImplementationOnce(() => throwError({}));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-task-install-assets.sql`,
        placeHolder: [params.taskId, params.assets[0].assetId, params.assets[0].typeId, params.assets[0].status],
      };

      // act
      return service
        .insertInstallTask$(params)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch(() => {
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(configService.postgresConfig(), expect.anything());
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(2, expected.sqlPath, expected.placeHolder);
        });
    });

    it("should execute transaction to insert Install task for each asset", () => {
      // arrange
      const params: InsertInstallTaskParams = {
        taskId: "001",
        name: "task1",
        status: ETaskStatus.Scheduled,
        createdBy: "Jack",
        assets: [
          {
            status: ETaskAssetStatus.Scheduled,
            assetId: "ai01",
            typeId: "ty01",
          },
          {
            status: ETaskAssetStatus.Scheduled,
            assetId: "ai02",
            typeId: "ty02",
          },
        ],
        packages: [
          {
            packageId: "00000000-0000-0000-0000-000000000000",
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of({} as any));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-task-install-assets.sql`,
        placeHolder1: [params.taskId, params.assets[0].assetId, params.assets[0].typeId, params.assets[0].status],
        placeHolder2: [params.taskId, params.assets[1].assetId, params.assets[1].typeId, params.assets[1].status],
      };

      // act
      return service
        .insertInstallTask$(params)
        .toPromise()
        .catch((data) => {
          expect(data).toEqual(null);
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(3);
          expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder1);
          expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder2);
        })
        .catch((e) => fail(e));
    });
  });

  describe(TasksService.prototype.insertDeploymentRelation$.name, () => {
    it("should execute insert deployment relation", () => {
      // arrange
      const params: InsertDeploymentRelationParams = {
        downloadPackageId: "downloadPackageId",
        installId: "installId",
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => throwError({}));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-task-relation.sql`,
        placeHolder: [params.downloadPackageId, params.installId],
      };

      // act
      return service
        .insertDeploymentRelation$(params)
        .toPromise()
        .then(() => fail("unexpected here"))
        .catch(() => {
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(configService.postgresConfig(), expect.anything());
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.sqlPath, expected.placeHolder);
        });
    });

    it("should execute insert deployment relation", () => {
      // arrange
      const params: InsertDeploymentRelationParams = {
        downloadPackageId: "downloadPackageId",
        installId: "installId",
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of({} as any));

      const expected = null;

      // act
      return service
        .insertDeploymentRelation$(params)
        .toPromise()
        .then((data: any) => {
          expect(data).toEqual(expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(TasksService.prototype.insertLogTask$.name, () => {
    it("should execute insert log task", (done) => {
      // arrange
      const params: InsertLogTaskParams = {
        taskId: "001",
        status: ETaskStatus.Scheduled,
        logType: "Business",
        createdBy: "test taro",
        memo: "abcde",
        assets: [
          {
            assetId: "ai01",
            typeId: "ty01",
            status: ETaskAssetStatus.Scheduled,
          },
          {
            assetId: "ai02",
            typeId: "ty02",
            status: ETaskAssetStatus.Scheduled,
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(null as any));

      const expected = {
        taskLog: {
          sqlPath: `${service.sqlDir}/insert-task-log.sql`,
          placeHolder: ["001", ETaskStatus.Scheduled, "Business", "test taro", "abcde"],
        },
        taskLogAssets01: {
          sqlPath: `${service.sqlDir}/insert-task-log-assets.sql`,
          placeHolder: ["001", "ai01", "ty01", ETaskAssetStatus.Scheduled],
        },
        taskLogAssets02: {
          sqlPath: `${service.sqlDir}/insert-task-log-assets.sql`,
          placeHolder: ["001", "ai02", "ty02", ETaskAssetStatus.Scheduled],
        },
      };

      // act
      service.insertLogTask$(params).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(3);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.taskLog.sqlPath, expected.taskLog.placeHolder);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(
            2,
            expected.taskLogAssets01.sqlPath,
            expected.taskLogAssets01.placeHolder,
          );
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(
            3,
            expected.taskLogAssets02.sqlPath,
            expected.taskLogAssets02.placeHolder,
          );
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });
  });

  describe(TasksService.prototype.insertRebootSelfTestTask$.name, () => {
    it("should execute insert reboot task", (done) => {
      // arrange
      const params: InsertRebootSelfTestTaskParams = {
        taskId: "001",
        status: ETaskStatus.Scheduled,
        createdBy: "test taro",
        memo: "abcde",
        assets: [
          {
            assetId: "ai01",
            typeId: "ty01",
            status: ETaskAssetStatus.Scheduled,
          },
          {
            assetId: "ai02",
            typeId: "ty02",
            status: ETaskAssetStatus.Scheduled,
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(null as any));

      const req = {
        path: "/tasks/reboot",
      };

      const expected = {
        task: {
          sqlPath: `${service.sqlDir}/insert-task-reboot.sql`,
          placeHolder: ["001", ETaskStatus.Scheduled, "test taro", "abcde"],
        },
        taskAssets01: {
          sqlPath: `${service.sqlDir}/insert-task-reboot-assets.sql`,
          placeHolder: ["001", "ai01", "ty01", ETaskAssetStatus.Scheduled],
        },
        taskAssets02: {
          sqlPath: `${service.sqlDir}/insert-task-reboot-assets.sql`,
          placeHolder: ["001", "ai02", "ty02", ETaskAssetStatus.Scheduled],
        },
      };

      // act
      service.insertRebootSelfTestTask$(req as any, params).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(3);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.task.sqlPath, expected.task.placeHolder);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(2, expected.taskAssets01.sqlPath, expected.taskAssets01.placeHolder);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(3, expected.taskAssets02.sqlPath, expected.taskAssets02.placeHolder);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });
  });

  describe(TasksService.prototype.insertRebootSelfTestTask$.name, () => {
    it("should execute insert selfTest task", (done) => {
      // arrange
      const params: InsertRebootSelfTestTaskParams = {
        taskId: "001",
        status: ETaskStatus.Scheduled,
        createdBy: "test taro",
        memo: "abcde",
        assets: [
          {
            assetId: "ai01",
            typeId: "ty01",
            status: ETaskAssetStatus.Scheduled,
          },
          {
            assetId: "ai02",
            typeId: "ty02",
            status: ETaskAssetStatus.Scheduled,
          },
        ],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(null as any));

      const req = {
        path: "/tasks/selfTest",
      };

      const expected = {
        task: {
          sqlPath: `${service.sqlDir}/insert-task-selftest.sql`,
          placeHolder: ["001", ETaskStatus.Scheduled, "test taro", "abcde"],
        },
        taskAssets01: {
          sqlPath: `${service.sqlDir}/insert-task-selftest-assets.sql`,
          placeHolder: ["001", "ai01", "ty01", ETaskAssetStatus.Scheduled],
        },
        taskAssets02: {
          sqlPath: `${service.sqlDir}/insert-task-selftest-assets.sql`,
          placeHolder: ["001", "ai02", "ty02", ETaskAssetStatus.Scheduled],
        },
      };

      // act
      service.insertRebootSelfTestTask$(req as any, params).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(3);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.task.sqlPath, expected.task.placeHolder);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(2, expected.taskAssets01.sqlPath, expected.taskAssets01.placeHolder);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(3, expected.taskAssets02.sqlPath, expected.taskAssets02.placeHolder);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });
  });

  describe(TasksService.prototype.insertTaskLogRetrievelog$.name, () => {
    it("should execute insert task log retrievelogs", (done) => {
      // arrange
      const params: InsertLogTaskRetrievelogParams = {
        taskId: "taskId",
        assetId: "assetId",
        typeId: "typeId",
        filePath: "filePath",
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(null as any));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-task-log-retrievelogs.sql`,
        placeHolder: ["taskId", "assetId", "typeId", "filePath"],
      };

      // act
      service.insertTaskLogRetrievelog$(params).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(1);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.sqlPath, expected.placeHolder);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });
  });

  describe(TasksService.prototype.insertRetrievelog$.name, () => {
    it("should execute insert retrievelogs", (done) => {
      // arrange
      const params: InsertRetrievelogParams = {
        taskId: "taskId",
        assetId: "assetId",
        typeId: "typeId",
        status: "status",
        errorCode: "errorCode",
        errorMsg: "errorMsg",
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(null as any));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-retrievelogs.sql`,
        placeHolder: ["taskId", "assetId", "typeId", "status", "errorCode", "errorMsg"],
      };

      // act
      service.insertRetrievelog$(params).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(1);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.sqlPath, expected.placeHolder);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });
  });

  describe(TasksService.prototype.insertReboot$.name, () => {
    it("should execute insert reboots", (done) => {
      // arrange
      const params: InsertRebootSelfTestParams = {
        taskId: "taskId",
        assetId: "assetId",
        typeId: "typeId",
        subAssetId: "subAssetId",
        subTypeId: "subTypeId",
        status: "status",
        errorCode: "errorCode",
        errorMsg: "errorMsg",
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(null as any));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-reboots.sql`,
        placeHolder: ["taskId", "assetId", "typeId", "subAssetId", "subTypeId", "status", "errorCode", "errorMsg"],
      };

      // act
      service.insertReboot$(params).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(1);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.sqlPath, expected.placeHolder);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });
  });

  describe(TasksService.prototype.insertSelfTest$.name, () => {
    it("should execute insert selftests", (done) => {
      // arrange
      const params: InsertRebootSelfTestParams = {
        taskId: "taskId",
        assetId: "assetId",
        typeId: "typeId",
        subAssetId: "subAssetId",
        subTypeId: "subTypeId",
        status: "status",
        errorCode: "errorCode",
        errorMsg: "errorMsg",
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(null as any));

      const expected = {
        sqlPath: `${service.sqlDir}/insert-selftests.sql`,
        placeHolder: ["taskId", "assetId", "typeId", "subAssetId", "subTypeId", "status", "errorCode", "errorMsg"],
      };

      // act
      service.insertSelfTest$(params).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(1);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected.sqlPath, expected.placeHolder);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });
  });

  describe(TasksService.prototype.updateDownloadPackageTaskToInprogress$.name, () => {
    describe("normal pattern", () => {
      let arg: DownloadPackageTask;
      let expected: any;
      let act: any;

      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        jest.spyOn(service, "updateDownloadPackageTaskAsset$").mockReturnValue(of(null as any));
        arg = {
          id: "id",
          assets: [
            { typeId: "ty01", assetId: "as01", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock },
            { typeId: "ty02", assetId: "as02", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock },
            { typeId: "ty03", assetId: "as03", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock },
          ],
        } as any;
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-download-package.sql`,
            placeHolder: ["id", "InProgress"],
          },
          updateTaskAsset: [
            { taskId: "id", typeId: "ty01", assetId: "as01", status: "InProgress", startedAt: utcMock },
            { taskId: "id", typeId: "ty02", assetId: "as02", status: "InProgress", startedAt: utcMock },
            { taskId: "id", typeId: "ty03", assetId: "as03", status: "InProgress", startedAt: utcMock },
          ],
          data: null,
        };
        // act
        act = service.updateDownloadPackageTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should call updateTaskAsset$", () => {
        return act
          .then(() => {
            expect(service.updateDownloadPackageTaskAsset$).toHaveBeenCalledTimes(3);
            expect(service.updateDownloadPackageTaskAsset$).toHaveBeenNthCalledWith(1, expected.updateTaskAsset[0]);
            expect(service.updateDownloadPackageTaskAsset$).toHaveBeenNthCalledWith(2, expected.updateTaskAsset[1]);
            expect(service.updateDownloadPackageTaskAsset$).toHaveBeenNthCalledWith(3, expected.updateTaskAsset[2]);
          })
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: DownloadPackageTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          id: "id",
          assets: [{ typeId: "ty01", assetId: "as01", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock }],
        } as any;
        expected = new BridgeXServerError(404, "The specified task is not found");
        // act
        act = service.updateDownloadPackageTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: DownloadPackageTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          id: "id",
          assets: [{ typeId: "ty01", assetId: "as01", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock }],
        } as any;
        expected = new BridgeXServerError(500, "The specified task is a duplicate");
        // act
        act = service.updateDownloadPackageTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateDownloadPackageTask$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateDownloadPackageTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-download-package.sql`,
            placeHolder: ["tata", "Complete"],
          },
          data: null,
        };
        // act
        act = service.updateDownloadPackageTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateDownloadPackageTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(404, "The specified task is not found");
        // act
        act = service.updateDownloadPackageTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateDownloadPackageTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(500, "The specified task is a duplicate");
        // act
        act = service.updateDownloadPackageTask$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateDownloadPackageTaskAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateDownloadPackageTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
          startedAt: moment("1234/05/06 12:34:56"),
        };
        expected = {
          sqlPath: `${service.sqlDir}/update-task-download-package-asset.sql`,
          placeHolder: ["tata", "tyty", "asas", "InProgress", "1234-05-06 12:34:56"],
          data: null,
        };
        // act
        act = service.updateDownloadPackageTaskAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateDownloadPackageTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
        };
        expected = new BridgeXServerError(404, "The specified task asset is not found");
        // act
        act = service.updateDownloadPackageTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateDownloadPackageTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
        };
        expected = new BridgeXServerError(500, "The specified task asset is a duplicate");
        // act
        act = service.updateDownloadPackageTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateInstallTaskToInprogress$.name, () => {
    describe("normal pattern", () => {
      let arg: InstallTask;
      let expected: any;
      let act: any;

      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        jest.spyOn(service, "updateInstallTaskAsset$").mockReturnValue(of(null as any));
        arg = {
          id: "id",
          assets: [
            { typeId: "ty01", assetId: "as01", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock },
            { typeId: "ty02", assetId: "as02", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock },
            { typeId: "ty03", assetId: "as03", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock },
          ],
        } as any;
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-install.sql`,
            placeHolder: ["id", "InProgress"],
          },
          updateTaskAsset: [
            { taskId: "id", typeId: "ty01", assetId: "as01", status: "InProgress", startedAt: utcMock },
            { taskId: "id", typeId: "ty02", assetId: "as02", status: "InProgress", startedAt: utcMock },
            { taskId: "id", typeId: "ty03", assetId: "as03", status: "InProgress", startedAt: utcMock },
          ],
          data: null,
        };
        // act
        act = service.updateInstallTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should call updateTaskAsset$", () => {
        return act
          .then(() => {
            expect(service.updateInstallTaskAsset$).toHaveBeenCalledTimes(3);
            expect(service.updateInstallTaskAsset$).toHaveBeenNthCalledWith(1, expected.updateTaskAsset[0]);
            expect(service.updateInstallTaskAsset$).toHaveBeenNthCalledWith(2, expected.updateTaskAsset[1]);
            expect(service.updateInstallTaskAsset$).toHaveBeenNthCalledWith(3, expected.updateTaskAsset[2]);
          })
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: InstallTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          id: "id",
          assets: [{ typeId: "ty01", assetId: "as01", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock }],
        } as any;
        expected = new BridgeXServerError(404, "The specified task is not found");
        // act
        act = service.updateInstallTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: DownloadPackageTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          id: "id",
          assets: [{ typeId: "ty01", assetId: "as01", status: ETaskAssetStatus.InProgress, startedAt: utcMock, updatedAt: utcMock }],
        } as any;
        expected = new BridgeXServerError(500, "The specified task is a duplicate");
        // act
        act = service.updateDownloadPackageTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateInstallTask$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateInstallTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-install.sql`,
            placeHolder: ["tata", "Complete"],
          },
          data: null,
        };
        // act
        act = service.updateInstallTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateInstallTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(404, "The specified task is not found");
        // act
        act = service.updateInstallTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateInstallTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(500, "The specified task is a duplicate");
        // act
        act = service.updateInstallTask$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateInstallTaskAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateInstallTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
          startedAt: moment("1234/05/06 12:34:56"),
        };
        expected = {
          sqlPath: `${service.sqlDir}/update-task-install-asset.sql`,
          placeHolder: ["tata", "tyty", "asas", "InProgress", "1234-05-06 12:34:56"],
          data: null,
        };
        // act
        act = service.updateInstallTaskAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateInstallTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
        };
        expected = new BridgeXServerError(404, "The specified task asset is not found");
        // act
        act = service.updateInstallTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateInstallTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
        };
        expected = new BridgeXServerError(500, "The specified task asset is a duplicate");
        // act
        act = service.updateInstallTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateLogTaskToInprogress$.name, () => {
    describe("normal pattern", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        const task = {
          assets: [
            { taskId: "ta01", typeId: "ty01", assetId: "as01" },
            { taskId: "ta02", typeId: "ty02", assetId: "as02" },
            { taskId: "ta03", typeId: "ty03", assetId: "as03" },
          ],
        } as LogTask;
        jest.spyOn(service, "getLogTask$").mockReturnValue(of(task));
        jest.spyOn(service, "updateLogTaskAsset$").mockReturnValue(of(null as any));
        arg = "tata";
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-log.sql`,
            placeHolder: ["tata", "InProgress"],
          },
          getLogTask: "tata",
          updateLogTaskAsset: [
            { taskId: "ta01", typeId: "ty01", assetId: "as01", status: "InProgress", startedAt: utcMock },
            { taskId: "ta02", typeId: "ty02", assetId: "as02", status: "InProgress", startedAt: utcMock },
            { taskId: "ta03", typeId: "ty03", assetId: "as03", status: "InProgress", startedAt: utcMock },
          ],
          data: null,
        };
        // act
        act = service.updateLogTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should call getLogTask$", () => {
        return act.then(() => expect(service.getLogTask$).toHaveBeenCalledWith(expected.getLogTask)).catch((e: any) => fail(e));
      });
      it("should call updateLogTaskAsset$", () => {
        return act
          .then(() => {
            expect(service.updateLogTaskAsset$).toHaveBeenCalledTimes(3);
            expect(service.updateLogTaskAsset$).toHaveBeenNthCalledWith(1, expected.updateLogTaskAsset[0]);
            expect(service.updateLogTaskAsset$).toHaveBeenNthCalledWith(2, expected.updateLogTaskAsset[1]);
            expect(service.updateLogTaskAsset$).toHaveBeenNthCalledWith(3, expected.updateLogTaskAsset[2]);
          })
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = "tata";
        expected = new BridgeXServerError(404, "The specified task log is not found");
        // act
        act = service.updateLogTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = "tata";
        expected = new BridgeXServerError(500, "The specified task log is a duplicate");
        // act
        act = service.updateLogTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateLogTask$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-log.sql`,
            placeHolder: ["tata", "Complete"],
          },
          data: null,
        };
        // act
        act = service.updateLogTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(404, "The specified task log is not found");
        // act
        act = service.updateLogTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(500, "The specified task log is a duplicate");
        // act
        act = service.updateLogTask$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateLogTaskAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
          startedAt: moment("1234/05/06 12:34:56"),
        };
        expected = {
          sqlPath: `${service.sqlDir}/update-task-log-asset.sql`,
          placeHolder: ["tata", "tyty", "asas", "InProgress", "1234-05-06 12:34:56"],
          data: null,
        };
        // act
        act = service.updateLogTaskAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(404, "The specified task log asset is not found");
        // act
        act = service.updateLogTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(500, "The specified task log asset is a duplicate");
        // act
        act = service.updateLogTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getAssetLogFilePath$.name, () => {
    it("should query with correct sqlPath and placeholder", () => {
      // arrange
      const params: GetAssetLogFilePath = {
        taskId: "taskId",
        typeId: "typeId",
        assetId: "assetId",
      };

      const expected = {
        sqlPath: `${service.sqlDir}/select-asset-log-file-path.sql`,
        placeHolder: [params.taskId, params.typeId, params.assetId],
      };

      postgresService.controlTransaction$ = jest.fn((a: any, fn: (c: any) => any) => fn(clientMock)) as any;
      clientMock.queryByFile$ = jest.fn(() => of({} as any));

      // act
      return service
        .getAssetLogFilePath$(params)
        .toPromise()
        .then(() => {
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(configService.postgresConfig(), expect.anything());
          expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder);
        })
        .catch(fail);
    });
  });

  describe(TasksService.prototype.updateRebootTaskToInprogress$.name, () => {
    describe("normal pattern", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        const task = {
          assets: [
            { taskId: "ta01", typeId: "ty01", assetId: "as01" },
            { taskId: "ta02", typeId: "ty02", assetId: "as02" },
            { taskId: "ta03", typeId: "ty03", assetId: "as03" },
          ],
        } as any;
        jest.spyOn(service, "getRebootTask$").mockReturnValue(of(task));
        jest.spyOn(service, "updateRebootTaskAsset$").mockReturnValue(of(null as any));
        arg = "tata";
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-reboot.sql`,
            placeHolder: ["tata", "InProgress"],
          },
          getRebootTask: "tata",
          updateRebootTaskAsset: [
            { taskId: "ta01", typeId: "ty01", assetId: "as01", status: "InProgress", startedAt: utcMock },
            { taskId: "ta02", typeId: "ty02", assetId: "as02", status: "InProgress", startedAt: utcMock },
            { taskId: "ta03", typeId: "ty03", assetId: "as03", status: "InProgress", startedAt: utcMock },
          ],
          data: null,
        };
        // act
        act = service.updateRebootTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should call getRebootTask$", () => {
        return act.then(() => expect(service.getRebootTask$).toHaveBeenCalledWith(expected.getRebootTask)).catch((e: any) => fail(e));
      });
      it("should call updateRebootTaskAsset$", () => {
        return act
          .then(() => {
            expect(service.updateRebootTaskAsset$).toHaveBeenCalledTimes(3);
            expect(service.updateRebootTaskAsset$).toHaveBeenNthCalledWith(1, expected.updateRebootTaskAsset[0]);
            expect(service.updateRebootTaskAsset$).toHaveBeenNthCalledWith(2, expected.updateRebootTaskAsset[1]);
            expect(service.updateRebootTaskAsset$).toHaveBeenNthCalledWith(3, expected.updateRebootTaskAsset[2]);
          })
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = "tata";
        expected = new BridgeXServerError(404, "The specified task reboot is not found");
        // act
        act = service.updateRebootTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = "tata";
        expected = new BridgeXServerError(500, "The specified task reboot is a duplicate");
        // act
        act = service.updateRebootTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateSelfTestTaskToInprogress$.name, () => {
    describe("normal pattern", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        const task = {
          assets: [
            { taskId: "ta01", typeId: "ty01", assetId: "as01" },
            { taskId: "ta02", typeId: "ty02", assetId: "as02" },
            { taskId: "ta03", typeId: "ty03", assetId: "as03" },
          ],
        } as any;
        jest.spyOn(service, "getSelfTestTask$").mockReturnValue(of(task));
        jest.spyOn(service, "updateSelfTestTaskAsset$").mockReturnValue(of(null as any));
        arg = "tata";
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-selftest.sql`,
            placeHolder: ["tata", "InProgress"],
          },
          getSelfTestTask: "tata",
          updateSelfTestTaskAsset: [
            { taskId: "ta01", typeId: "ty01", assetId: "as01", status: "InProgress", startedAt: utcMock },
            { taskId: "ta02", typeId: "ty02", assetId: "as02", status: "InProgress", startedAt: utcMock },
            { taskId: "ta03", typeId: "ty03", assetId: "as03", status: "InProgress", startedAt: utcMock },
          ],
          data: null,
        };
        // act
        act = service.updateSelfTestTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should call getSelfTestTask$", () => {
        return act.then(() => expect(service.getSelfTestTask$).toHaveBeenCalledWith(expected.getSelfTestTask)).catch((e: any) => fail(e));
      });
      it("should call updateSelfTestTaskAsset$", () => {
        return act
          .then(() => {
            expect(service.updateSelfTestTaskAsset$).toHaveBeenCalledTimes(3);
            expect(service.updateSelfTestTaskAsset$).toHaveBeenNthCalledWith(1, expected.updateSelfTestTaskAsset[0]);
            expect(service.updateSelfTestTaskAsset$).toHaveBeenNthCalledWith(2, expected.updateSelfTestTaskAsset[1]);
            expect(service.updateSelfTestTaskAsset$).toHaveBeenNthCalledWith(3, expected.updateSelfTestTaskAsset[2]);
          })
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = "tata";
        expected = new BridgeXServerError(404, "The specified task self test is not found");
        // act
        act = service.updateSelfTestTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: string;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = "tata";
        expected = new BridgeXServerError(500, "The specified task self test is a duplicate");
        // act
        act = service.updateSelfTestTaskToInprogress$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateRebootTask$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-reboot.sql`,
            placeHolder: ["tata", "Complete"],
          },
          data: null,
        };
        // act
        act = service.updateRebootTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(404, "The specified task reboot is not found");
        // act
        act = service.updateRebootTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(500, "The specified task reboot is a duplicate");
        // act
        act = service.updateRebootTask$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateRebootTaskAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
          startedAt: moment("1234/05/06 12:34:56"),
        };
        expected = {
          sqlPath: `${service.sqlDir}/update-task-reboot-asset.sql`,
          placeHolder: ["tata", "tyty", "asas", "InProgress", "1234-05-06 12:34:56"],
          data: null,
        };
        // act
        act = service.updateRebootTaskAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(404, "The specified task reboot asset is not found");
        // act
        act = service.updateRebootTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(500, "The specified task reboot asset is a duplicate");
        // act
        act = service.updateRebootTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateRebootTaskSubAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateRebootTaskSubAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          subTypeId: "sbtyty",
          subAssetId: "sbasas",
          status: ERebootStatus.Error,
          errorCode: "ecec",
          errorMessage: "emem",
        };
        expected = {
          sqlPath: `${service.sqlDir}/update-reboots-subasset.sql`,
          placeHolder: ["tata", "tyty", "asas", "sbtyty", "sbasas", "Error", "ecec", "emem", utcMock],
          data: null,
        };
        // act
        act = service.updateRebootTaskSubAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateRebootTaskSubAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          subTypeId: "sbtyty",
          subAssetId: "sbasas",
          status: "stst",
          errorCode: "ecec",
          errorMessage: "emem",
        };
        expected = new BridgeXServerError(404, "The specified reboots sub asset is not found");
        // act
        act = service.updateRebootTaskSubAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateRebootTaskSubAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          subTypeId: "sbtyty",
          subAssetId: "sbasas",
          status: ETaskAssetStatus.InProgress,
          errorCode: "ecec",
          errorMessage: "emem",
        };
        expected = new BridgeXServerError(500, "The specified reboots sub asset is a duplicate");
        // act
        act = service.updateRebootTaskSubAsset$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateSelfTestTask$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/update-task-selftest.sql`,
            placeHolder: ["tata", "Complete"],
          },
          data: null,
        };
        // act
        act = service.updateSelfTestTask$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(404, "The specified task self test is not found");
        // act
        act = service.updateSelfTestTask$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateLogTask;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          status: ETaskStatus.Complete,
        };
        expected = new BridgeXServerError(500, "The specified task self test is a duplicate");
        // act
        act = service.updateSelfTestTask$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateSelfTestTaskAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          status: ETaskAssetStatus.InProgress,
          startedAt: moment("1234/05/06 12:34:56"),
        };
        expected = {
          sqlPath: `${service.sqlDir}/update-task-selftest-asset.sql`,
          placeHolder: ["tata", "tyty", "asas", "InProgress", "1234-05-06 12:34:56"],
          data: null,
        };
        // act
        act = service.updateSelfTestTaskAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(404, "The specified task self test asset is not found");
        // act
        act = service.updateSelfTestTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateLogTaskAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
        };
        expected = new BridgeXServerError(500, "The specified task self test asset is a duplicate");
        // act
        act = service.updateSelfTestTaskAsset$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.updateSelfTestTaskSubAsset$.name, () => {
    describe("normal pattern", () => {
      let arg: UpdateSelfTestTaskSubAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        const utcMock = moment.utc("1234-05-06 12:34:56");
        jest.spyOn(moment, "utc").mockReturnValue(utcMock);
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 1, records: [{}] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          subTypeId: "sbtyty",
          subAssetId: "sbasas",
          status: ESelfTestStatus.Error,
          errorCode: "ecec",
          errorMessage: "emem",
        };
        expected = {
          sqlPath: `${service.sqlDir}/update-selftests-subasset.sql`,
          placeHolder: ["tata", "tyty", "asas", "sbtyty", "sbasas", "Error", "ecec", "emem", utcMock],
          data: null,
        };
        // act
        act = service.updateSelfTestTaskSubAsset$(arg).toPromise();
      });
      // assert
      it("should call controlTransaction", () => {
        return act.then(() => expect(postgresService.controlTransaction$).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call queryByFile with correct sqlPath and placeHolder", () => {
        return act
          .then(() => expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder))
          .catch((e: any) => fail(e));
      });
      it("should return null", () => {
        return act.then((data: any) => expect(data).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records.count = 0", () => {
      let arg: UpdateSelfTestTaskSubAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 0, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          subTypeId: "sbtyty",
          subAssetId: "sbasas",
          status: "stst",
          errorCode: "ecec",
          errorMessage: "emem",
        };
        expected = new BridgeXServerError(404, "The specified selftests sub asset is not found");
        // act
        act = service.updateSelfTestTaskSubAsset$(arg).toPromise();
      });
      // assert
      it("should return 404", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });

    describe("when records.count > 1", () => {
      let arg: UpdateSelfTestTaskSubAsset;
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
        jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
        jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of({ count: 2, records: [] }));
        arg = {
          taskId: "tata",
          typeId: "tyty",
          assetId: "asas",
          subTypeId: "sbtyty",
          subAssetId: "sbasas",
          status: "stst",
          errorCode: "ecec",
          errorMessage: "emem",
        };
        expected = new BridgeXServerError(500, "The specified selftests sub asset is a duplicate");
        // act
        act = service.updateSelfTestTaskSubAsset$(arg).toPromise();
      });
      // assert
      it("should return 500", () => {
        return act.then((data: any) => fail(data)).catch((e: any) => expect(e).toEqual(expected));
      });
    });
  });

  describe(TasksService.prototype.getAssetLogFilePath$.name, () => {
    it("should query with correct sqlPath and placeholder", () => {
      // arrange
      const params: GetAssetLogFilePath = {
        taskId: "taskId",
        typeId: "typeId",
        assetId: "assetId",
      };

      const expected = {
        sqlPath: `${service.sqlDir}/select-asset-log-file-path.sql`,
        placeHolder: [params.taskId, params.typeId, params.assetId],
      };

      postgresService.controlTransaction$ = jest.fn((a: any, fn: (c: any) => any) => fn(clientMock)) as any;
      clientMock.queryByFile$ = jest.fn(() => of({} as any));

      // act
      return service
        .getAssetLogFilePath$(params)
        .toPromise()
        .then(() => {
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(configService.postgresConfig(), expect.anything());
          expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder);
        })
        .catch(fail);
    });
  });

  describe(TasksService.prototype.getTasksStatus$.name, () => {
    let client: IClient;

    beforeEach(() => {
      client = {
        query$: jest.fn(),
        queryByFile$: jest.fn(),
        beginTrans$: jest.fn(),
        commit$: jest.fn(),
        rollback$: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    it("should return empty list", (done) => {
      // arrange
      const params: GetTaskStatusParams[] = [];

      // act
      service.getTasksStatus$(params).subscribe(
        (data) => {
          // assert
          expect(data).toEqual([]);
          done();
        },
        (err) => fail(err),
      );
    });

    it("should get client of postgres", () => {
      // arrange
      const params: GetTaskStatusParams[] = [{ taskId: "tata" }];

      jest.spyOn(postgresService, "getClient$").mockReturnValue(throwError({}));

      const expected = configService.postgresConfig();

      // act
      return (
        service
          .getTasksStatus$(params)
          .toPromise()
          // assert
          .then(() => fail("not expected here"))
          .catch(() => {
            expect(postgresService.getClient$).toHaveBeenCalledWith(expected);
          })
      );
    });

    it("should return error when any query failed", () => {
      // arrange
      const params: GetTaskStatusParams[] = [{ taskId: "tata1" }, { taskId: "tata2" }];
      const error = {};

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = ErrorCode.categorize(error);

      // act
      return (
        service
          .getTasksStatus$(params)
          .toPromise()
          // assert
          .then(() => fail("not expected here"))
          .catch((e) => {
            expect(e.code).toEqual(expected.code);
          })
      );
    });

    it("should return task status", () => {
      // arrange
      const params: GetTaskStatusParams[] = [{ taskId: "tata1" }, { taskId: "tata1" }];

      const response = {
        count: 2,
        records: [
          {
            taskId: "tata1",
            taskType: ETaskType.Reboot,
            status: ETaskStatus.Complete,
            taskAssets: [
              {
                typeId: "tyty",
                assetId: "asas",
                status: ETaskAssetStatus.Complete,
              },
            ],
          },
          {
            taskId: "tata1",
            taskType: ETaskType.Reboot,
            status: ETaskStatus.Complete,
            taskAssets: [
              {
                typeId: "tyty",
                assetId: "asas",
                status: ETaskAssetStatus.Complete,
              },
            ],
          },
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = [
        {
          taskId: "tata1",
          taskType: ETaskType.Reboot,
          status: ETaskStatus.Complete,
          taskAssets: [
            {
              typeId: "tyty",
              assetId: "asas",
              status: ETaskAssetStatus.Complete,
            },
          ],
        },
      ];

      // act
      return (
        service
          .getTasksStatus$(params)
          .toPromise()
          // assert
          .then((data: any[]) => {
            expected.forEach((v, i) => {
              expect(data[i]).toEqual(v);
            });
          })
          .catch(fail)
      );
    });
  });
});
