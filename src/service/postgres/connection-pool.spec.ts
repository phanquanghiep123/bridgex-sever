jest.mock("pg").mock("../utils");

import pg from "pg";
import { ConnectionPool } from "./connection-pool";
import { PostgresError, Client } from "./client";

describe("ConectionPool", () => {
  let poolMock: jest.Mocked<pg.Pool>;

  beforeEach(() => {
    poolMock = new pg.Pool() as jest.Mocked<pg.Pool>;
    (pg.Pool.prototype.constructor as jest.Mock).mockImplementation(() => poolMock);
    (pg.Pool.prototype.connect as jest.Mock).mockResolvedValue(new pg.Client());
    (pg.Pool.prototype.end as jest.Mock).mockResolvedValue(undefined);
  });

  describe("init", () => {
    test("should set config from args as is", () => {
      // arrange
      const expected = { host: "somewhat" };

      // act
      const actual = new ConnectionPool(expected);

      // assert
      expect(actual.config).toBe(expected);
    });

    test("should set config from connection string", () => {
      // arrange
      const connectionString = "somewhatstring";
      const expected = { connectionString };

      // act
      const actual = new ConnectionPool(connectionString);

      // assert
      expect(actual.config).toEqual(expected);
    });
  });

  describe("connect()", () => {
    test("should return client instance to observer", (done) => {
      // arrange
      const config = { host: "somewhat" };
      const target = new ConnectionPool(config);

      // act
      const actual$ = target.connect$();

      // assert
      actual$.subscribe({
        next: (actual) => expect(actual).toBeInstanceOf(Client),
        error: (err) => fail(err),
        complete: () => done(),
      });
    });

    test("should return error", (done) => {
      // arrange
      const config = { host: "somewhat" };
      const target = new ConnectionPool(config);
      const error = new Error("help me");
      poolMock.connect.mockImplementation(() => {
        throw error;
      });
      target.pool = undefined;

      // act
      const actual$ = target.connect$();

      // assert
      actual$.subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(PostgresError);
          done();
        },
        complete: () => fail(),
      });
    });
  });
});
