jest.mock("fs");

import { Test, TestingModule } from "@nestjs/testing";

import { HttpClientService } from "../http-client";
import { LoggerService } from "../logger/logger.service";
import { PostgresService } from "../postgres/postgres.service";
import { IClientResponse, IClient } from "../postgres/postgres.service.i";
import { ConfigService } from "../config";
import { PostgresConfig } from "../../environment/postgres";

import { AssetVersionsService, VersionsConverter } from "./asset-versions.service";
import { of, throwError } from "rxjs";
import { GConnectConfig } from "../../environment/g-connect";
import { GetParams, AssetVersionRecord, PostParams } from "./asset-versions.service.i";
import { ErrorCode, BridgeXServerError } from "../utils";
import { GuardAssetVersionsResponse } from "./asset-versions.service.guard";

describe("AssetStatusService", () => {
  let service: AssetVersionsService;
  let httpClientService: HttpClientService;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let postgresService: PostgresService;
  let guard: GuardAssetVersionsResponse;

  class HttpClientServiceMock {
    public get$ = jest.fn(() => of());
    public post$ = jest.fn(() => of());
  }
  const clientMock: IClient = {
    query$: jest.fn(() => of(null)),
    queryByFile$: jest.fn(() => of(null)),
    beginTrans$: jest.fn(() => of(null)),
    commit$: jest.fn(() => of(null)),
    rollback$: jest.fn(() => of(null)),
    disconnect: jest.fn(() => null),
  };

  class ConfigServiceMock {
    public appConfig = jest.fn();
    public postgresConfig = jest.fn(() => ({} as PostgresConfig));
    public gConnectConfig = jest.fn();
  }

  class PostgresServiceMock {
    public logger = { trace: () => {} } as any;
    public getClient$ = jest.fn(() => of(clientMock));
    public transactBySql$ = jest.fn(() => of(null));
    public controlTransaction$ = jest.fn(PostgresService.prototype.controlTransaction$);
  }

  class LoggerServiceMock {
    public info = jest.fn();
    public error = jest.fn();
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetVersionsService,
        GuardAssetVersionsResponse,
        { provide: PostgresService, useClass: PostgresServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(AssetVersionsService);
    postgresService = module.get<PostgresService>(PostgresService);
    httpClientService = module.get(HttpClientService);
    loggerService = module.get(LoggerService);
    configService = module.get(ConfigService);
    guard = module.get(GuardAssetVersionsResponse);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(postgresService).toBeDefined();
    expect(httpClientService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe(AssetVersionsService.prototype.get$.name, () => {
    let params: GetParams;
    let client: IClient;

    beforeEach(() => {
      params = {
        typeId: "tyty",
        assetId: "asas",
      };
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
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of());
      jest.spyOn(client, "disconnect").mockReturnValue();

      const expected = {
        sqlPath: `${service.sqlDir}/select-asset-versions.sql`,
        placeHolder: ["tyty", "asas"],
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

    it("should return invalid data error when records failed to match guard schema", (done) => {
      // arrange
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
      jest.spyOn(guard, "isGetAssetVersionsResponse").mockReturnValue(false);

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

    it("should return 404 when no records", (done) => {
      // arrange
      const response: IClientResponse<AssetVersionRecord> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));
      jest.spyOn(guard, "isGetAssetVersionsResponse").mockReturnValue(true);

      const expected = new BridgeXServerError(ErrorCode.NOT_FOUND, "");

      // act
      service.get$(params).subscribe(
        () => fail("Not expected here"),
        (err) => {
          // assert
          expect(err.code).toEqual(expected.code);
          done();
        },
      );
    });

    it("should call VersionsConverter.convertToRecursive with sub asset", (done) => {
      // arrange
      const response = {
        count: 2,
        records: [
          {
            typeId: "tyty",
            assetId: "asas",
            subpartName: "nana",
            subpartVersion: "1.0.0",
          },
          {
            typeId: "aaaa",
            assetId: "zzz",
            subpartName: "bbbb",
            subpartVersion: "1.0.0",
          },
        ],
      };

      const expected = [
        {
          typeId: "aaaa",
          assetId: "zzz",
          subpartName: "bbbb",
          subpartVersion: "1.0.0",
        },
      ];

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));
      jest.spyOn(guard, "isGetAssetVersionsResponse").mockReturnValue(true);
      jest.spyOn(VersionsConverter.prototype, "convertToAssetVersion").mockReturnValue([] as any[]);

      // act
      service.get$(params).subscribe(
        () => {
          // assert
          expect(VersionsConverter.prototype.convertToAssetVersion).toHaveBeenCalledWith(expected);
          done();
        },
        (e) => fail(e),
      );
    });

    it("should throw error", (done) => {
      // arrange
      const getError = new Error("error");
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(getError));
      const categorizedError = new BridgeXServerError(ErrorCode.INTERNAL, "test error", getError);
      jest.spyOn(ErrorCode, "categorize").mockReturnValue(categorizedError);
      const expected = categorizedError;

      // act
      service.get$(params).subscribe(
        () => {
          fail();
        },
        (err) => {
          // assert
          expect(ErrorCode.categorize).toHaveBeenCalledWith(getError), expect(err).toBe(expected);
          done();
        },
      );
    });
  });

  describe("post$", () => {
    it("should call httpClient post$() with URL and subparts", (done) => {
      // arrange
      const input: PostParams = {
        typeId: "tyty",
        assetId: "asas",
        subparts: [
          { subpartId: "id01", subpartVersion: "ve01" },
          { subpartId: "id02", subpartVersion: "ve02" },
          { subpartId: "id03", subpartVersion: "ve03" },
        ],
      };
      jest.spyOn(configService, "gConnectConfig").mockReturnValue({ dasBaseUrl: "dada" } as GConnectConfig);
      jest.spyOn(httpClientService, "post$").mockReturnValue(of(null));
      const expected = {
        url: "dada/types/tyty/assets/asas/subparts",
        data: input.subparts,
        config: {},
      };

      // act
      service.post$(input).subscribe(
        () => {
          // assert
          expect(httpClientService.post$).toHaveBeenCalledWith(expected.url, expected.data, expected.config);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return error when httpClient post$() returns error", (done) => {
      // arrange
      const input: PostParams = {
        typeId: "tyty",
        assetId: "asas",
        subparts: [],
      };
      jest.spyOn(configService, "gConnectConfig").mockReturnValue({ dasBaseUrl: "dada" } as GConnectConfig);
      const postError = new Error("error");
      jest.spyOn(httpClientService, "post$").mockReturnValue(throwError(postError));
      const categorizedError = new BridgeXServerError(ErrorCode.INTERNAL, "test error", postError);
      jest.spyOn(ErrorCode, "categorize").mockReturnValue(categorizedError);
      const expected = categorizedError;

      // act
      service.post$(input).subscribe(
        () => {
          fail();
        },
        (err) => {
          // assert
          expect(httpClientService.post$).toHaveBeenCalled();
          expect(ErrorCode.categorize).toHaveBeenCalledWith(postError), expect(err).toBe(expected);
          done();
        },
      );
    });
  });

  describe(VersionsConverter.name, () => {
    let converter: VersionsConverter;
    beforeEach(() => {
      converter = new VersionsConverter();
    });

    describe(VersionsConverter.prototype.convertToAssetVersion.name, () => {
      it("should convert records to AssetVersion array", () => {
        // arrange
        const input = [
          {
            assetId: "1234",
            typeId: "foo",
            subpartName: "abc",
            subpartVersion: "0.0.2",
          },
          {
            assetId: "1234",
            typeId: "foo",
            subpartName: "xyz",
            subpartVersion: "000.000",
          },
          {
            assetId: "5678",
            typeId: "hoo",
            subpartName: "abc",
            subpartVersion: "0.0.0",
          },
        ];

        const expected = [
          {
            assetId: "1234",
            typeId: "foo",
            versions: [
              {
                name: "abc",
                version: "0.0.2",
              },
              {
                name: "xyz",
                version: "000.000",
              },
            ],
          },
          {
            assetId: "5678",
            typeId: "hoo",
            versions: [
              {
                name: "abc",
                version: "0.0.0",
              },
            ],
          },
        ];

        // act
        const actual = converter.convertToAssetVersion(input);

        // asst
        expect(actual).toEqual(expected);
      });
    });

    describe(VersionsConverter.prototype.convertToUniqueAsset.name, () => {
      it("should return converted assets identification ", () => {
        // arrange
        const params: AssetVersionRecord[] = [
          {
            assetId: "1234",
            typeId: "foo",
            subpartName: "xyz",
            subpartVersion: "1.0.0",
          },
          {
            assetId: "1234",
            typeId: "foo",
            subpartName: "xyz11",
            subpartVersion: "1.0.0..11",
          },
        ];

        const expected = [{ assetId: "1234", typeId: "foo" }];

        // act
        const actual = converter.convertToUniqueAsset(params);

        // assert
        expect(actual).toEqual(expected);
      });

      it("should return converted assets identification ", () => {
        // arrange
        const params: AssetVersionRecord[] = [
          {
            assetId: "1234",
            typeId: "foo",
            subpartName: "xyz",
            subpartVersion: "1.0.0",
          },
          {
            assetId: "5678",
            typeId: "hoo",
            subpartName: "xyz11",
            subpartVersion: "1.0.0..11",
          },
        ];

        const expected = [
          { assetId: "1234", typeId: "foo" },
          { assetId: "5678", typeId: "hoo" },
        ];

        // act
        const actual = converter.convertToUniqueAsset(params);

        // assert
        expect(actual).toEqual(expected);
      });
    });
  });
});
