import { promisify } from "util";
import fs from "fs";
import pg from "pg";
import { Observable, of, throwError, from } from "rxjs";
import { tap, mergeMap, map, catchError } from "rxjs/operators";

import { IClient, IClientResponse } from "./postgres.service.i";
import { logger } from "../logger/logger.service";

export const externals = {
  readFile: promisify(fs.readFile),
};

export class PostgresError implements Error {
  public readonly name = PostgresError.name;
  constructor(public code: number, public message: string, public originalError?: any) {}

  public toString(): string {
    return `${this.name}: ${this.code} ${this.message}`;
  }
}

export class ErrorCode {
  public static readonly BAD_REQUEST = 400;
  public static readonly FORBIDDEN = 403;
  public static readonly NOT_FOUND = 404;
  public static readonly CONFLICT = 409;
  public static readonly INTERNAL = 500;

  public static categorize(err: any) {
    if (err instanceof PostgresError) {
      return err;
    }

    switch (true) {
      case /^23505.*$/i.test(err.code):
        return new PostgresError(this.CONFLICT, "Already registered", err);
      case /^23.*$/i.test(err.code):
        return new PostgresError(this.BAD_REQUEST, "Constraint violation", err);
      case /^22.*$/i.test(err.code):
        return new PostgresError(this.BAD_REQUEST, "Invalid parameters", err);
    }
    return new PostgresError(this.INTERNAL, `Unexpected error`, err);
  }
}

/**
 * ConnectionPool handler for postgres.
 * This is most likely the wrapper for pg.Pool to use Observable.
 */
export class Client implements IClient {
  constructor(private client: pg.PoolClient) {}

  public query$<T>(sql: string, queryParams: any[] = []): Observable<IClientResponse<T>> {
    return of(
      sql
        .replace(/(\r\n|\n|\r)/gm, " ")
        .replace(/\s+/g, " ")
        .trim(),
    ).pipe(
      tap((query) => logger.info("Postgres: Trying to access to the database", { query, queryParams })),
      mergeMap((query) => this.client.query(query, queryParams)),
      map((res) => ({
        count: res.rowCount || 0,
        records: res.rows || ([] as T[]),
      })),
      tap((res) => logger.info("Postgres: Got response from database", res)),
      catchError((error) => {
        logger.error("Postgres: Failed to query", { error });
        return throwError(ErrorCode.categorize(error));
      }),
    );
  }

  public queryByFile$<T>(filepath: string, queryParams: any[] = []): Observable<IClientResponse<T>> {
    return from(externals.readFile(filepath)).pipe(
      mergeMap((sql: Buffer) => this.query$<T>(sql.toString(), queryParams)),
      catchError((error) => {
        logger.error("Postgres: Failed to connect", { error });
        return throwError(ErrorCode.categorize(error));
      }),
    );
  }

  public beginTrans$(): Observable<void> {
    return this.query$("BEGIN").pipe(map(() => undefined));
  }

  public commit$(): Observable<void> {
    return this.query$("COMMIT").pipe(map(() => undefined));
  }

  public rollback$(): Observable<void> {
    return this.query$("ROLLBACK").pipe(map(() => undefined));
  }

  public disconnect(err?: any): void {
    try {
      this.client.release(err);
    } catch (error) {
      logger.warn("Postgres: Failed to disconnect", { error });
    }
  }
}
