import { Injectable, InternalServerErrorException } from "@nestjs/common";

import Client from "ftp";
import * as o from "rxjs";
import * as op from "rxjs/operators";
import fs, { PathLike } from "fs";

import { LoggerService } from "../logger";
import { ConfigService } from "../config";
import { ErrorCode } from "../postgres/client";
import { BridgeXServerError } from "../utils/error";

export const externals = {
  createClient: () => new Client(),
};

@Injectable()
export class FtpClientService {
  constructor(public config: ConfigService, public logger: LoggerService) {}

  public putFile$(dstFileName: string, srcFilePath: string): o.Observable<null> {
    return o.of(srcFilePath).pipe(
      op.switchMap(() => {
        return o
          .from(fs.promises.readFile(srcFilePath, null))
          .pipe(op.catchError((error) => o.throwError(new BridgeXServerError(ErrorCode.INTERNAL, error))));
      }),
      op.switchMap((buffer: Buffer) => this.putObject$(dstFileName, buffer)),
      op.catchError((err) => {
        return o.throwError(ErrorCode.categorize(err));
      }),
    );
  }

  public getObjectStream$(objectName: string): o.Observable<NodeJS.ReadableStream> {
    const client: Client = externals.createClient();
    const options = this.config.ftpClientConfig();

    try {
      client.connect(options);
    } catch (err) {
      const errorMessage = "FtpClientService cannot connect to FTP Server.";
      this.logger.error(errorMessage, { error: err, options });
      return o.throwError(new InternalServerErrorException(errorMessage));
    }

    const get$ = o.bindNodeCallback<string, NodeJS.ReadableStream>(client.get.bind(client));
    const logout$ = o.bindCallback<Error>(client.logout.bind(client));

    return o
      .race(o.fromEvent(client, "ready").pipe(op.take(1)), o.fromEvent(client, "error").pipe(op.switchMap((ev) => o.throwError(ev))))
      .pipe(
        op.tap(() => this.logger.info("FtpClientService connected to " + options.host, options)),
        op.switchMap(() => get$(objectName)),
        op.tap((stream: NodeJS.ReadableStream) =>
          stream.on("end", () => {
            logout$().subscribe((err) => {
              this.logger.info(`${err}`);
              client.end();
            });
          }),
        ),
        op.catchError((err: any) => {
          const errorMessage = "FtpClientService getObject$ error";
          this.logger.error(errorMessage, { error: err });
          return o.throwError(new InternalServerErrorException(errorMessage));
        }),
      );
  }

  public saveStreamInFile$(
    stream: NodeJS.ReadableStream,
    path: string,
    writeFile: (path: PathLike | number, data: any, callback: (err: NodeJS.ErrnoException | null) => void) => void,
  ): o.Observable<any> {
    return o
      .race(
        o.fromEvent(stream, "data").pipe(
          op.concatMap((data: any) => o.bindNodeCallback(writeFile)(path, data)),
          op.catchError((e: any) => {
            stream.emit("close");
            return o.throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Failed to save file", e));
          }),
          op.filter(() => false),
        ),
        o.fromEvent(stream, "error").pipe(
          op.map((e) => {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "stream emited error", e);
          }),
        ),
        o.fromEvent(stream, "end"),
      )
      .pipe(op.take(1));
  }

  public putObject$(objectName: string, data: Buffer): o.Observable<null> {
    const client: Client = externals.createClient();
    const options = this.config.ftpClientConfig();

    try {
      client.connect(options);
    } catch (err) {
      const errorMessage = "FtpClientService cannot connect to FTP Server.";
      this.logger.error(errorMessage, { error: err, options });
      return o.throwError(new InternalServerErrorException(errorMessage));
    }

    const mkdir$ = o.bindCallback<string, boolean, any>(client.mkdir.bind(client));
    const put$ = o.bindCallback<Buffer, string, Error>(client.put.bind(client));
    const logout$ = o.bindCallback<Error>(client.logout.bind(client));

    return o
      .race(o.fromEvent(client, "ready").pipe(op.take(1)), o.fromEvent(client, "error").pipe(op.switchMap((ev) => o.throwError(ev))))
      .pipe(
        op.tap(() => this.logger.info("FtpClientService connected to " + options.host, options)),
        op.switchMap(() => {
          const i = objectName.lastIndexOf("/");
          return i < 0 ? o.of("") : mkdir$(objectName.slice(0, i), true).pipe(op.catchError(() => objectName.slice(0, i)));
        }),
        op.tap((d) => this.logger.info("FtpClientService mkdir$ finish: " + d)),
        op.switchMap(() => put$(data, objectName)),
        op.tap((d) => this.logger.info("FtpClientService put$ finish: ", d)),
        op.switchMap(() => logout$()),
        op.catchError((err: any) => {
          const errorMessage = "FtpClientService putObject$ error.";
          this.logger.error(errorMessage, { error: err });
          return o.throwError(new InternalServerErrorException(errorMessage));
        }),
        op.map(() => null),
        op.finalize(() => client.end()),
      );
  }

  public deleteObject$(objectName: string): o.Observable<null> {
    const client: Client = externals.createClient();
    const options = this.config.ftpClientConfig();

    try {
      client.connect(options);
    } catch (err) {
      const errorMessage = "FtpClientService cannot connect to FTP Server.";
      this.logger.error(errorMessage, { error: err, options });
      return o.throwError(new InternalServerErrorException(errorMessage));
    }

    const delete$ = o.bindCallback<string, boolean, any>(client.rmdir.bind(client));
    const logout$ = o.bindCallback<Error>(client.logout.bind(client));

    return o
      .race(o.fromEvent(client, "ready").pipe(op.take(1)), o.fromEvent(client, "error").pipe(op.switchMap((ev) => o.throwError(ev))))
      .pipe(
        op.tap(() => this.logger.info("FtpClientService connected to " + options.host, options)),
        op.switchMap(() => {
          const i = objectName ? objectName.lastIndexOf("/") : -1;
          return i < 0 ? o.of("") : delete$(objectName.slice(0, i), true);
        }),
        op.tap((d) => this.logger.info("FtpClientService rmdir$ finish: " + d)),
        op.switchMap(() => logout$()),
        op.tap(() => this.logger.info("FtpClientService succeeded to delete")),
        op.catchError((err: any) => {
          const errorMessage = "FtpClientService deleteObject$ error";
          this.logger.error(errorMessage, { error: err });
          return o.throwError(new InternalServerErrorException(errorMessage));
        }),
        op.map(() => null),
        op.finalize(() => client.end()),
      );
  }

  public convertUrlToFTPKey(url: string): string {
    return url
      .replace(/(.+):\/\//, "") // remove protocol
      .replace(/(^.+?)(\/)/, ""); // remove host and port
  }
}
