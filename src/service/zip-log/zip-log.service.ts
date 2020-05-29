import { Injectable } from "@nestjs/common";
import { Observable, throwError, of } from "rxjs";
import { finalize, mergeMap, catchError } from "rxjs/operators";
import _fs from "fs";
import _path from "path";
import _yaml from "yaml";

import { ZipLogParams, RetrieveLogInfo } from "./zip-log.service.i";
import { GuardZipLogService } from "./zip-log.service.guard";
import { ZipService } from "../zip";
import { LoggerService } from "../logger";
import { ErrorCode, BridgeXServerError } from "../utils";

// ------------------------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
export const yaml = { ..._yaml };
// ------------------------------------------------

@Injectable()
export class ZipLogService {
  public constructor(public guard: GuardZipLogService, public zipService: ZipService, public logger: LoggerService) {}

  public zip$(params: ZipLogParams): Observable<string> {
    const files = params.retrieveLogInfo.map((i: RetrieveLogInfo) => i.filePath);
    const metaFile = path.join(params.dstDir, "META.yaml");

    if (!this.guard.isZipLogParams(params)) {
      return throwError(new BridgeXServerError(ErrorCode.BAD_REQUEST, "bad request"));
    }

    return of(null).pipe(
      mergeMap(() => {
        try {
          return of(this.writeMetaYaml(params, metaFile));
        } catch (err) {
          return throwError(ErrorCode.categorize(err));
        }
      }),
      mergeMap(() =>
        this.zipService.zip$({
          files: [metaFile, ...files],
          dstDir: params.dstDir,
          dstFileName: params.dstFileName,
        }),
      ),
      catchError((err) => throwError(ErrorCode.categorize(err))),
      finalize(() => {
        try {
          if (fs.existsSync(metaFile)) {
            fs.unlinkSync(metaFile);
          }
        } catch (err) {
          this.logger.error(`failed to delete file : ${metaFile}`, err);
        }
      }),
    );
  }

  public writeMetaYaml(params: ZipLogParams, dstFileNameFullPath: string): string {
    const dstFile = dstFileNameFullPath;
    try {
      const yamlObj = {
        date: new Date(Date.now()).toISOString(),
        asset: {
          typeId: params.asset.typeId,
          assetId: params.asset.assetId,
        },
        files: params.retrieveLogInfo.map((info: RetrieveLogInfo) => ({
          typeId: info.typeId,
          assetId: info.assetId,
          status: info.status,
          fileName: path.basename(info.filePath),
        })),
      };
      const yamlText = yaml.stringify(yamlObj);

      fs.writeFileSync(dstFile, yamlText, "utf8");
      return dstFile;
    } catch (err) {
      this.logger.error(`failed to create meta-yaml file. ${dstFile}`);
      throw err;
    }
  }
}
