import { Injectable, HttpService } from "@nestjs/common";

import { AxiosResponse, AxiosRequestConfig } from "axios";

import { Observable, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";

import { LoggerService } from "../logger/logger.service";

/**
 * This service wraps HttpModule of Nestjs to request by using the HTTP protocol.
 */
@Injectable()
export class HttpClientService {
  public static requestCount = 0;

  public constructor(private readonly http: HttpService, private logger: LoggerService) {}

  public get$<T>(path: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    const count = ++HttpClientService.requestCount;
    this.logger.info(`(${count}) GET ${path}`);

    return this.http.get<T>(path, config).pipe(
      tap(() => this.logger.info(`(${count}) success GET ${path}`)),
      catchError((e) => {
        this.logger.error(`(${count}) failure GET ${path}`);
        return throwError(e);
      }),
    );
  }

  public post$<T>(path: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    const count = ++HttpClientService.requestCount;
    this.logger.info(`(${count}) POST ${path}`);

    return this.http.post<T>(path, data, config).pipe(
      tap(() => this.logger.info(`(${count}) success POST ${path}`)),
      catchError((e) => {
        this.logger.error(`(${count}) failure POST ${path}`);
        return throwError(e);
      }),
    );
  }

  public delete$<T>(path: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    const count = ++HttpClientService.requestCount;
    this.logger.info(`(${count}) DELETE ${path}`);

    return this.http.delete<T>(path, config).pipe(
      tap(() => this.logger.info(`(${count}) success DELETE ${path}`)),
      catchError((e) => {
        this.logger.error(`(${count}) failure DELETE ${path}`);
        return throwError(e);
      }),
    );
  }
}
