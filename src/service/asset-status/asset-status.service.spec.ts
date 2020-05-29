jest.mock("fs");

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError, empty } from "rxjs";

import { LoggerService } from "../logger/logger.service";
import {
  AssetStatus,
  EAssetStatus,
  UpsertAssetStatusParams,
  AssetStatusRecord,
  UpsertNoteParams,
  UpsertConnectionParams,
  GetAssetsParams,
  AssetRecord,
  GetAssetParams,
  Asset,
  AssetKey,
} from "./asset-status.service.i";
import { AssetStatusService } from "./asset-status.service";
import { BridgeXServerError, ErrorCode } from "../utils";
import { PostgresService } from "../postgres/postgres.service";
import { IClientResponse, IClient } from "../postgres/postgres.service.i";
import { ConfigService } from "../config";
import { PostgresConfig } from "../../environment/postgres";
import { GuardAssetStatusResponse } from "./asset-status.service.guard";
import { PostgresError } from "../postgres/client";

describe("AssetStatusService", () => {
  let service: AssetStatusService;
  let configService: ConfigService;
  let postgresService: PostgresService;
  let guard: GuardAssetStatusResponse;

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
    public getClient$ = jest.fn(() => of(clientMock));
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
        AssetStatusService,
        GuardAssetStatusResponse,
        { provide: PostgresService, useClass: PostgresServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get<AssetStatusService>(AssetStatusService);
    postgresService = module.get<PostgresService>(PostgresService);
    configService = module.get<ConfigService>(ConfigService);
    guard = module.get(GuardAssetStatusResponse);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(AssetStatusService.prototype.upsertAssetStatus$.name, () => {
    it("should execute upserting status about a specified asset", () => {
      // arrange
      const params: UpsertAssetStatusParams = {
        typeId: "tyty",
        assetId: "asas",
        status: EAssetStatus.Error,
        errorCode: "erer",
      };
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(postgresService, "transactBySql$").mockImplementation(() => of(null));

      const expected = {
        client: clientMock,
        sqlPath: `${service.sqlDir}/upsert-asset-status.sql`,
        placeHolder: [params.typeId, params.assetId, params.status, params.errorCode || ""],
      };

      // act
      return service
        .upsertAssetStatus$(params)
        .toPromise()
        .then(() => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalledWith(configService.postgresConfig(), expect.anything());
          expect(postgresService.transactBySql$).toHaveBeenCalledWith(expected.client, expected.sqlPath, expected.placeHolder);
        })
        .catch((e) => fail(e));
    });
  });

  describe(AssetStatusService.prototype.upsertNote$.name, () => {
    it('should call "upsert-asset-status.sql" and correct placeholder', (done) => {
      // arrange
      const params: UpsertNoteParams = {
        typeId: "tyty",
        assetId: "asas",
        note: "nono",
      };

      const expected = {
        sqlPath: `${service.sqlDir}/upsert-asset-note.sql`,
        placeHolder: [params.typeId, params.assetId, params.note],
      };

      // act
      service.upsertNote$(params).subscribe(
        () => {
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(configService.postgresConfig).toHaveBeenCalled();
          expect(postgresService.transactBySql$).toHaveBeenCalledWith(clientMock, expected.sqlPath, expected.placeHolder);
          done();
        },
        (e) => fail(e),
      );
    });
  });

  describe(AssetStatusService.prototype.upsertConnection$.name, () => {
    it("should call queryByFile with correct sqlPath and placeHolder", (done) => {
      // arrange
      const params: UpsertConnectionParams = {
        typeId: "tyty",
        assetId: "asas",
        status: EAssetStatus.Missing,
        ipAddress: "ipip",
      };
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockReturnValue(of(null as any));

      const expected = [
        {
          sqlPath: `${service.sqlDir}/upsert-asset-ipaddress.sql`,
          placeHolder: [params.typeId, params.assetId, params.ipAddress],
        },
        {
          sqlPath: `${service.sqlDir}/upsert-asset-status.sql`,
          placeHolder: [params.typeId, params.assetId, params.status, ""],
        },
      ];

      // act
      service.upsertConnection$(params).subscribe(
        (data) => {
          // assert
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(1, expected[0].sqlPath, expected[0].placeHolder);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(2, expected[1].sqlPath, expected[1].placeHolder);
          expect(data).toEqual(null);
          done();
        },
        (err) => fail(err),
      );
    });

    it("should return error when return postgres error", (done) => {
      // arrange
      const params: UpsertConnectionParams = {
        typeId: "tyty",
        assetId: "asas",
        status: EAssetStatus.Missing,
        ipAddress: "ipip",
      };
      const error = new PostgresError(123, "test error");
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockReturnValue(throwError(error));

      const expected = ErrorCode.categorize(error);

      // act
      service.upsertConnection$(params).subscribe(
        () => fail(),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });
  });

  describe(AssetStatusService.prototype.get$.name, () => {
    let params: GetAssetParams;
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
      jest.spyOn(postgresService, "getClient$").mockReturnValue(empty());

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

    it("should call queryByFile$ with splPath and placeHolder", (done) => {
      // arrange
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(empty());
      jest.spyOn(client, "disconnect").mockReturnValue();

      const expected = {
        sqlPath: `${service.sqlDir}/select-asset-status.sql`,
        placeHolder: [params.typeId, params.assetId],
      };

      // act
      service.get$(params).subscribe(
        () => {},
        (err) => fail(err),
        () => {
          // assert
          expect(client.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder);
          expect(client.disconnect).toHaveBeenCalled();
          done();
        },
      );
    });

    it("should return 404 when root asset doesn't exist", (done) => {
      // arrange
      const subAsset = [
        {
          typeId: "tyty1",
          assetId: "asas1",
          isSubAsset: true,
        } as any,
      ];

      const response: IClientResponse<AssetStatusRecord> = {
        count: 2,
        records: [...subAsset],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.NOT_FOUND, "");

      jest.spyOn(service, "convertToAssetStatus");

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

    it("should throw Error(500) when rootAsset duplicates ", (done) => {
      // arrange
      const rootAssets = [
        {
          typeId: "tyty1",
          assetId: "asas1",
          isSubAsset: false,
        } as any,
        {
          typeId: "tyty2",
          assetId: "asas2",
          isSubAsset: false,
        } as any,
      ];
      const subAssets = [
        {
          typeId: "tyty2",
          assetId: "asas2",
          isSubAsset: true,
        } as any,
      ];
      const response: IClientResponse<AssetStatusRecord> = {
        count: 2,
        records: [...rootAssets, ...subAssets],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");
      jest.spyOn(service, "convertToAssetStatus");

      // act
      service.get$(params).subscribe(
        () => fail("Not expected here"),
        (err) => {
          // assert
          expect(service.convertToAssetStatus).not.toHaveBeenCalled();
          expect(err.code).toEqual(expected.code);
          done();
        },
      );
    });

    it("should call convertToAssetStatus with all assets.", (done) => {
      // arrange
      const rootAsset = {
        typeId: "tyty1",
        assetId: "asas1",
        isSubAsset: false,
      } as any;
      const subAssets = [
        {
          typeId: "tyty2",
          assetId: "asas2",
          isSubAsset: true,
        } as any,
        {
          typeId: "tyty3",
          assetId: "asas3",
          isSubAsset: true,
        } as any,
      ];

      const response: IClientResponse<AssetStatusRecord> = {
        count: 2,
        records: [{ ...rootAsset }, ...subAssets],
      };

      const expected = {
        assets: response.records,
        data: {
          ...service.convertToAssetStatus(rootAsset),
          subAssets: subAssets.map((subAsset) => service.convertToAssetStatus(subAsset)),
        },
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));
      jest.spyOn(service, "convertToAssetStatus");

      // act
      service.get$(params).subscribe(
        (data) => {
          // assert
          expect(service.convertToAssetStatus).toHaveBeenCalledTimes(3);
          expect(service.convertToAssetStatus).toHaveBeenCalledWith(expected.assets[0]);
          expect(service.convertToAssetStatus).toHaveBeenCalledWith(expected.assets[1]);
          expect(service.convertToAssetStatus).toHaveBeenCalledWith(expected.assets[2]);
          expect(data).toEqual(expected.data);
          done();
        },
        (e) => fail(e),
      );
    });

    it("should return subAsset as empty array when sub asset doesn't exist.", (done) => {
      // arrange
      const rootAsset = {
        typeId: "tyty1",
        assetId: "asas1",
        isSubAsset: false,
      } as any;

      const response: IClientResponse<AssetStatusRecord> = {
        count: 2,
        records: [{ ...rootAsset }],
      };

      const expected = {
        assets: response.records,
        data: {
          ...service.convertToAssetStatus(rootAsset),
          subAssets: [],
        },
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));
      jest.spyOn(service, "convertToAssetStatus");

      // act
      service.get$(params).subscribe(
        (data) => {
          // assert
          expect(data).toEqual(expected.data);
          done();
        },
        (e) => fail(e),
      );
    });
  });

  describe(AssetStatusService.prototype.getOwnerOrThis$.name, () => {
    let params: GetAssetParams;
    let client: IClient;

    beforeEach(() => {
      params = {
        typeId: "tyty",
        assetId: "asas",
      };
      client = {
        query$: jest.fn().mockReturnValue(empty()),
        queryByFile$: jest.fn().mockReturnValue(empty()),
        beginTrans$: jest.fn().mockReturnValue(empty()),
        commit$: jest.fn().mockReturnValue(empty()),
        rollback$: jest.fn().mockReturnValue(empty()),
        disconnect: jest.fn().mockReturnValue(empty()),
      };
    });

    it("should call getClient$ with postgresConfig", () => {
      // arrange
      const postgresConfig = {} as PostgresConfig;

      jest.spyOn(configService, "postgresConfig").mockReturnValue(postgresConfig);
      jest.spyOn(postgresService, "getClient$").mockReturnValue(empty());

      const expected = postgresConfig;

      // act
      return (
        service
          .getOwnerOrThis$(params)
          .toPromise()
          // assert
          .then(() => expect(postgresService.getClient$).toHaveBeenCalledWith(expected))
          .catch(fail)
      );
    });

    it("should call queryByFile$ with splPath and placeHolder", () => {
      // arrange
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(empty());
      jest.spyOn(client, "disconnect").mockReturnValue();

      const expected = {
        sqlPath: `${service.sqlDir}/select-owner-asset.sql`,
        placeHolder: [params.typeId, params.assetId],
      };

      // act
      return (
        service
          .getOwnerOrThis$(params)
          .toPromise()
          // assert
          .then(() => {
            expect(client.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder);
            expect(client.disconnect).toHaveBeenCalled();
          })
          .catch(fail)
      );
    });

    it("should throw Error(500) when isSubAsset:false are more than 1. ", () => {
      // arrange
      const response: IClientResponse<AssetStatusRecord> = {
        count: 2,
        records: [
          {
            typeId: "tyty1",
            assetId: "asas1",
          } as any,
          {
            typeId: "tyty2",
            assetId: "asas2",
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      return (
        service
          .getOwnerOrThis$(params)
          .toPromise()
          // assert
          .then(fail)
          .catch((err) => {
            expect(err.code).toEqual(expected.code);
          })
      );
    });

    it("should return an expected owner asset", () => {
      // arrange
      const expected: AssetKey = {
        typeId: "target-type",
        assetId: "target-asset",
      };

      const response: IClientResponse<AssetKey> = {
        count: 1,
        records: [
          {
            typeId: "target-type",
            assetId: "target-asset",
          },
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      // act
      return (
        service
          .getOwnerOrThis$(params)
          .toPromise()
          // assert
          .then((actual) => expect(actual).toEqual(expected))
          .catch(fail)
      );
    });

    it("should return specified asset if specified asset does not have an owner.", () => {
      // arrange
      const response: IClientResponse<AssetStatusRecord> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = { ...params };

      // act
      return (
        service
          .getOwnerOrThis$(params)
          .toPromise()
          // assert
          .then((actual) => expect(actual).toEqual(expected))
          .catch(fail)
      );
    });
  });

  describe(AssetStatusService.prototype.getMany$.name, () => {
    let client: IClient;
    beforeEach(async () => {
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
      const params: GetAssetParams[] = [];

      // act
      service.getMany$(params).subscribe(
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
      const params: GetAssetParams[] = [{ typeId: "tyty", assetId: "asas" }];

      postgresService.getClient$ = jest.fn(() => throwError({}));

      const expected = configService.postgresConfig();

      // act
      return (
        service
          .getMany$(params)
          .toPromise()
          // assert
          // .then(fail("not expected here"))
          .then(() => fail("not expected here"))
          .catch(() => {
            expect(postgresService.getClient$).toHaveBeenCalledWith(expected);
          })
      );
    });

    it("should return error when any query failed", () => {
      // arrange
      const params: GetAssetParams[] = [
        { typeId: "tyty1", assetId: "asas1" },
        { typeId: "tyty2", assetId: "asas2" },
      ];
      const error = {};

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => throwError({}));

      const expected = ErrorCode.categorize(error);

      // act
      return (
        service
          .getMany$(params)
          .toPromise()
          // assert
          // .then(fail("not expected here"))
          .then(() => fail("not expected here"))
          .catch((e) => {
            expect(e.code).toEqual(expected.code);
          })
      );
    });

    it("should query for all element of parameters", () => {
      // arrange
      const params: GetAssetParams[] = [
        { typeId: "tyty1", assetId: "asas1" },
        { typeId: "tyty2", assetId: "asas2" },
      ];

      const response = {
        count: 0,
        records: [],
      };

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => of(response));

      const expected = {
        sqlPath: `${service.sqlDir}/select-asset-status.sql`,
        elems: params.map((v) => Object.values(v)),
      };

      // act
      return (
        service
          .getMany$(params)
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

    it("should return Missing asset when parent asset can't be found", () => {
      // arrange
      const params: GetAssetParams[] = [
        { typeId: "tyty1", assetId: "asas1" },
        { typeId: "tyty2", assetId: "asas2" },
      ];

      const response = {
        count: 0,
        records: [],
      };

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => of(response));

      const expected = [
        {
          typeId: "tyty1",
          assetId: "asas1",
          status: EAssetStatus.Missing,
          subAssets: [],
        },
        {
          typeId: "tyty2",
          assetId: "asas2",
          status: EAssetStatus.Missing,
          subAssets: [],
        },
      ];

      // act
      return (
        service
          .getMany$(params)
          .toPromise()
          // assert
          .then((data) => {
            expect(data).toEqual(expected);
          })
          .catch(fail)
      );
    });

    it("should call converter with parent asset when parent asset was found", () => {
      // arrange
      const params: GetAssetParams[] = [
        { typeId: "tyty1", assetId: "asas1" },
        { typeId: "tyty2", assetId: "asas2" },
      ];

      const response1 = {
        count: 1,
        records: [
          {
            typeId: "tyty1",
            assetId: "asas1",
            status: EAssetStatus.Good,
            isSubAsset: false,
          },
        ],
      };
      const response2 = {
        count: 1,
        records: [
          {
            typeId: "tyty2",
            assetId: "asas2",
            status: EAssetStatus.Error,
            isSubAsset: false,
          },
        ],
      };

      postgresService.getClient$ = jest.fn(() => of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValueOnce(of(response1));
      jest.spyOn(client, "queryByFile$").mockReturnValueOnce(of(response2));
      service.convertToAssetStatus = jest.fn(() => ({} as any));

      const expected = [
        {
          typeId: "tyty1",
          assetId: "asas1",
          status: EAssetStatus.Good,
          isSubAsset: false,
        },
        {
          typeId: "tyty2",
          assetId: "asas2",
          status: EAssetStatus.Error,
          isSubAsset: false,
        },
      ];

      // act
      return (
        service
          .getMany$(params)
          .toPromise()
          // assert
          .then(() => {
            expected.forEach((v) => {
              expect(service.convertToAssetStatus).toHaveBeenCalledWith(v);
            });
          })
          .catch(fail)
      );
    });

    it("should call converter with sub asset when sub asset was found", () => {
      // arrange
      const params: GetAssetParams[] = [{ typeId: "tyty1", assetId: "asas1" }];

      const response = {
        count: 2,
        records: [
          {
            typeId: "tyty1",
            assetId: "asas1",
            status: EAssetStatus.Good,
            isSubAsset: false,
          },
          {
            typeId: "subty1",
            assetId: "subas1",
            status: EAssetStatus.Good,
            isSubAsset: true,
          },
        ],
      };

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => of(response as any));
      service.convertToAssetStatus = jest.fn(() => ({} as any));

      const expected = [
        {
          typeId: "subty1",
          assetId: "subas1",
          status: EAssetStatus.Good,
          isSubAsset: true,
        },
      ];

      // act
      return (
        service
          .getMany$(params)
          .toPromise()
          // assert
          .then(() => {
            expected.forEach((v) => {
              expect(service.convertToAssetStatus).toHaveBeenCalledWith(v);
            });
          })
          .catch(fail)
      );
    });

    it("should return parent and sub asset", () => {
      // arrange
      const params: GetAssetParams[] = [{ typeId: "tyty1", assetId: "asas1" }];

      const response = {
        count: 2,
        records: [
          {
            typeId: "tyty1",
            assetId: "asas1",
            status: EAssetStatus.Good,
            isSubAsset: false,
          },
          {
            typeId: "subty1",
            assetId: "subas1",
            status: EAssetStatus.Good,
            isSubAsset: true,
          },
        ],
      };

      postgresService.getClient$ = jest.fn(() => of(client));
      client.queryByFile$ = jest.fn(() => of(response as any));
      jest.spyOn(service, "convertToAssetStatus").mockReturnValueOnce({
        typeId: response.records[0].typeId,
        assetId: response.records[0].assetId,
        status: response.records[0].status,
      });
      jest.spyOn(service, "convertToAssetStatus").mockReturnValueOnce({
        typeId: response.records[1].typeId,
        assetId: response.records[1].assetId,
        status: response.records[1].status,
      });

      const expected = [
        {
          typeId: "tyty1",
          assetId: "asas1",
          status: EAssetStatus.Good,
          subAssets: [
            {
              typeId: "subty1",
              assetId: "subas1",
              status: EAssetStatus.Good,
            },
          ],
        },
      ];

      // act
      return (
        service
          .getMany$(params)
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

  describe(AssetStatusService.prototype.convertToAssetStatus.name, () => {
    it("should return typeId, assetId, status, errorCode", () => {
      // arrange
      const src: AssetStatusRecord = {
        typeId: "01ty",
        assetId: "01as",
        status: EAssetStatus.Missing,
        errorCode: "0001",
        isSubAsset: false,
      };
      const expected: AssetStatus = {
        typeId: "01ty",
        assetId: "01as",
        status: EAssetStatus.Missing,
        errorCode: "0001",
      };
      // act
      const actual = service.convertToAssetStatus(src as any);
      // assert
      expect(actual).toEqual(expected);
    });

    it("should not return errorCode when errorCode is falsy", () => {
      // arrange
      const src: AssetStatusRecord = {
        typeId: "01ty",
        assetId: "01as",
        status: EAssetStatus.Missing,
        errorCode: "",
        isSubAsset: false,
      };
      const expected: AssetStatus = {
        typeId: "01ty",
        assetId: "01as",
        status: EAssetStatus.Missing,
      };
      // act
      const actual = service.convertToAssetStatus(src as any);
      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe(AssetStatusService.prototype.getAsset$.name, () => {
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
    it("should execute select query and return asset", () => {
      // arrange
      const params: GetAssetParams = {
        typeId: "tyty",
        assetId: "cucu",
      };
      const response: IClientResponse<Asset> = {
        count: 1,
        records: [
          {
            typeId: "tyty",
            assetId: "cucu",
            locationId: "",
            customerId: "",
            regionId: "",
            ipAddress: "",
            alias: "",
            description: "",
            note: "",
            status: "missing",
            installationDate: null,
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-asset.sql`,
            placeHolder: [params.typeId, params.assetId],
          },
          response: response.records[0],
        },
      };

      // act
      return service
        .getAsset$(params)
        .toPromise()
        .then((data) => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalled();
          expect(client.queryByFile$).toHaveBeenCalledTimes(1);
          expect(client.queryByFile$).toHaveBeenNthCalledWith(
            1,
            expected.asset.insertState.sqlPath,
            expected.asset.insertState.placeHolder,
          );
          expect(data).toEqual(expected.asset.response);
        })
        .catch(fail);
    });

    it("should return status code 404 when no records", () => {
      // arrange
      const params: GetAssetParams = {
        typeId: "tyty",
        assetId: "cucu",
      };
      const response: IClientResponse<Asset> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.NOT_FOUND, "");

      // act
      return service
        .getAsset$(params)
        .toPromise()
        .then(() => fail("Not expected here"))
        .catch((err) => expect(err.code).toEqual(expected.code));
    });

    it("should return invalid data error when records failed to match guard schema", () => {
      // arrange
      const params: GetAssetParams = {
        typeId: "tyty",
        assetId: "cucu",
      };
      const response: IClientResponse<Asset> = {
        count: 1,
        records: [
          {
            typeId: "tyty",
            assetId: "cucu",
            foo: "",
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");

      // act
      return service
        .getAsset$(params)
        .toPromise()
        .then(() => fail("Not expected here"))
        .catch((err) => expect(err).toEqual(expected));
    });

    it("should throw Error(500) when sql error. ", () => {
      // arrange
      const params: GetAssetParams = {
        typeId: "tyty",
        assetId: "cucu",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      return service
        .getAsset$(params)
        .toPromise()
        .then(() => fail("Not expected here"))
        .catch((err) => expect(err.code).toEqual(expected.code));
    });
  });

  describe(AssetStatusService.prototype.getAssets$.name, () => {
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
    it("should execute select assets", (done) => {
      // arrange
      const params: GetAssetsParams = {
        isFilter: "true",
        status: "good",
        typeId: "tyty",
        region: "cucu",
        location: "lolo",
        organization: "rere",
        text: "tete",
        sortName: "soname",
        sort: "soso",
        limit: "10",
        offset: "20",
      };
      const response: IClientResponse<AssetRecord> = {
        count: 2,
        records: [
          {
            typeId: "tyty1",
            assetId: "asas1",
            alias: null,
            locationId: null,
            customerId: null,
            regionId: null,
            ipAddress: null,
            description: null,
            note: null,
            status: "status",
            installationDate: null,
            totalCount: "2",
          } as any,
          {
            typeId: "tyty2",
            assetId: "asas2",
            alias: null,
            locationId: null,
            customerId: null,
            regionId: null,
            ipAddress: null,
            description: null,
            note: null,
            status: "status",
            installationDate: null,
            totalCount: "2",
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-assets.sql`,
            placeHolder: [
              params.typeId,
              params.organization,
              params.location,
              params.region,
              params.text,
              params.limit,
              params.offset,
              params.status,
              `${params.sortName} ${params.sort}`,
            ],
          },
        },
      };

      // act
      service.getAssets$(params).subscribe(
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
          done();
        },
      );
    });

    it("shouldthrow INTERNAL when response data error", (done) => {
      // arrange
      const params: GetAssetsParams = {
        isFilter: "true",
        status: "good",
        typeId: "tyty",
        region: "cucu",
        location: "lolo",
        organization: "rere",
        text: "tete",
        sortName: "sortname",
        sort: "soso",
        limit: "10",
        offset: "20",
      };
      const response: IClientResponse<AssetRecord> = {
        count: 2,
        records: [
          {
            typeId: "tyty1",
            assetId: "asas1",
            totalCount: "2",
          } as any,
          {
            typeId: "tyty2",
            assetId: "asas2",
            totalCount: "2",
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
      // act
      service.getAssets$(params).subscribe(
        () => {
          // assert
          fail();
          done();
        },
        (err) => {
          expect(err.code).toEqual(expected.code);
          done();
        },
      );
    });

    it("should throw Error(500) when sql error. ", (done) => {
      // arrange
      const params: GetAssetsParams = {
        isFilter: "false",
        status: "error",
        typeId: "tyty",
        region: "cucu",
        location: "lolo",
        organization: "rere",
        text: "tete",
        sortName: "sortname",
        sort: "soso",
        limit: "10",
        offset: "20",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      service.getAssets$(params).subscribe(
        () => {
          fail("Not expected here");
          done();
        },
        (err) => {
          expect(err.code).toEqual(expected.code);
          done();
        },
      );
    });
  });

  describe(AssetStatusService.prototype.getAssetAvailability$.name, () => {
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

    describe("normal pattern", () => {
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
        const records = {
          count: 4,
          records: [
            { status: "Good", count: "0" },
            { status: "Error", count: "123" },
            { status: "Missing", count: "45678" },
            { status: "Online", count: "90" },
          ],
        };
        jest.spyOn(client, "queryByFile$").mockReturnValue(of(records));
        jest.spyOn(guard, "isGetAssetAvailabilityRecords").mockReturnValue(true);

        expected = {
          queryByFile: {
            sqlPath: `${service.sqlDir}/select-asset-availability.sql`,
          },
          isGetAssetAvailabilityRecords: records.records,
          data: [
            { status: "Good", count: 0 },
            { status: "Error", count: 123 },
            { status: "Missing", count: 45678 },
            { status: "Online", count: 90 },
          ],
        };

        // act
        act = service.getAssetAvailability$().toPromise();
      });
      // assert
      it("should call queryByFile with correct sqlPath", () => {
        return act.then(() => expect(client.queryByFile$).toHaveBeenCalledWith(expected.queryByFile.sqlPath)).catch((e: any) => fail(e));
      });
      it("should call disconnect", () => {
        return act.then(() => expect(client.disconnect).toHaveBeenCalled()).catch((e: any) => fail(e));
      });
      it("should call isGetAssetAvailabilityRecords$", () => {
        return act
          .then(() => expect(guard.isGetAssetAvailabilityRecords).toHaveBeenCalledWith(expected.isGetAssetAvailabilityRecords))
          .catch((e: any) => fail(e));
      });
      it("should return records data", () => {
        return act.then((actual: any) => expect(actual).toEqual(expected.data)).catch((e: any) => fail(e));
      });
    });

    describe("when records are type error", () => {
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
        const records = { count: 1, records: [{ status: "Good", count: 0 }] };
        jest.spyOn(client, "queryByFile$").mockReturnValue(of(records));
        jest.spyOn(guard, "isGetAssetAvailabilityRecords").mockReturnValue(false);

        expected = {
          err: new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database"),
        };

        // act
        act = service.getAssetAvailability$().toPromise();
      });
      // assert
      it("should call disconnect", () => {
        return act.then(() => fail()).catch(() => expect(client.disconnect).toHaveBeenCalled());
      });
      it("should throw BridgeXServerError", () => {
        return act.then(() => fail()).catch((e: any) => expect(e).toEqual(expected.err));
      });
    });

    describe("when happenning PostgressError", () => {
      let expected: any;
      let act: any;
      beforeEach(() => {
        // arrange
        jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
        const error = new Error("test error");
        jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(error));

        expected = {
          err: ErrorCode.categorize(error),
        };

        // act
        act = service.getAssetAvailability$().toPromise();
      });
      // assert
      it("should call disconnect", () => {
        return act.then(() => fail()).catch(() => expect(client.disconnect).toHaveBeenCalled());
      });
      it("should throw BridgeXServerError", () => {
        return act.then(() => fail()).catch((e: any) => expect(e).toEqual(expected.err));
      });
    });
  });
});
