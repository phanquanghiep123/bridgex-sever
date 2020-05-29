import { Observable } from "rxjs";

export interface IConnectionPool {
  /**
   * get an client from connection pool to start transaction
   */
  connect$(): Observable<IClient>;
}

/**
 * Query execution interface
 */
export interface IClient {
  query$<T>(sql: string, queryParams?: any[]): Observable<IClientResponse<T>>;
  queryByFile$<T>(filepath: string, queryParams?: any[]): Observable<IClientResponse<T>>;
  beginTrans$(): Observable<void>;
  commit$(): Observable<void>;
  rollback$(): Observable<void>;
  disconnect(err?: any): void;
}

export interface IClientResponse<T> {
  count: number;
  records: T[];
}
