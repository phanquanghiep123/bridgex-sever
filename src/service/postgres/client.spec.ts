jest.mock("pg").mock("../utils");

import pg from "pg";
import { of, throwError, Observable } from "rxjs";
import { Client, externals, PostgresError, ErrorCode } from "./client";
import { logger } from "../logger/logger.service";

describe("Client", () => {
  let target: Client;
  let clientMock: jest.Mocked<pg.PoolClient>;

  beforeEach(() => {
    clientMock = { ...new pg.Client(), release: jest.fn() } as any;
    jest.spyOn(externals, "readFile").mockResolvedValue("some file");
  });

  beforeEach(() => {
    target = new Client(clientMock);
  });

  describe("query()", () => {
    const sql = "select * from bar;";
    const params = ["aa", "bb", 123];
    const result = [{ some: "thing", like: "a", food: 2 }];

    test("should call client.query with expected params", (done) => {
      // arrange
      clientMock.query = jest.fn().mockResolvedValueOnce({ rows: result });

      // act
      target.query$(sql, params).subscribe({
        // assert
        error: (err) => fail(err),
        complete: () => {
          expect(clientMock.query).toBeCalledWith(sql, params);
          done();
        },
      });
    });

    test("should call client.query with default queryParams", (done) => {
      // arrange
      clientMock.query = jest.fn().mockResolvedValueOnce({ rows: result });

      // act
      target.query$(sql).subscribe({
        // assert
        error: (err) => fail(err),
        complete: () => {
          expect(clientMock.query).toBeCalledWith(sql, []);
          done();
        },
      });
    });

    test("should return expected result", (done) => {
      // arrange
      const expected = { records: result, count: result.length };
      clientMock.query = jest.fn().mockResolvedValueOnce({
        rows: result,
        rowCount: result.length,
      });

      // act
      target
        .query$(sql, params)
        // assert
        .subscribe(
          (actual) => expect(actual).toEqual(expected),
          (err) => fail(err),
          () => done(),
        );
    });

    test("should return default value if query result is invalid", (done) => {
      // arrange
      const expected = { records: [], count: 0 };
      clientMock.query = jest.fn().mockResolvedValueOnce({});

      // act
      target
        .query$(sql, params)
        // assert
        .subscribe(
          (actual) => expect(actual).toEqual(expected),
          (err) => fail(err),
          () => done(),
        );
    });

    test("should be error if query failure", (done) => {
      // arrange
      const expected = "error dayo";
      clientMock.query = jest.fn().mockRejectedValueOnce(expected);

      // act
      return (
        target
          .query$(sql, params)
          // assert
          .subscribe(
            (data) => fail(data),
            (err) => {
              expect(err).toBeInstanceOf(PostgresError);
              expect((err as PostgresError).originalError).toEqual(expected);
              done();
            },
            () => expect(clientMock.query).toHaveBeenCalledWith(sql, params),
          )
      );
    });
  });

  describe("queryByFile$", () => {
    const sql = "select * from bar;";
    const buffer = Buffer.from(sql);
    const params = ["aa", "bb", 123];
    const result = [{ some: "thing", like: "a", food: 2 }];

    test("should call target.query with expected params", (done) => {
      // arrange
      const expected = "/path/to/file";
      (externals.readFile as jest.Mock).mockResolvedValueOnce(buffer);
      jest.spyOn(target, "query$").mockReturnValueOnce(of({ client: target, result }) as Observable<any>);

      // act
      target.queryByFile$(expected, params).subscribe({
        // assert
        error: (err) => fail(err),
        complete: () => {
          expect(externals.readFile).toHaveBeenCalledWith(expected);
          done();
        },
      });
    });

    test("should call target.query with default queryParams", (done) => {
      // arrange
      const expected = "/path/to/file";
      (externals.readFile as jest.Mock).mockResolvedValueOnce(buffer);
      jest.spyOn(target, "query$").mockReturnValueOnce(of({ count: 1, records: result }));

      // act
      target.queryByFile$(expected).subscribe({
        // assert
        error: (err) => fail(err),
        complete: () => {
          expect(externals.readFile).toHaveBeenCalledWith(expected);
          done();
        },
      });
    });

    test("should return expected result", (done) => {
      // arrange
      const expected = { count: 1, records: result };
      (externals.readFile as jest.Mock).mockResolvedValueOnce(buffer);
      jest.spyOn(target, "query$").mockReturnValueOnce(of(expected));

      // act
      target
        .queryByFile$("/path/to/file", params)
        // assert
        .subscribe({
          next: (actual) => expect(actual).toEqual(expected),
          error: (err) => fail(err),
          complete: () => {
            expect(target.query$).toHaveBeenCalledWith(sql, params);
            done();
          },
        });
    });

    test("should be error if query failure", (done) => {
      // arrange
      const error = "error dayo";
      (externals.readFile as jest.Mock).mockResolvedValueOnce(buffer);
      jest.spyOn(target, "query$").mockReturnValueOnce(throwError(error));

      // act
      target
        .queryByFile$("/path/to/file", params)
        // assert
        .subscribe({
          next: (data) => fail(data),
          error: (err) => {
            expect(err).toBeInstanceOf(PostgresError);
            expect(target.query$).toHaveBeenCalledWith(sql, params);
            done();
          },
          complete: () => fail(),
        });
    });
  });

  describe("begin()", () => {
    test("should call client.query with expected params", (done) => {
      // arrange
      jest.spyOn(target, "query$").mockReturnValueOnce(of({ count: 0, records: [] }));

      // act
      target.beginTrans$().subscribe({
        // assert
        error: (err) => fail(err),
        complete: () => {
          expect(target.query$).toHaveBeenCalledWith("BEGIN");
          done();
        },
      });
    });

    test("should return client", (done) => {
      // arrange
      const stub = jest.fn();
      const expected = undefined;
      jest.spyOn(target, "query$").mockReturnValueOnce(of({ count: 0, records: [] }));

      // act
      target
        .beginTrans$()
        // assert
        .subscribe({
          next: (actual) => stub(actual),
          error: (err) => fail(err),
          complete: () => {
            expect(stub).toHaveBeenCalledTimes(1);
            expect(stub).toHaveBeenCalledWith(expected);
            done();
          },
        });
    });
  });

  describe("commtest()", () => {
    test("should call client.query with expected params", (done) => {
      // arrange
      jest.spyOn(target, "query$").mockReturnValueOnce(of({ count: 0, records: [] }));

      // act
      target.commit$().subscribe({
        // assert
        error: (err) => fail(err),
        complete: () => {
          expect(target.query$).toHaveBeenCalledWith("COMMIT");
          done();
        },
      });
    });

    test("should return client", (done) => {
      // arrange
      const stub = jest.fn();
      const expected = undefined;
      jest.spyOn(target, "query$").mockReturnValueOnce(of({ count: 0, records: [] }));

      // act
      target
        .commit$()
        // assert
        .subscribe({
          next: (actual) => stub(actual),
          error: (err) => fail(err),
          complete: () => {
            expect(stub).toHaveBeenCalledTimes(1);
            expect(stub).toHaveBeenCalledWith(expected);
            done();
          },
        });
    });
  });

  describe("rollback()", () => {
    test("should call client.query with expected params", (done) => {
      // arrange
      jest.spyOn(target, "query$").mockReturnValueOnce(of({ count: 0, records: [] }));

      // act
      target.rollback$().subscribe({
        // assert
        error: (err) => fail(err),
        complete: () => {
          expect(target.query$).toHaveBeenCalledWith("ROLLBACK");
          done();
        },
      });
    });

    test("should return client", (done) => {
      // arrange
      const stub = jest.fn();
      const expected = undefined;
      jest.spyOn(target, "query$").mockReturnValueOnce(of({ count: 0, records: [] }));

      // act
      target
        .rollback$()
        // assert
        .subscribe({
          next: (actual) => stub(actual),
          error: (err) => fail(err),
          complete: () => {
            expect(stub).toHaveBeenCalledTimes(1);
            expect(stub).toHaveBeenCalledWith(expected);
            done();
          },
        });
    });
  });

  describe("disconnect()", () => {
    test("should call client.disconnect with expected params", () => {
      // arrange
      const expected = "error dayo";

      // act
      target.disconnect(expected);

      // assert
      expect(clientMock.release).toHaveBeenCalledWith(expected);
    });

    test("should call client.disconnect without args", () => {
      // arrange
      clientMock.release = jest.fn().mockResolvedValueOnce(undefined);

      // act
      target.disconnect();

      // assert
      expect(clientMock.release).toHaveBeenCalledWith(undefined);
    });

    test("should return error", () => {
      // arrange
      const error = new Error("help me");
      clientMock.release.mockImplementation(() => {
        throw error;
      });
      logger.warn = jest.fn();

      // act
      target.disconnect();

      // assert
      expect(logger.warn).toHaveBeenCalledWith("Postgres: Failed to disconnect", { error });
    });
  });
});

describe("PostgresError", () => {
  describe("toString()", () => {
    test("should return expected string", () => {
      // arrage
      const expected = "PostgresError: 123 one two three";
      // act
      const actual = new PostgresError(123, "one two three", {
        hoge: "fuga",
      }).toString();
      // assert
      expect(actual).toEqual(expected);
    });
  });
});

describe("ErrorCode", () => {
  describe("categorize()", () => {
    test("should return argument as-is if argument is instance of DeviceBridgeXServerError", () => {
      // arrage
      const expected = new PostgresError(ErrorCode.NOT_FOUND, "device service error des");

      // act
      const actual = ErrorCode.categorize(expected);

      // assert
      expect(actual).toBe(expected);
    });

    // ----------------------
    // test switch statement
    [
      { code: ErrorCode.CONFLICT, originalCode: "23505" },
      { code: ErrorCode.BAD_REQUEST, originalCode: "23503" },
      { code: ErrorCode.BAD_REQUEST, originalCode: "23000" },
      { code: ErrorCode.BAD_REQUEST, originalCode: "22xxx" },
      { code: ErrorCode.BAD_REQUEST, originalCode: "22546" },
      { code: ErrorCode.INTERNAL, originalCode: "21546" },
      { code: ErrorCode.INTERNAL, originalCode: "08000" },
      { code: ErrorCode.INTERNAL, originalCode: null },
      { code: ErrorCode.INTERNAL },
    ].forEach((c) => {
      test(`should return error code ${c.code} if original error.code is ${c.originalCode} `, () => {
        // arrage
        const error = { code: c.originalCode };
        const expected = c.code;

        // act
        const target = ErrorCode.categorize(error);
        const actual = target.code;

        // assert
        expect(actual).toBe(expected);
      });
    });
  });
});
