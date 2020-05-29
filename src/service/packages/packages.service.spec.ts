jest.mock("path");

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError, empty } from "rxjs";

import { PackagesService, externals } from "./packages.service";
import { PostgresService, IClient, IClientResponse } from "../postgres";
import { ConfigService } from "../config";
import { LoggerService } from "../logger";
import { PostgresConfig } from "../../environment/postgres";
import {
  InsertPackageParams,
  EPackageStatus,
  UpdateStatusParams,
  UpdatePackageParams,
  GetPackageParams,
  PackageRecord,
  GetPackageStatusParams,
} from "./packages.service.i";
import { BridgeXServerError, ErrorCode } from "../utils";

describe(PackagesService.name, () => {
  let service: PackagesService;
  let configService: ConfigService;
  let postgresService: PostgresService;
  let loggerService: LoggerService;
  let postgresClient: IClient;

  class PostgresClient implements IClient {
    public query$ = jest.fn(() => of(null) as any);
    public queryByFile$ = jest.fn(() => of(null) as any);
    public beginTrans$ = jest.fn(() => of(null) as any);
    public commit$ = jest.fn(() => of(null) as any);
    public rollback$ = jest.fn(() => of(null) as any);
    public disconnect = jest.fn();
  }

  class ConfigServiceMock {
    public appConfig = jest.fn();
    public postgresConfig = jest.fn(() => ({} as PostgresConfig));
  }

  class PostgresServiceMock {
    public logger = { trace: () => {} } as any;
    public getClient$ = jest.fn(() => of(postgresClient));
    public transactBySql$ = jest.fn(() => of(null));
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
        PackagesService,
        { provide: PostgresService, useClass: PostgresServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    postgresClient = new PostgresClient();
    service = module.get<PackagesService>(PackagesService);
    postgresService = module.get<PostgresService>(PostgresService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);

    jest.spyOn(externals, "readFileSync").mockReturnValue("");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(postgresService).toBeDefined();
    expect(configService).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(PackagesService.prototype.getPackageWithoutElements$.name, () => {
    it("should return get reocod when record count = 1", (done) => {
      // arrange
      const input = "idid";
      const records = {
        count: 1,
        records: [{}],
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = {
        sqlPath: `${service.sqlDir}/select-package-without-elements.sql`,
        placeHolder: ["idid"],
      };

      // act
      service.getPackageWithoutElements$(input).subscribe(
        (data) => {
          // assert
          expect(postgresClient.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder);
          expect(data).toBe(records.records[0]);
          done();
        },
        (err) => fail(err),
      );
    });

    it("should return error of NOT_FOUND when record count = 0", (done) => {
      // arrange
      const input = "idid";
      const records = {
        count: 0,
        records: [],
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = ErrorCode.categorize(new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified package is not found"));

      // act
      service.getPackageWithoutElements$(input).subscribe(
        () => fail(),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });

    it("should return error of INTERNAL when record count > 1", (done) => {
      // arrange
      const input = "idid";
      const records = {
        count: 2,
        records: [{}, {}],
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = ErrorCode.categorize(new BridgeXServerError(ErrorCode.INTERNAL, "The specified package isn't unique"));

      // act
      service.getPackageWithoutElements$(input).subscribe(
        () => fail(),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });
  });

  describe(PackagesService.prototype.getPackagesStatus$.name, () => {
    let client: IClient;
    beforeEach(async () => {
      client = postgresClient;
    });

    it("should return empty list", (done) => {
      // arrange
      const params: GetPackageStatusParams[] = [];

      // act
      service.getPackagesStatus$(params).subscribe(
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
      const params: GetPackageStatusParams[] = [{ packageId: "papa" }];

      postgresService.getClient$ = jest.fn(() => throwError({}));

      const expected = configService.postgresConfig();

      // act
      return (
        service
          .getPackagesStatus$(params)
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
      const params: GetPackageStatusParams[] = [{ packageId: "papa1" }, { packageId: "papa2" }];
      const error = {};

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => throwError({}));

      const expected = ErrorCode.categorize(error);

      // act
      return (
        service
          .getPackagesStatus$(params)
          .toPromise()
          // assert
          .then(() => fail("not expected here"))
          .catch((e) => {
            expect(e.code).toEqual(expected.code);
          })
      );
    });

    it("should query for all element of parameters", () => {
      // arrange
      const params: GetPackageStatusParams[] = [{ packageId: "papa1" }, { packageId: "papa2" }];

      const response = {
        count: 0,
        records: [],
      };

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => of(response));

      const expected = {
        sqlPath: `${service.sqlDir}/select-packages-status.sql`,
        elems: params.map((v) => Object.values(v)),
      };

      // act
      return (
        service
          .getPackagesStatus$(params)
          .toPromise()
          // assert
          .then(() => {
            expect(client.queryByFile$).toHaveBeenCalledTimes(expected.elems.length);
            expected.elems.forEach((elem) => {
              expect(client.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, elem);
            });
          })
          .catch(fail)
      );
    });

    it("should return Failure status when package can't be found", () => {
      // arrange
      const params: GetPackageStatusParams[] = [{ packageId: "papa1" }, { packageId: "papa2" }];

      const response = {
        count: 0,
        records: [],
      };

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => of(response));

      const expected = [
        {
          packageId: "papa1",
          status: EPackageStatus.Failure,
        },
        {
          packageId: "papa2",
          status: EPackageStatus.Failure,
        },
      ];

      // act
      return (
        service
          .getPackagesStatus$(params)
          .toPromise()
          // assert
          .then((data) => {
            expect(data).toEqual(expected);
          })
          .catch(fail)
      );
    });

    it("should return package status", () => {
      // arrange
      const params: GetPackageStatusParams[] = [{ packageId: "papa1" }, { packageId: "papa1" }];

      const response = {
        count: 2,
        records: [
          {
            packageId: "papa1",
            status: EPackageStatus.Complete,
          },
          {
            packageId: "papa1",
            status: EPackageStatus.Complete,
          },
        ],
      };

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => of(response as any));

      const expected = [
        {
          packageId: "papa1",
          status: EPackageStatus.Complete,
        },
      ];

      // act
      return (
        service
          .getPackagesStatus$(params)
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

  describe(PackagesService.prototype.insertPackage$.name, () => {
    let params: InsertPackageParams;

    beforeEach(() => {
      params = {
        packageId: "papa",
        name: "nana",
        status: EPackageStatus.Uploading,
        comment: "coco",
        uploadBy: "upup",
        summary: "susu",
        description: "dede",
        model: "momo",
        memo: "meme",
        bucketName: "bubu",
        objectName: "obob",
        ftpFilePath: "ftft",
      };
    });

    it("should call queryByFile with correct sqlPath and placeHolder", () => {
      const sqlPath = `${service.sqlDir}/insert-package.sql`;
      const placeHolder = [
        params.packageId,
        params.name,
        params.status,
        params.comment,
        params.uploadBy,
        params.summary,
        params.description,
        params.model,
        params.memo,
        params.bucketName,
        params.objectName,
        params.ftpFilePath,
      ];

      service.insertPackage$(params).subscribe(
        () => {
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(postgresClient.queryByFile$).toHaveBeenCalledWith(sqlPath, placeHolder);
        },
        () => fail("test failed"),
      );
    });
  });

  describe(PackagesService.prototype.updateStatus$.name, () => {
    let params: UpdateStatusParams;

    beforeEach(() => {
      params = {
        packageId: "papa",
        status: EPackageStatus.Uploading,
      };
    });

    it("should call queryByFile with correct sqlPath and placeHolder", () => {
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(empty());

      const sqlPath = `${service.sqlDir}/update-package.sql`;
      const placeHolder = [params.packageId, params.status, null];

      service.updateStatus$(params).subscribe(
        () => {
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(postgresClient.queryByFile$).toHaveBeenCalledWith(sqlPath, placeHolder);
        },
        () => fail("test error"),
      );
    });

    it("should return null when records.count === 1", () => {
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of({ count: 1 } as any));
      const expected = null;

      service.updateStatus$(params).subscribe(
        (data) => {
          expect(data).toEqual(expected);
        },
        () => fail("test error"),
      );
    });

    it("should return 404 when records.count === 0", () => {
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of({ count: 0 } as any));
      const expected = { code: 404 };

      service.updateStatus$(params).subscribe(
        () => fail("test error"),
        (e: BridgeXServerError) => {
          expect(e.code).toEqual(expected.code);
        },
      );
    });

    it("should return 404 when records.count === 0", () => {
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of({ count: 2 } as any));
      const expected = { code: 500 };

      service.updateStatus$(params).subscribe(
        () => fail("test error"),
        (e: BridgeXServerError) => {
          expect(e.code).toEqual(expected.code);
        },
      );
    });
  });

  describe(PackagesService.prototype.updatePackage$.name, () => {
    let params: UpdatePackageParams;

    beforeEach(() => {
      params = {
        packageId: "papa",
        memo: "meme",
      };
    });

    it("should call queryByFile with correct sqlPath and placeHolder", () => {
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(empty());
      const sqlPath = `${service.sqlDir}/update-package.sql`;
      const placeHolder = [params.packageId, null, params.memo];

      service.updatePackage$(params).subscribe(
        () => {
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(postgresClient.queryByFile$).toHaveBeenCalledWith(sqlPath, placeHolder);
        },
        () => fail("test error"),
      );
    });

    it("should return null when records.count === 1", () => {
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of({ count: 1 } as any));
      const expected = null;

      service.updatePackage$(params).subscribe(
        (data) => {
          expect(data).toEqual(expected);
        },
        () => fail("test error"),
      );
    });

    it("should return 404 when records.count === 0", () => {
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of({ count: 0 } as any));
      const expected = { code: 404 };

      service.updatePackage$(params).subscribe(
        () => fail("test error"),
        (e: BridgeXServerError) => {
          expect(e.code).toEqual(expected.code);
        },
      );
    });

    it("should return 404 when records.count === 2", () => {
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of({ count: 2 } as any));
      const expected = { code: 500 };

      service.updatePackage$(params).subscribe(
        () => fail("test error"),
        (e: BridgeXServerError) => {
          expect(e.code).toEqual(expected.code);
        },
      );
    });
  });

  describe(PackagesService.prototype.get$.name, () => {
    it("should execute select package", (done) => {
      // arrange
      const params: GetPackageParams = {
        limit: "10",
        offset: "20",
        status: EPackageStatus.Complete,
        text: "%model%",
        sortName: "name",
        sort: "desc",
      };

      const response: IClientResponse<PackageRecord> = {
        count: 3,
        records: [
          {
            packageId: "p1",
          } as any,
          {
            packageId: "p2",
          } as any,
          {
            packageId: "p3",
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-package.sql`,
            placeHolder: [params.limit, params.offset, params.status, params.text, `${params.sortName} ${params.sort}`],
          },
        },
      };

      // act
      service.get$(params).subscribe(
        () => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalled();
          expect(postgresClient.queryByFile$).toHaveBeenCalledTimes(1);
          expect(postgresClient.queryByFile$).toHaveBeenNthCalledWith(
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

    it("should throw Error(500) when sql error. ", (done) => {
      // arrange
      const params: GetPackageParams = {
        limit: "10",
        offset: "20",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

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

  describe(PackagesService.prototype.getMany$.name, () => {
    it("should return empty array immediately if params is empty array", () => {
      // arrange
      const params: string[] = [];
      const expected: string[] = [];

      // act & assert
      return service
        .getMany$(params)
        .toPromise()
        .then((actual) => expect(actual).toEqual(expected))
        .catch(fail)
        .finally(() => expect(externals.readFileSync).not.toHaveBeenCalled());
    });

    it("should call client.query$ with expected sql params", () => {
      // arrange
      const params: string[] = ["id 1", "id 2"];
      const tmp = 'SELECT package_id AS "id", name AS "name" FROM packages WHERE ${WHERE_PLACEHOLDER};';
      const sql = 'SELECT package_id AS "id", name AS "name" FROM packages WHERE packages.package_id = $1 OR packages.package_id = $2;';
      const expected = [sql, params];

      jest.spyOn(externals, "readFileSync").mockReturnValue(tmp);
      jest.spyOn(postgresClient, "query$").mockReturnValue(empty());

      // act & assert
      return service
        .getMany$(params)
        .toPromise()
        .then(() => expect(postgresClient.query$).toHaveBeenCalledWith(...expected))
        .catch(fail);
    });

    it("should return expected data", () => {
      // arrange
      const params: string[] = ["id 1", "id 2"];
      const response = {
        count: 2,
        records: [
          { id: "id 1", name: "name 1" },
          { id: "id 2", name: "name 2" },
        ],
      };
      const expected = [...response.records];

      jest.spyOn(postgresClient, "query$").mockReturnValue(of(response as any));

      // act & assert
      return service
        .getMany$(params)
        .toPromise()
        .then((actual) => expect(actual).toEqual(expected))
        .catch(fail);
    });

    it("should throw error", () => {
      // arrange
      const params: string[] = ["id 1", "id 2"];
      const err = new Error("error des");
      const expected = new BridgeXServerError(ErrorCode.INTERNAL, expect.any(String), err);

      jest.spyOn(postgresClient, "query$").mockReturnValue(throwError(err));

      // act & assert
      return service
        .getMany$(params)
        .toPromise()
        .then(fail)
        .catch((actual) => expect(actual).toEqual(expected));
    });
  });

  describe(PackagesService.prototype.updataMetadata$.name, () => {
    it("should call queryByFile with correct sqlPath and placeHolder", (done) => {
      // arrange
      const input = {
        packageId: "idid",
        status: "stst",
        summary: "susu",
        description: "dede",
        model: "momo",
        ftpFilePath: "ftft",
        deleteFlag: false,
        elements: [
          { key: "ke01", value: "va01" },
          { key: "ke02", value: "va02" },
          { key: "ke03", value: "va03" },
        ],
      };
      const records = {
        count: 1,
        records: [{}],
      };
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = [
        { sqlPath: `${service.sqlDir}/update-package.sql`, placeHolder: ["idid", "stst", "susu", "dede", "momo", null, "ftft", false] },
        { sqlPath: `${service.sqlDir}/insert-package-elements.sql`, placeHolder: ["idid", "ke01", "va01"] },
        { sqlPath: `${service.sqlDir}/insert-package-elements.sql`, placeHolder: ["idid", "ke02", "va02"] },
        { sqlPath: `${service.sqlDir}/insert-package-elements.sql`, placeHolder: ["idid", "ke03", "va03"] },
      ];

      // act
      service.updataMetadata$(input).subscribe(
        (data) => {
          // assert
          expect(postgresClient.queryByFile$).toHaveBeenNthCalledWith(1, expected[0].sqlPath, expected[0].placeHolder);
          expect(postgresClient.queryByFile$).toHaveBeenNthCalledWith(2, expected[1].sqlPath, expected[1].placeHolder);
          expect(postgresClient.queryByFile$).toHaveBeenNthCalledWith(3, expected[2].sqlPath, expected[2].placeHolder);
          expect(postgresClient.queryByFile$).toHaveBeenNthCalledWith(4, expected[3].sqlPath, expected[3].placeHolder);
          expect(data).toEqual(null);
          done();
        },
        (err) => fail(err),
      );
    });

    it("should return error NOT_FOUND when update count = 0", (done) => {
      // arrange
      const input = {
        packageId: "idid",
        status: "stst",
        summary: "susu",
        description: "dede",
        model: "momo",
        ftpFilePath: "ftft",
        elements: [
          { key: "ke01", value: "va01" },
          { key: "ke02", value: "va02" },
          { key: "ke03", value: "va03" },
        ],
      };
      const records = {
        count: 0,
        records: [],
      };
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = ErrorCode.categorize(new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified package is not found"));

      // act
      service.updataMetadata$(input).subscribe(
        () => fail(),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });

    it("should return error INTERNAL when update count > 1", (done) => {
      // arrange
      const input = {
        packageId: "idid",
        status: "stst",
        summary: "susu",
        description: "dede",
        model: "momo",
        ftpFilePath: "ftft",
        elements: [
          { key: "ke01", value: "va01" },
          { key: "ke02", value: "va02" },
          { key: "ke03", value: "va03" },
        ],
      };
      const records = {
        count: 2,
        records: [{}, {}],
      };
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = ErrorCode.categorize(new BridgeXServerError(ErrorCode.INTERNAL, "The specified package is a duplicate"));

      // act
      service.updataMetadata$(input).subscribe(
        () => fail(),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });
  });

  describe(PackagesService.prototype.deletePackage$.name, () => {
    it("should call queryByFile with correct sqlPath and placeHolder", (done) => {
      // arrange
      const arg = "idid";
      const deleteFlag = true;
      const records = {
        count: 1,
        records: [{}],
      };
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const sqlPath = `${service.sqlDir}/update-package.sql`;
      const placeHolder = [
        arg,
        null, // status
        null, // summary,
        null, // description,
        null, // model,
        null, // memo,
        null, // ftpFilePath,
        deleteFlag,
      ];

      // act
      service.deletePackage$(arg).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(postgresClient.queryByFile$).toHaveBeenCalledWith(sqlPath, placeHolder);
          done();
        },
        (err) => fail(err),
      );
    });

    it("should return null when records.count === 1", (done) => {
      // arrange
      const arg = "idid";
      const records = {
        count: 1,
        records: [{}],
      };
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = null;

      // act
      service.deletePackage$(arg).subscribe(
        // assert
        (data) => {
          expect(data).toEqual(expected);
          done();
        },
        () => fail("test error"),
      );
    });

    it("should return NOT_FOUNT when records.count = 0", (done) => {
      // arrange
      const arg = "idid";
      const records = {
        count: 0,
        records: [{}],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = ErrorCode.categorize(new BridgeXServerError(ErrorCode.NOT_FOUND, "The specified package is not found"));

      // act
      service.deletePackage$(arg).subscribe(
        // assert
        () => fail("test error"),
        (err) => {
          expect(err).toEqual(expected);
          done();
        },
      );
    });

    it("should return INTERNAL when records.count > 1", (done) => {
      // arrange
      const arg = "idid";
      const records = {
        count: 2,
        records: [{}, {}],
      };

      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(postgresClient));
      jest.spyOn(postgresClient, "queryByFile$").mockReturnValue(of(records));

      const expected = ErrorCode.categorize(new BridgeXServerError(ErrorCode.INTERNAL, "The specified package is a duplicate"));

      // act
      service.deletePackage$(arg).subscribe(
        // assert
        () => fail("test error"),
        (err) => {
          expect(err).toEqual(expected);
          done();
        },
      );
    });
  });
});
