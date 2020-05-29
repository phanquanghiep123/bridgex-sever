jest.mock("fs");

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { LoggerService } from "../logger/logger.service";
import { AssetInventoryService } from "./asset-inventory.service";
import { PostgresService } from "../postgres/postgres.service";
import { IClientResponse, IClient } from "../postgres/postgres.service.i";
import { ConfigService } from "../config";
import { PostgresConfig } from "../../environment/postgres";
import { UpsertAssetInventoryParams, GetAssetInventoryParams, Inventory } from "./asset-inventory.service.i";
import { BridgeXServerError, ErrorCode } from "../utils";

describe("AssetStatusService", () => {
  let service: AssetInventoryService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;
  let postgresService: PostgresService;

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
        AssetInventoryService,
        { provide: PostgresService, useClass: PostgresServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get<AssetInventoryService>(AssetInventoryService);
    postgresService = module.get<PostgresService>(PostgresService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(AssetInventoryService.prototype.upsertAssetInventory$.name, () => {
    it("should execute upsert a Asset inventory", (done) => {
      // arrange
      const params: UpsertAssetInventoryParams = {
        typeId: "tyty",
        assetId: "asas",
        units: [
          {
            unit: "casset 1",
            status: "Full",
            nearFull: 550,
            nearEmpty: 10,
            capacity: 600,
            denominations: [
              {
                currencyCode: "EUR",
                faceValue: "20",
                count: 0,
                revision: 0,
              },
            ],
          },
        ],
      };
      jest.spyOn(postgresService, "controlTransaction$").mockImplementation((a, b) => b(clientMock));
      jest.spyOn(clientMock, "queryByFile$").mockImplementation(() => of(null as any));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/upsert-asset-inventory.sql`,
            placeHolder: ["tyty", "asas", JSON.stringify(params.units)],
          },
        },
      };

      // act
      service.upsertAssetInventory$(params).subscribe(
        () => {
          // assert
          expect(postgresService.controlTransaction$).toHaveBeenCalled();
          expect(clientMock.queryByFile$).toHaveBeenCalledTimes(1);
          expect(clientMock.queryByFile$).toHaveBeenNthCalledWith(
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
  });

  describe(AssetInventoryService.prototype.getAssetsInventory$.name, () => {
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
    it("should execute select query and return asset inventory", (done) => {
      // arrange
      const params: GetAssetInventoryParams = {
        typeId: "type",
        assetId: "asset",
      };
      const response: IClientResponse<Inventory> = {
        count: 1,
        records: [
          {
            typeId: "subtype",
            assetId: "subasset",
            cashUnits: [
              {
                unit: "casset 1",
                status: "NearFull",
                nearFull: 550,
                nearEmpty: 100,
                capacity: 900,
                denominations: [
                  {
                    currencyCode: "EUR",
                    faceValue: "20",
                    count: 0,
                    revision: 0,
                  } as any,
                ],
              } as any,
            ],
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        assetInventory: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-assets-inventory.sql`,
            placeHolder: [params.typeId, params.assetId],
          },
          response: {
            typeId: "type",
            assetId: "asset",
            subAssets: response.records,
          },
        },
      };

      // act
      service.getAssetsInventory$(params).subscribe(
        (data) => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalled();
          expect(client.queryByFile$).toHaveBeenNthCalledWith(
            1,
            expected.assetInventory.insertState.sqlPath,
            expected.assetInventory.insertState.placeHolder,
          );
          expect(data).toEqual(expected.assetInventory.response);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should not return parent asset as sub asset", (done) => {
      // arrange
      const params: GetAssetInventoryParams = {
        typeId: "type",
        assetId: "asset",
      };
      const response: IClientResponse<Inventory> = {
        count: 1,
        records: [
          {
            typeId: params.typeId,
            assetId: params.assetId,
            cashUnits: [{} as any],
          },
          {
            typeId: "subtype",
            assetId: "subasset",
            cashUnits: [
              {
                unit: "casset 1",
                status: "NearFull",
                nearFull: 550,
                nearEmpty: 100,
                capacity: 900,
                denominations: [
                  {
                    currencyCode: "EUR",
                    faceValue: "20",
                    count: 0,
                    revision: 0,
                  } as any,
                ],
              } as any,
            ],
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        response: {
          typeId: "type",
          assetId: "asset",
          subAssets: [response.records[1]],
        },
      };

      // act
      service.getAssetsInventory$(params).subscribe(
        (data) => {
          // assert
          expect(data).toEqual(expected.response);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return 404 when no records", (done) => {
      // arrange
      const params: GetAssetInventoryParams = {
        typeId: "type",
        assetId: "asset",
      };
      const response: IClientResponse<Inventory> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.NOT_FOUND, "");

      // act
      service.getAssetsInventory$(params).subscribe(
        () => fail("Not expected here"),
        (err) => {
          // assert
          expect(err.code).toEqual(expected.code);
          done();
        },
      );
    });

    it("should throw Error(500) when sql error. ", (done) => {
      // arrange
      const params: GetAssetInventoryParams = {
        typeId: "type",
        assetId: "asset",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      service.getAssetsInventory$(params).subscribe(
        () => {
          fail();
        },
        (err) => {
          expect(err.code).toEqual(expected.code);
          done();
        },
      );
    });
  });
});
