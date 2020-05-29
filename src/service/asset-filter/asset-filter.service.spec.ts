jest.mock("fs");

import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { LoggerService } from "../logger/logger.service";
import { BridgeXServerError, ErrorCode } from "../utils";
import { PostgresService } from "../postgres/postgres.service";
import { IClientResponse, IClient } from "../postgres/postgres.service.i";
import { ConfigService } from "../config";
import { PostgresConfig } from "../../environment/postgres";

import { GuardAssetFilterResponse } from "./asset-filter.service.guard";
import { GetLocationParams, AssetTypeRecord, RegionRecord, CustomerRecord, LocationRecord } from "./asset-filter.service.i";
import { AssetFilterService } from "./asset-filter.service";

describe("AssetFilterService", () => {
  let service: AssetFilterService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;
  let postgresService: PostgresService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let guard: GuardAssetFilterResponse;

  class ClientMock implements IClient {
    public query$ = jest.fn(() => of(null as any));
    public queryByFile$ = jest.fn(() => of(null as any));
    public beginTrans$ = jest.fn(() => of(null as any));
    public commit$ = jest.fn(() => of(null as any));
    public rollback$ = jest.fn(() => of(null as any));
    public disconnect = jest.fn();
  }

  class ConfigServiceMock {
    public appConfig = jest.fn();
    public postgresConfig = jest.fn(() => ({} as PostgresConfig));
  }

  class PostgresServiceMock {
    public logger = { trace: () => {} } as any;
    public getClient$ = jest.fn(() => of(new ClientMock()));
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
        AssetFilterService,
        GuardAssetFilterResponse,
        { provide: PostgresService, useClass: PostgresServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get<AssetFilterService>(AssetFilterService);
    postgresService = module.get<PostgresService>(PostgresService);
    configService = module.get<ConfigService>(ConfigService);
    guard = module.get(GuardAssetFilterResponse);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(AssetFilterService.prototype.getAssetType$.name, () => {
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

    it("should execute select query and return asset types", (done) => {
      // arrange
      const response: IClientResponse<AssetTypeRecord> = {
        count: 3,
        records: [
          {
            typeId: "type1",
            totalCount: 3,
          } as any,
          {
            typeId: "type2",
            totalCount: 3,
          } as any,
          {
            typeId: "type3",
            totalCount: 3,
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-asset-type-master-asset.sql`,
          },
        },
      };

      // act
      service.getAssetType$().subscribe(
        () => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalled();
          expect(client.queryByFile$).toHaveBeenCalledTimes(1);
          expect(client.queryByFile$).toHaveBeenNthCalledWith(1, expected.asset.insertState.sqlPath);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return empty array when no records", (done) => {
      // arrange
      const response: IClientResponse<AssetTypeRecord> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected: any[] = [];

      // act
      service.getAssetType$().subscribe(
        (data) => {
          // assert
          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return invalid data error when records failed to match guard schema", (done) => {
      // arrange
      const response: IClientResponse<AssetTypeRecord> = {
        count: 1,
        records: [
          {
            fail: "",
            totalCount: 1,
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");

      // act
      service.getAssetType$().subscribe(
        (data) => fail(data),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });

    it("should throw Error(500) when sql error", (done) => {
      // arrange
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      service.getAssetType$().subscribe(
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

  describe(AssetFilterService.prototype.getRegion$.name, () => {
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

    it("should execute select query and return region", (done) => {
      // arrange
      const response: IClientResponse<RegionRecord> = {
        count: 3,
        records: [
          {
            regionId: "region1",
            totalCount: 3,
          } as any,
          {
            regionId: "region2",
            totalCount: 3,
          } as any,
          {
            regionId: "region3",
            totalCount: 3,
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-region_master.sql`,
          },
        },
      };

      // act
      service.getRegion$().subscribe(
        () => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalled();
          expect(client.queryByFile$).toHaveBeenCalledTimes(1);
          expect(client.queryByFile$).toHaveBeenNthCalledWith(1, expected.asset.insertState.sqlPath);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return empty array when no records", (done) => {
      // arrange
      const response: IClientResponse<RegionRecord> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected: any[] = [];

      // act
      service.getRegion$().subscribe(
        (data) => {
          // assert
          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return invalid data error when records failed to match guard schema", (done) => {
      // arrange
      const response: IClientResponse<RegionRecord> = {
        count: 1,
        records: [
          {
            fail: "",
            totalCount: 1,
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");

      // act
      service.getRegion$().subscribe(
        (data) => fail(data),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });

    it("should throw Error(500) when sql error", (done) => {
      // arrange
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      service.getRegion$().subscribe(
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

  describe(AssetFilterService.prototype.getCustomer$.name, () => {
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

    it("should execute select query and return customer", (done) => {
      // arrange
      const response: IClientResponse<CustomerRecord> = {
        count: 3,
        records: [
          {
            customerId: "customer1",
            totalCount: 3,
          } as any,
          {
            customerId: "customer2",
            totalCount: 3,
          } as any,
          {
            customerId: "customer3",
            totalCount: 3,
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-company.sql`,
          },
        },
      };

      // act
      service.getCustomer$().subscribe(
        () => {
          // assert
          expect(postgresService.getClient$).toHaveBeenCalled();
          expect(client.queryByFile$).toHaveBeenCalledTimes(1);
          expect(client.queryByFile$).toHaveBeenNthCalledWith(1, expected.asset.insertState.sqlPath);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return empty array when no records", (done) => {
      // arrange
      const response: IClientResponse<CustomerRecord> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected: any[] = [];

      // act
      service.getCustomer$().subscribe(
        (data) => {
          // assert
          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return invalid data error when records failed to match guard schema", (done) => {
      // arrange
      const response: IClientResponse<CustomerRecord> = {
        count: 1,
        records: [
          {
            fail: "",
            totalCount: 1,
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");

      // act
      service.getCustomer$().subscribe(
        (data) => fail(data),
        (err) => {
          // assert
          expect(err).toEqual(expected);
          done();
        },
      );
    });

    it("should throw Error(500) when sql error", (done) => {
      // arrange
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      service.getCustomer$().subscribe(
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

  describe(AssetFilterService.prototype.getLocation$.name, () => {
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
    it("should execute select location", (done) => {
      // arrange
      const params: GetLocationParams = {
        customerId: "customer",
      };
      const response: IClientResponse<LocationRecord> = {
        count: 3,
        records: [
          {
            customerId: "customer",
            locationId: "location1",
          } as any,
          {
            customerId: "customer",
            locationId: "location2",
          } as any,
          {
            customerId: "customer",
            locationId: "location3",
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = {
        asset: {
          insertState: {
            sqlPath: `${service.sqlDir}/select-company-locations.sql`,
            placeHolder: [params.customerId],
          },
        },
      };

      // act
      service.getLocation$(params).subscribe(
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

    it("should return empty array when no records", (done) => {
      // arrange
      const params: GetLocationParams = {
        customerId: "customer",
      };
      const response: IClientResponse<LocationRecord> = {
        count: 0,
        records: [],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected: any[] = [];

      // act
      service.getLocation$(params).subscribe(
        (data) => {
          // assert
          expect(data).toEqual(expected);
          done();
        },
        (err) => {
          fail(err);
        },
      );
    });

    it("should return invalid data error when records failed to match guard schema", (done) => {
      // arrange
      const params: GetLocationParams = {
        customerId: "customer",
      };
      const response: IClientResponse<LocationRecord> = {
        count: 1,
        records: [
          {
            fail: "",
            totalCount: 1,
          } as any,
        ],
      };

      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(of(response));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");

      // act
      service.getLocation$(params).subscribe(
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
      const params: GetLocationParams = {
        customerId: "customer",
      };
      jest.spyOn(postgresService, "getClient$").mockReturnValue(of(client));
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(new Error("hoge")));

      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Internal");

      // act
      service.getLocation$(params).subscribe(
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
});
