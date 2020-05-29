import { Test, TestingModule } from "@nestjs/testing";
import { of, Observable, throwError } from "rxjs";

import { LoggerService } from "../logger/logger.service";
import { BridgeXServerError, ErrorCode } from "../utils";
import { PostgresService } from "./postgres.service";
import { IClient, IClientResponse } from "./postgres.service.i";
import { ConnectionPool } from "./connection-pool";
import { PostgresConfig } from "../../environment/postgres";

describe("PostgresService", () => {
  let module: TestingModule;
  let service: PostgresService;
  let loggerService: LoggerService;

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [PostgresService, { provide: LoggerService, useClass: LoggerServiceMock }],
    }).compile();

    service = module.get<PostgresService>(PostgresService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("onModuleDestroy", () => {
    it("should call onModuleDestroy when destoring this module", async () => {
      // arrange
      service.pools = {
        hoge: { key: "hoge", pool: new ConnectionPool() },
      };

      service.onModuleDestroy = jest.fn();

      // act
      await module.close();

      // assert
      expect(service.onModuleDestroy).toHaveBeenCalled();
    });

    it("should call pool.end only once when destroing repeatedly", async () => {
      // arrange
      service.pools = {
        hoge: { key: "hoge", pool: new ConnectionPool() },
      };

      jest.spyOn(service, "onModuleDestroy");
      service.pools.hoge.pool.pool.end = jest.fn(() => Promise.resolve());

      // act
      await module.close();
      await module.close();

      // assert
      expect(service.onModuleDestroy).toHaveBeenCalledTimes(2);
      expect(service.pools.hoge.pool.pool.end).toHaveBeenCalledTimes(1);
      expect(loggerService.info).toHaveBeenCalledTimes(1);
    });

    it("should call loggerService.info when pool.end throw error", async () => {
      // arrange
      service.pools = {
        hoge: { key: "hoge", pool: new ConnectionPool() },
      };

      jest.spyOn(service, "onModuleDestroy");
      service.pools.hoge.pool.pool.end = jest.fn(() => Promise.reject());

      // act
      await module.close();
      await module.close();

      // assert
      expect(service.onModuleDestroy).toHaveBeenCalledTimes(2);
      expect(service.pools.hoge.pool.pool.end).toHaveBeenCalledTimes(1);
      expect(loggerService.error).toHaveBeenCalledTimes(1);
    });

    it("should call pool.end only once about all pools", async () => {
      // arrange
      service.pools = {
        hoge: { key: "hoge", pool: new ConnectionPool() },
        moge: { key: "moge", pool: new ConnectionPool() },
      };

      Object.values(service.pools).forEach((obj) => {
        obj.pool.pool.end = jest.fn(() => new Promise(() => {}) as any);
      });

      // act
      await module.close();
      await module.close();

      // assert
      Object.values(service.pools).forEach((obj) => {
        expect(obj.pool.pool.end).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("get()", () => {
    afterEach(() => {
      Object.keys(service.pools).forEach((key) => {
        const pool = service.pools[key].pool as ConnectionPool;
        pool.teardown$.next();
        pool.teardown$.complete();
      });

      service.pools = {};
    });

    test("should call createPool 2 times", () => {
      // arrange
      spyOn(service, "createPool").and.callThrough();

      // act
      service.get("foo");
      service.get("bar");
      service.get("foo");

      // assert
      expect(service.createPool).toHaveBeenCalledTimes(2);
    });

    test("should return proper instance", () => {
      // arrange

      // act
      const actual = [service.get("foo"), service.get("bar"), service.get("foo")];

      // assert
      expect(actual[0]).toBe(actual[2]);
      expect(actual[1]).not.toBe(actual[2]);
    });
  });

  describe("getClient$", () => {
    const client = {} as IClient;
    class ConnectionPoolMock {
      public connect$ = jest.fn(() => of(client));
      public end$ = jest.fn();
    }
    it("should call pool.connect$ when succeded to connect to pool", () => {
      // arrange
      const argument = {} as PostgresConfig;
      const pool = new ConnectionPoolMock();
      jest.spyOn(service, "get").mockReturnValue(pool);

      // act
      service.getClient$(argument);

      // assert
      expect(pool.connect$).toHaveBeenCalled();
    });

    it("should return client returned by connect$", () => {
      // arrange
      const argument = {} as PostgresConfig;
      const pool = new ConnectionPoolMock();
      jest.spyOn(service, "get").mockReturnValue(pool);

      const expected = client;

      // act
      return service
        .getClient$(argument)
        .toPromise()
        .then((data) => expect(data).toEqual(expected))
        .catch(() => fail("made bug"));
    });

    it("shoud return error when failed to connect to pool", () => {
      // arrange
      const argument = {} as PostgresConfig;
      jest.spyOn(service, "get").mockReturnValue(undefined as any);
      const expected = {
        code: 500,
        message: "Failed to connect to DB pool",
      };

      // act
      return service
        .getClient$(argument)
        .toPromise()
        .then(() => fail("made bug"))
        .catch((e) => {
          expect(e.code).toEqual(expected.code);
          expect(e.message).toEqual(expected.message);
        });
    });

    it("should throw error", () => {
      // arrange
      const argument = {} as PostgresConfig;
      const pool = new ConnectionPoolMock();
      jest.spyOn(service, "get").mockReturnValue(pool);
      const error = new BridgeXServerError(ErrorCode.INTERNAL, "error mock");
      pool.connect$ = jest.fn(() => throwError(error));

      // act
      return service
        .getClient$(argument)
        .toPromise()
        .then((data) => fail(data))
        .catch((err: any) => expect(err).toBe(error));
    });
  });

  describe("controlTransaction$", () => {
    class ClientMock implements IClient {
      public query$: jest.Mock<Observable<IClientResponse<any>>> = jest.fn(() => of({ count: 0, records: [] }));
      public queryByFile$: jest.Mock<Observable<IClientResponse<any>>> = jest.fn(() => of({ count: 0, records: [] }));
      public beginTrans$: jest.Mock<Observable<void>> = jest.fn(() => of(null as any));
      public commit$: jest.Mock<Observable<void>> = jest.fn(() => of(null as any));
      public rollback$: jest.Mock<Observable<void>> = jest.fn(() => of(null as any));
      public disconnect: jest.Mock<void> = jest.fn();
    }

    let client: ClientMock;
    let transaction: jest.Mock<Observable<any>>;

    beforeEach(() => {
      client = new ClientMock();
      transaction = jest.fn(() => of(null));
      jest.spyOn(service, "getClient$").mockReturnValue(of(client));
    });

    it("should call client.beginTrans$", (done) => {
      // arrange
      const argument = {} as PostgresConfig;

      // act
      const observable$ = service.controlTransaction$(argument, transaction);

      // assert
      observable$.subscribe({
        next: () => expect(client.beginTrans$).toHaveBeenCalled(),
        error: (err) => fail(err),
        complete: () => done(),
      });
    });

    it("should call transaction", (done) => {
      // arrange
      const argument = {} as PostgresConfig;

      // act
      const observable$ = service.controlTransaction$(argument, transaction);

      // assert
      observable$.subscribe({
        next: () => expect(transaction).toHaveBeenCalledWith(client),
        error: fail,
        complete: done,
      });
    });

    it("should call client.commit$", (done) => {
      // arrange
      const argument = {} as PostgresConfig;

      // act
      const observable$ = service.controlTransaction$(argument, transaction);

      // assert
      observable$.subscribe({
        next: () => expect(client.commit$).toHaveBeenCalled(),
        error: (err) => fail(err),
        complete: () => done(),
      });
    });

    it("should call client.rollback$", (done) => {
      // arrange
      const argument = {} as PostgresConfig;
      const t = jest.fn().mockReturnValue(throwError(new Error()));

      // act
      const observable$ = service.controlTransaction$(argument, t);

      // assert
      observable$.subscribe({
        next: () => fail(),
        error: () => {
          expect(client.rollback$).toHaveBeenCalled();
          done();
        },
        complete: fail,
      });
    });

    it("should call client.disconnect", (done) => {
      // arrange
      const argument = {} as PostgresConfig;

      // act
      const observable$ = service.controlTransaction$(argument, transaction);

      // assert
      const stub = jest.fn();
      observable$
        .subscribe(stub, fail, () => expect(stub).toHaveBeenCalled())
        .add(() => expect(client.disconnect).toHaveBeenCalled())
        .add(done);
    });

    it("should return 2", (done) => {
      // arrange
      const argument = {} as PostgresConfig;
      transaction.mockReturnValue(of(2));

      // act
      const observable$ = service.controlTransaction$<number>(argument, transaction);

      // assert
      const stub = jest.fn();
      observable$.subscribe(stub, fail, () => {
        expect(stub).toHaveBeenCalledWith(2);
        done();
      });
    });
  });

  describe("transactBySql$", () => {
    class ClientMock implements IClient {
      public query$: jest.Mock<Observable<IClientResponse<any>>> = jest.fn(() => of({ count: 0, records: [] }));
      public queryByFile$: jest.Mock<Observable<IClientResponse<any>>> = jest.fn(() => of({ count: 0, records: [] }));
      public beginTrans$: jest.Mock<Observable<void>> = jest.fn(() => of(null as any));
      public commit$: jest.Mock<Observable<void>> = jest.fn(() => of(null as any));
      public rollback$: jest.Mock<Observable<void>> = jest.fn(() => of(null as any));
      public disconnect: jest.Mock<void> = jest.fn();
    }

    let client: ClientMock;
    let params: { sqlPath: string; placeHolder: string[]; client: ClientMock };

    beforeEach(() => {
      client = new ClientMock();
      params = {
        client,
        sqlPath: "sqlPath",
        placeHolder: ["$1", "$2"],
      };
    });

    it("should call queryByFile$", () => {
      // arrange
      jest.spyOn(client, "queryByFile$");

      const expected = {
        sqlPath: params.sqlPath,
        placeHolder: params.placeHolder,
      };

      // act
      return service
        .transactBySql$(params.client, params.sqlPath, params.placeHolder)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => expect(client.queryByFile$).toHaveBeenCalledWith(expected.sqlPath, expected.placeHolder));
    });

    it("should return null when response.count is 1", () => {
      // arrange

      jest.spyOn(client, "queryByFile$").mockReturnValue(
        of({
          count: 1,
          records: [],
        }),
      );
      const expected = null;

      // act
      return service
        .transactBySql$(params.client, params.sqlPath, params.placeHolder)
        .toPromise()
        .then((response) => expect(response).toEqual(expected))
        .catch(() => fail("test error"));
    });

    it("should return error when response.count is not 1", () => {
      // arrange

      jest.spyOn(client, "queryByFile$").mockReturnValue(
        of({
          count: 0,
          records: [],
        }),
      );

      const expected = {
        code: 500,
      };

      // act
      return service
        .transactBySql$(params.client, params.sqlPath, params.placeHolder)
        .toPromise()
        .then(() => fail("test error"))
        .catch((err) => {
          expect(err.code).toEqual(expected.code);
          expect(err.message).not.toBeUndefined();
        });
    });

    it("should return error when query failed", () => {
      // arrange
      const error = Error("");
      jest.spyOn(client, "queryByFile$").mockReturnValue(throwError(error));
      loggerService.error = jest.fn();

      // act
      return service
        .transactBySql$(params.client, params.sqlPath, params.placeHolder)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          expect(loggerService.error).toHaveBeenCalled();
        });
    });
  });
});
