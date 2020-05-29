jest.mock("fs").mock("yaml");

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { EEventSourceFilter, EventParams, EImportance, ETaskType } from "./event-list.service.i";
import { EventListService, fs, yaml } from "./event-list.service";
import { GuardEventListService } from "./event-list.service.guard";
import { PostgresService } from "../postgres/postgres.service";
import { IClientResponse, IClient } from "../postgres/postgres.service.i";
import { ConfigService } from "../config";
import { PostgresConfig } from "../../environment/postgres";
import { LoggerService } from "../logger/logger.service";
import { BridgeXServerError, ErrorCode } from "../utils";
import { PostgresError } from "../postgres/client";

describe("EventListService", () => {
  let service: EventListService;
  let guard: GuardEventListService;
  let postgresService: PostgresService;
  let configService: ConfigService;
  let loggerService: LoggerService;

  const clientMock: IClient = {
    query$: jest.fn(() => of({} as IClientResponse<any>)),
    queryByFile$: jest.fn(() => of({} as IClientResponse<any>)),
    beginTrans$: jest.fn(() => of()),
    commit$: jest.fn(() => of()),
    rollback$: jest.fn(() => of()),
    disconnect: jest.fn(() => null),
  };

  class GuardEventListServiceMock {
    public isImportanceMap = jest.fn(() => true);
    public isSubjectMap = jest.fn(() => true);
    public isEventListItemRecords = jest.fn(() => true);
  }

  class ConfigServiceMock {
    public appConfig = jest.fn();
    public postgresConfig = jest.fn(() => ({} as PostgresConfig));
  }

  class PostgresServiceMock {
    public logger = { trace: () => {} } as any;
    public getClient$ = jest.fn(() => of(clientMock));
    public transactBySql$ = jest.fn(() => of(null));
    public controlTransaction$ = jest.fn((a, b) => b);
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  const importanceMap = {
    event: {
      connected: "information",
      disconnected: "information",
      established: "information",
      assetStatusError: "error",
      firmwareUpdated: "information",
    },
    task: {
      deployments: {
        create: "information",
        execute: "information",
        success: "information",
        fail: "error",
      },
      logs: {
        create: "information",
        execute: "information",
        success: "information",
        fail: "error",
      },
    },
  };

  const subjectMap = {
    event: {
      connected: "Device ${assetId} / ${typeId} : Connected ( IP Address : ${ipAddress} )",
      disconnected: "Device ${assetId} / ${typeId} : Disconnected",
      established: "Device ${assetId} / ${typeId} : Established versions：${versions}",
      assetStatusError: "Device ${assetId} / ${typeId} : Error : ${errorCode} ( ${errorMessage} )",
      firmwareUpdated: "Device ${assetId} / ${typeId} : Firmware updated ${packageList}",
    },
    task: {
      deployments: {
        create: "Create Task ( Download : ${packageName} )",
        execute: "Start Task ( Download : ${packageName} )",
        success: "Success Task ( Download : ${packageName} )",
        fail: "Fail Task ( Download : ${packageName} ) Error : ${errorResult}",
      },
      logs: {
        create: "Create Task ( Retrieve Log : ${logType} )",
        execute: "Start Task ( Retrieve Log : ${logType} )",
        success: "Success Task ( Retrieve Log : ${logType} )",
        fail: "Fail Task ( Retrieve Log : ${logType} ) Error : ${errorResult}",
      },
    },
  };

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.spyOn(yaml, "parse").mockReturnValueOnce(importanceMap);
    jest.spyOn(yaml, "parse").mockReturnValueOnce(subjectMap);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventListService,
        { provide: GuardEventListService, useClass: GuardEventListServiceMock },
        { provide: PostgresService, useClass: PostgresServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(EventListService);
    guard = module.get(GuardEventListService);
    postgresService = module.get(PostgresService);
    configService = module.get(ConfigService);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(guard).toBeDefined();
    expect(postgresService).toBeDefined();
    expect(configService).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe("readYamlFile", () => {
    it("should load yaml-file and return read-data", () => {
      // arrange
      (fs.readFileSync as jest.Mock).mockReturnValue("tete");
      const readData = {};
      yaml.parse = jest.fn(() => readData);

      // act
      const actual = service.readYamlFile("fifi");

      // assert
      expect(fs.readFileSync).toBeCalledWith("fifi", "utf8");
      expect(yaml.parse).toBeCalledWith("tete");
      expect(actual).toBe(readData);
    });

    it("should throw error when failed to read yaml", () => {
      // arrange
      (fs.readFileSync as jest.Mock).mockReturnValue("tete");
      const error = new Error("test error");
      yaml.parse = jest.fn(() => {
        throw error;
      });

      // act
      let actual = null;
      try {
        service.readYamlFile("fifi");
      } catch (e) {
        actual = e;
      }

      // assert
      expect(fs.readFileSync).toBeCalledWith("fifi", "utf8");
      expect(yaml.parse).toBeCalledWith("tete");
      expect(actual).toBe(error);
    });
  });

  describe("getImportanceMap", () => {
    it("should return importanceMap", () => {
      // arrange
      const yamlPath = "yamlPath";
      const readData = {};

      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData);
      jest.spyOn(guard, "isImportanceMap").mockReturnValueOnce(true);
      const expected = {};

      // act
      const actual = service.getImportanceMap(yamlPath);

      // assert
      expect(service.readYamlFile).toHaveBeenCalledWith("yamlPath");
      expect(guard.isImportanceMap).toHaveBeenCalledWith(readData);
      expect(actual).toEqual(expected);
    });

    it("should throw error when type error", () => {
      // arrange
      const yamlPath = "yamlPath";
      const readData = {};

      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData);
      jest.spyOn(guard, "isImportanceMap").mockReturnValueOnce(false);
      const expected = new Error(`Invalid importance-map filePath=yamlPath`);

      // act
      let actual = null;
      try {
        service.getImportanceMap(yamlPath);
      } catch (e) {
        actual = e;
      }

      // assert
      expect(service.readYamlFile).toHaveBeenCalledWith("yamlPath");
      expect(guard.isImportanceMap).toHaveBeenCalledWith(readData);
      expect(actual).toEqual(expected);
    });
  });

  describe("getSubjectMap", () => {
    it("should return importanceMap", () => {
      // arrange
      const yamlPath = "yamlPath";
      const readData = {};

      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData);
      jest.spyOn(guard, "isSubjectMap").mockReturnValueOnce(true);
      const expected = {};

      // act
      const actual = service.getSubjectMap(yamlPath);

      // assert
      expect(service.readYamlFile).toHaveBeenCalledWith("yamlPath");
      expect(guard.isSubjectMap).toHaveBeenCalledWith(readData);
      expect(actual).toEqual(expected);
    });

    it("should throw error when type error", () => {
      // arrange
      const yamlPath = "yamlPath";
      const readData = {};

      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData);
      jest.spyOn(guard, "isSubjectMap").mockReturnValueOnce(false);
      const expected = new Error(`Invalid subject-map filePath=yamlPath`);

      // act
      let actual = null;
      try {
        service.getSubjectMap(yamlPath);
      } catch (e) {
        actual = e;
      }

      // assert
      expect(service.readYamlFile).toHaveBeenCalledWith("yamlPath");
      expect(guard.isSubjectMap).toHaveBeenCalledWith(readData);
      expect(actual).toEqual(expected);
    });
  });

  describe("getEventList$", () => {
    it("should call queryByFile$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          filter: {
            text: "tete",
            eventSource: EEventSourceFilter.All,
          },
          limit: 123,
          offset: 456,
        },
        postgresConfig: {} as PostgresConfig,
        records: {
          count: 3,
          records: [
            { date: "da-01", eventSource: "ev-01", subject: "su-01", importance: "im-01", totalCount: "789" },
            { date: "da-02", eventSource: "ev-02", subject: "su-02", importance: "im-02", totalCount: "789" },
            { date: "da-03", eventSource: "ev-03", subject: "su-03", importance: "im-03", totalCount: "789" },
          ],
        },
      };
      jest.spyOn(configService, "postgresConfig").mockReturnValue(input.postgresConfig);
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(input.records));
      jest.spyOn(guard, "isEventListItemRecords").mockReturnValue(true);

      const expected = {
        getClient: input.postgresConfig,
        queryByFile: {
          sqlPath: `${service.sqlDir}/select-event-list.sql`,
          placeHolder: ["tyty", "asas", "tete", "all", 123, 456],
        },
        isEventListItemRecords: input.records.records,
        returnData: {
          totalCount: 789,
          items: [
            { date: "da-01", eventSource: "ev-01", subject: "su-01", importance: "im-01" },
            { date: "da-02", eventSource: "ev-02", subject: "su-02", importance: "im-02" },
            { date: "da-03", eventSource: "ev-03", subject: "su-03", importance: "im-03" },
          ],
        },
      };
      // act
      return service
        .getEventList$(input.params)
        .toPromise()
        .then((actual) => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalledWith(expected.getClient);
          expect(clientMock.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath, expected.queryByFile.placeHolder);
          expect(guard.isEventListItemRecords).toHaveBeenCalledWith(expected.isEventListItemRecords);
          expect(actual).toEqual(expected.returnData);
        })
        .catch((e) => fail(e));
    });

    it("should return empty array when records is nothing", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          filter: {
            text: "tete",
            eventSource: EEventSourceFilter.All,
          },
          limit: 123,
          offset: 456,
        },
        postgresConfig: {} as PostgresConfig,
        records: { count: 0, records: [] },
      };
      jest.spyOn(configService, "postgresConfig").mockReturnValue(input.postgresConfig);
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(input.records));
      jest.spyOn(guard, "isEventListItemRecords").mockReturnValue(true);

      const expected = {
        returnData: {
          totalCount: 0,
          items: [],
        },
      };
      // act
      return service
        .getEventList$(input.params)
        .toPromise()
        .then((actual) => {
          // assert
          expect(actual).toEqual(expected.returnData);
        })
        .catch((e) => fail(e));
    });

    it("should throw BridgeXServerError when happening exception error", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          filter: {
            text: "tete",
            eventSource: EEventSourceFilter.All,
          },
          limit: 123,
          offset: 456,
        },
        postgresConfig: {} as PostgresConfig,
        records: {
          count: 0,
          records: [],
        },
      };
      jest.spyOn(configService, "postgresConfig").mockReturnValue(input.postgresConfig);
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(input.records));
      jest.spyOn(guard, "isEventListItemRecords").mockReturnValue(false);

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
      // act
      return service
        .getEventList$(input.params)
        .toPromise()
        .then((actual) => fail(actual))
        .catch((e) => {
          expect(e.code).toEqual(expected.code);
          expect(e.message).toEqual(expected.message);
        });
    });

    it("should throw BridgeXServerError when type error", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          filter: {
            text: "tete",
            eventSource: EEventSourceFilter.All,
          },
          limit: 123,
          offset: 456,
        },
        postgresConfig: {} as PostgresConfig,
        error: new PostgresError(123, "test error"),
      };
      jest.spyOn(configService, "postgresConfig").mockReturnValue(input.postgresConfig);
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => throwError(input.error));
      jest.spyOn(guard, "isEventListItemRecords").mockReturnValue(false);

      const expected = ErrorCode.categorize(input.error);
      // act
      return service
        .getEventList$(input.params)
        .toPromise()
        .then((actual) => fail(actual))
        .catch((e) => {
          expect(e.code).toEqual(expected.code);
          expect(e.message).toEqual(expected.message);
        });
    });
  });

  describe("replaceSubject", () => {
    it("should return importanceMap", () => {
      // arrange
      const input = {
        subject: "susu-${typeId}-${assetId}-${abc}-${def}-${ghi}-${jkl}-${mno}-susu",
        params: {
          typeId: "tyty",
          assetId: "asas",
          abc: "X Y Z",
          def: undefined,
          ghi: { hoge: "hogehoge" },
          jkl: ["a1", "b2", "c3"],
          mno: true,
        } as EventParams,
      };
      const expected = 'susu-tyty-asas-X Y Z--{"hoge":"hogehoge"}-["a1","b2","c3"]--susu';

      // act
      const actual = service.replaceSubject(input.subject, input.params);

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe("insertAssetEvent$", () => {
    it("should call transactBySql$ with parameter", () => {
      // arrange
      const input = {
        importance: EImportance.Information,
        subject: "susu",
        params: {
          typeId: "tyty",
          assetId: "asas",
        },
        postgresConfig: {} as PostgresConfig,
      };
      jest.spyOn(service, "replaceSubject").mockReturnValue("replace susu");
      jest.spyOn(configService, "postgresConfig").mockReturnValue(input.postgresConfig);
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(postgresService, "transactBySql$").mockImplementation(() => of(null));

      const expected = {
        postgresConfig: input.postgresConfig,
        transactBySql: {
          client: clientMock,
          sqlPath: `${service.sqlDir}/insert-event-list-asset.sql`,
          placeHolder: ["tyty", "asas", "replace susu", EImportance.Information],
        },
      };
      // act
      return service
        .insertAssetEvent$(input.importance, input.subject, input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(expected.postgresConfig, expect.anything());
          expect(postgresService.transactBySql$).toHaveBeenCalledWith(
            expected.transactBySql.client,
            expected.transactBySql.sqlPath,
            expected.transactBySql.placeHolder,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("insertBridgeTask$", () => {
    it("should call transactBySql$ with parameter", () => {
      // arrange
      const input = {
        importance: EImportance.Information,
        subject: "susu",
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
        },
        postgresConfig: {} as PostgresConfig,
      };
      jest.spyOn(service, "replaceSubject").mockReturnValue("replace susu");
      jest.spyOn(configService, "postgresConfig").mockReturnValue(input.postgresConfig);
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(postgresService, "transactBySql$").mockImplementation(() => of(null));

      const expected = {
        postgresConfig: input.postgresConfig,
        transactBySql: {
          client: clientMock,
          sqlPath: `${service.sqlDir}/insert-event-list-bridge.sql`,
          placeHolder: ["tyty", "asas", "tata", ETaskType.DownloadPackage, "replace susu", EImportance.Information],
        },
      };
      // act
      return service
        .insertBridgeTask$(input.importance, input.subject, input.params, ETaskType.DownloadPackage)
        .toPromise()
        .then(() => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(expected.postgresConfig, expect.anything());
          expect(postgresService.transactBySql$).toHaveBeenCalledWith(
            expected.transactBySql.client,
            expected.transactBySql.sqlPath,
            expected.transactBySql.placeHolder,
          );
        })
        .catch((e) => fail(e));
    });
  });
});
