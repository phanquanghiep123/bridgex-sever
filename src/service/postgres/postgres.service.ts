import { PoolConfig } from "pg";
import { Injectable, OnModuleDestroy } from "@nestjs/common";

import { LoggerService } from "../logger";
import { IConnectionPool, IClient } from "./postgres.service.i";
import { ConnectionPool } from "./connection-pool";
import { Observable, throwError, of } from "rxjs";
import { BridgeXServerError } from "../utils";
import { tap, catchError, mergeMap, map, finalize } from "rxjs/operators";
import { PostgresConfig } from "../../environment/postgres";
import { ErrorCode } from "./client";

@Injectable()
export class PostgresService implements OnModuleDestroy {
  public constructor(public logger: LoggerService) {}
  private disconnected = false;

  public pools: {
    [x: string]: { key: string; pool: ConnectionPool };
  } = {};

  public onModuleDestroy() {
    if (this.disconnected === true) {
      return;
    }
    this.disconnected = true;

    Object.values(this.pools).forEach((obj) => {
      return obj.pool.pool
        .end()
        .then(() => this.logger.info("Succeeded to disconnect with DB"))
        .catch(() => this.logger.error("Failed to disconnect with DB"));
    });
  }

  public createPool(config?: PoolConfig | string) {
    return new ConnectionPool(config);
  }

  /**
   * Get the connection pool instance by PoolConfig.
   * If not exist, create and return new instance by config object/string.
   * @param config connection string or config object.
   */
  public get(config: PoolConfig | string): IConnectionPool {
    const key = JSON.stringify(config);

    if (!this.pools[key]) {
      const pool = this.createPool(config);
      this.pools[key] = { key, pool };
    }

    return this.pools[key].pool;
  }

  public getClient$(postgresConfig: PostgresConfig): Observable<IClient> {
    const pool = this.get(postgresConfig);
    if (!pool) {
      this.logger.info("Failed to connect to DB pool");
      return throwError(new BridgeXServerError(500, "Failed to connect to DB pool"));
    }
    this.logger.info("Succeded to create pool");

    return pool.connect$().pipe(
      tap(() => this.logger.info("Succeded to create connection to DB")),
      catchError((e) => {
        this.logger.error("Failed to connect DB");
        return throwError(e);
      }),
    );
  }

  public controlTransaction$<T>(postgresConfig: PostgresConfig, transaction$: (client: IClient) => Observable<T>): Observable<T> {
    return of(null).pipe(
      mergeMap(() => this.getClient$(postgresConfig)),
      tap(() => this.logger.trace("begin transaction with DB")),
      mergeMap((client: IClient) =>
        client.beginTrans$().pipe(
          mergeMap(() => transaction$(client)),
          mergeMap((data) => client.commit$().pipe(map(() => data))),
          catchError((err) => client.rollback$().pipe(mergeMap(() => throwError(err)))),
          finalize(() => client.disconnect()),
        ),
      ),
    );
  }

  public transactBySql$(client: IClient, sqlPath: string, placeHolder: any[]) {
    return client.queryByFile$(sqlPath, placeHolder).pipe(
      map((response) => {
        if (response.count === 1) {
          return null;
        }
        throw new BridgeXServerError(500, "Error occured in transacting");
      }),
      catchError((e) => {
        this.logger.error(e);
        return throwError(ErrorCode.categorize(e));
      }),
    );
  }
}
