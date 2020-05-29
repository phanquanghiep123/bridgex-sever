import { Injectable } from "@nestjs/common";
import { of, Observable, race, fromEvent, throwError } from "rxjs";
import { take, switchMap, catchError, finalize, mergeMap, map } from "rxjs/operators";
import _fs from "fs";
import _path from "path";
import JSZip from "jszip";

import { ZipParams, ZipError, EZipError } from "./zip.service.i";
import { LoggerService } from "../logger";
import { ErrorCode } from "../utils";

// ------------------------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
// ------------------------------------------------

@Injectable()
export class ZipService {
  public constructor(public logger: LoggerService) {}

  public zip$(params: ZipParams): Observable<string> {
    this.logger.info(`Start to zip the specified files`);

    return of(params).pipe(
      mergeMap(() => this.guardSrcFile$(params.files)),
      mergeMap(() => this.guardDstFile$(params.dstDir, params.dstFileName)),
      map(() => ({
        zipObj: this.getJszip(params.files),
        dstFile: path.join(params.dstDir, params.dstFileName),
      })),
      mergeMap((input: { zipObj: JSZip; dstFile: string }) => this.pack$(input.zipObj, input.dstFile)),
      catchError((e) => {
        return throwError(ErrorCode.categorize(e));
      }),
    );
  }

  public guardSrcFile$(srcFiles: string[]): Observable<null> {
    try {
      if (srcFiles.length === 0) {
        this.logger.error(`zipPack src-file not specified`);
        return throwError(new ZipError(EZipError.SRC_FILE_NOT_SPECIFIED));
      }

      const isCorrect = srcFiles.reduce((p: boolean, srcFile: string) => {
        if (fs.existsSync(srcFile)) {
          return p && true;
        } else {
          this.logger.error(`zipPack src-file not found`, srcFile);
          return false;
        }
      }, true);
      if (isCorrect) {
        return of(null);
      } else {
        return throwError(new ZipError(EZipError.SRC_FILE_NOT_FOUND));
      }
    } catch (err) {
      return throwError(new ZipError(EZipError.UNKNOWN, err));
    }
  }

  public guardDstFile$(dstDir: string, dstFileName: string): Observable<string> {
    try {
      if (!fs.existsSync(dstDir)) {
        return throwError(new ZipError(EZipError.DST_DIRECTORY_NOT_FOUND, { dstDir: `${dstDir}` }));
      }

      const dstFile = path.join(dstDir, dstFileName);
      if (fs.existsSync(dstFile)) {
        return throwError(new ZipError(EZipError.DST_FILE_ALREADY_EXIST, { dstFile: `${dstFile}` }));
      }

      return of(dstFile);
    } catch (err) {
      return throwError(new ZipError(EZipError.UNKNOWN, err));
    }
  }

  public getJszip(files: string[]): JSZip {
    const zipFile = new JSZip();

    try {
      files.reduce((p: any, file: string) => {
        return p.file(path.basename(file), fs.readFileSync(file));
      }, zipFile);
    } catch (err) {
      throw err;
    }

    return zipFile;
  }

  public pack$(zipFile: JSZip, dstFileName: string): Observable<string> {
    const readableStream: NodeJS.ReadableStream = zipFile.generateNodeStream({ type: "nodebuffer", streamFiles: true });
    const writeStream: _fs.WriteStream = fs.createWriteStream(path.join(dstFileName));
    const pipedStream: _fs.WriteStream = readableStream.pipe(writeStream);

    const processing$ = race(
      fromEvent(pipedStream, "finish").pipe(
        take(1),
        switchMap(() => {
          this.logger.info(`zipPack return finish : ${dstFileName}`);
          return of(dstFileName);
        }),
      ),
      fromEvent(pipedStream, "error").pipe(
        take(1),
        switchMap((e) => {
          this.logger.error(`zipPack return error : ${dstFileName}}`, e);
          return throwError(new ZipError(EZipError.ZIP_FAILD, { dstFile: `${dstFileName}` }));
        }),
      ),
    ).pipe(
      finalize(() => {
        try {
          if (!pipedStream.destroyed) {
            pipedStream.destroy();
          } else {
          }
        } catch {}
        try {
          if (!writeStream.destroyed) {
            writeStream.destroy();
          } else {
          }
        } catch {}
      }),
    );

    return processing$;
  }
}
