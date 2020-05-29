import { PoolConfig, Pool } from "pg";
import { Subject, Observable, of, throwError } from "rxjs";

import { IConnectionPool, IClient } from "./postgres.service.i";
import { Client, ErrorCode } from "./client";
import { logger } from "../logger/logger.service";
import { catchError, map, mergeMap } from "rxjs/operators";

/**
 * ConnectionPool handler for postgres.
 * This is most likely the wrapper for pg.Pool to use Observable.
 */
export class ConnectionPool implements IConnectionPool {
  public pool: Pool;
  public config?: PoolConfig;
  public teardown$: Subject<any>;

  /**
   * Initializes this class instance
   * @param config connection string or config object.
   * @param poolMock this is for unit testing.
   */
  constructor(config?: PoolConfig | string, poolMock?: any) {
    if (typeof config === "string") {
      config = { connectionString: config };
    }

    this.config = config;
    this.pool = poolMock || new Pool(this.config);
    this.teardown$ = new Subject<any>();
  }

  /**
   * get an client from connection pool to start transaction
   */
  public connect$(): Observable<IClient> {
    this.pool = this.pool || new Pool(this.config);
    return of(1).pipe(
      mergeMap(() => this.pool.connect()),
      map((client) => new Client(client)),
      catchError((error) => {
        logger.error("Postgres: Failed to connect", { error });
        return throwError(ErrorCode.categorize(error));
      }),
    );
  }
}
