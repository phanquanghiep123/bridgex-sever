import { Injectable, LoggerService as JestLoggerService } from "@nestjs/common";
import * as bunyan from "bunyan";
import { Observer, fromEvent, Subject } from "rxjs";
import { Handler } from "express";
import { toArray, takeUntil, take, map } from "rxjs/operators";

export interface IWriter {
  trace: (params: any, msg: string) => void;
  debug: (params: any, msg: string) => void;
  info: (params: any, msg: string) => void;
  warn: (params: any, msg: string) => void;
  error: (params: any, msg: string) => void;
  fatal: (params: any, msg: string) => void;
}

@Injectable()
export class LoggerService implements JestLoggerService {
  public writer: IWriter;

  constructor() {
    this.writer = bunyan.createLogger({ name: "Bridge-X server", level: "trace" });
  }

  public log(message: any, params: any = {}) {
    this.writer.info(params, message);
  }

  public verbose(message: any, params: any = {}): void {
    this.writer.trace(params, message);
  }

  public trace(message: string, params: any = {}): void {
    this.writer.trace(params, message);
  }

  public debug(message: string, params: any = {}): void {
    this.writer.debug(params, message);
  }

  public info(message: string, params: any = {}): void {
    this.writer.info(params, message);
  }

  public warn(message: string, params: any = {}): void {
    this.writer.warn(params, message);
  }

  public error(message: string, params: any = {}): void {
    this.writer.error(params, message);
  }

  public fatal(message: string, params: any = {}): void {
    this.writer.fatal(params, message);
  }

  public createLoggingObserver = (message: string, writer?: LoggerService): Observer<any> => {
    return {
      next: (data) => (writer || this).debug(message + " :next", data),
      error: (err) => (writer || this).error(message + " :error", { error: err }),
      complete: () => (writer || this).debug(message + " :complete"),
    };
  };

  public safeParseJson(str: string): string | object {
    try {
      return JSON.parse(str || "");
    } catch {
      return str;
    }
  }

  public requestLogger(isDebug = false): Handler {
    let cyclic = 0;

    return (req, res, next) => {
      const startTime = Date.now();
      const reqNumber = cyclic < 10000 ? cyclic++ : 0;
      const { url, method, query, params, headers } = req;

      this.info(`Router(${reqNumber}) HTTP ${method}: ${url} - request`, { url, method, query, params, headers });

      const resBody$ = new Subject<string>();

      // -------------------------
      // for debug
      // -------------------------
      if (isDebug) {
        fromEvent(req, "data")
          .pipe(
            takeUntil(fromEvent(req, "end").pipe(take(1))),
            toArray(),
            map((values) => values.join("")),
            map((body) => this.safeParseJson(body)),
          )
          .subscribe((body) => this.info(`Router(${reqNumber}) HTTP ${method}: ${url} - request body`, { body }));

        // -------------------------
        // Spy res.send()
        (() => {
          const org = res.send;
          res.send = (data: any) => {
            if (Buffer.isBuffer(data)) {
              resBody$.next(data.toString("utf8"));
            } else if (typeof data === "string") {
              resBody$.next(data);
            } else {
              resBody$.next(JSON.stringify(data));
            }
            return org.apply(res, [data]);
          };
        })();
      }

      // -------------------------
      // Spy res.end()
      // -------------------------
      (() => {
        const org = res.end;
        res.end = (...args: any) => {
          resBody$.complete();
          org.apply(res, args);
        };
      })();

      resBody$
        .pipe(
          toArray(),
          map((values) => this.safeParseJson(values.join(""))),
        )
        .subscribe((body) => {
          const length = res.getHeader("content-length");
          const { statusCode, statusMessage } = res;
          const responseHeaders = res.getHeaders();
          const duration = Date.now() - startTime;
          const message = `Router(${reqNumber}) HTTP  ${method}: ${url} - response ${statusCode}${
            statusMessage ? ":" + statusMessage : ""
          } ${length ? length + "bytes" : "-"} ${duration}ms`;
          const param = {
            body,
            headers: responseHeaders,
            request: { url, method },
          };

          if (statusCode < 200 || 500 <= statusCode) {
            this.error(message, param);
          } else if (400 <= statusCode) {
            this.warn(message, param);
          } else {
            this.info(message, param);
          }
        });

      // -------------------------

      next();
    };
  }
}

export const logger = new LoggerService();
