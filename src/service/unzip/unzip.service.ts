import { Injectable } from "@nestjs/common";
import unzip from "unzip-stream";
import fs from "fs";
import { Observable, throwError, Subject, race } from "rxjs";
import { map, finalize, catchError, tap } from "rxjs/operators";

import { UnzipParams, UnzipError, EUnzipError } from "./unzip.service.i";
import { LoggerService } from "../logger";

// ------------------------------------------------

export const externals = {
  unzipExtract: unzip.Extract,
  createReadStream: fs.createReadStream,
};

@Injectable()
export class UnzipService {
  public constructor(public logger: LoggerService) {}

  public unzip(input: UnzipParams): Promise<string> {
    this.logger.info(`Start to unzip the specified file`);

    const zipStream = externals.createReadStream(input.zipFilePath);
    const zipStream$ = new Subject();
    zipStream.on("error", (error) => {
      this.logger.info(`The specified file path is wrong`);
      zipStream$.error(new UnzipError(EUnzipError.FILE_NOT_FOUND, { error }));
    });

    return race(zipStream$, this.createUnzipStream$(zipStream, input.tmpDir))
      .pipe(
        tap(() => this.logger.info("Succeeded to unzip the specified file")),
        map(() => input.tmpDir),
        catchError((error) => throwError(UnzipError.isUnzipError(error) ? error : new UnzipError(EUnzipError.UNZIP_FAILED, { error }))),
        finalize(() => !zipStream.destroyed && zipStream.destroy()),
      )
      .toPromise();
  }

  public createUnzipStream$(zipStream: fs.ReadStream, destDir: string): Observable<string> {
    const unzipStream = zipStream.pipe(externals.unzipExtract({ path: destDir }));

    const unzipStream$ = new Subject<string>();
    unzipStream.on("close", () => {
      if (!unzipStream$.closed && !unzipStream$.isStopped) {
        unzipStream$.next(destDir);
      }
      unzipStream$.complete();
    });
    unzipStream.on("error", (error) => unzipStream$.error(error));

    return unzipStream$.pipe(
      tap(() => unzipStream.destroy()),
      catchError((error) => {
        this.logger.info(`Failed to unzip the specified file`);
        return throwError(new UnzipError(EUnzipError.FILE_SAVE_FAILED, { error }));
      }),
      finalize(() => !unzipStream.destroyed && unzipStream.destroy()),
    );
  }
}
