import { promises as fs } from "fs";
import path from "path";
import YAML from "yaml";

import { Injectable } from "@nestjs/common";

import { Observable, from, throwError, of } from "rxjs";

import { switchMap, map, catchError, tap } from "rxjs/operators";

import { LoggerService } from "../logger";

import {
  PackageMetadataYaml,
  PackageMetadata,
  PackageValidationError,
  EPackageValidationError,
  ValidatePackageParams,
} from "./package-validation.service.i";

import { PackageValidationServiceGuard } from "./package-validation.service.guard";
import { ErrorCode } from "../utils";
import { UnzipService } from "../unzip/unzip.service";
import { UnzipParams } from "../unzip/unzip.service.i";

// ------------------------------

const MetadataFileName = "META.yaml";

@Injectable()
export class PackageValidationService {
  public constructor(
    private readonly logger: LoggerService,
    private readonly guards: PackageValidationServiceGuard,
    private readonly unzipService: UnzipService,
  ) {}

  public validate$(input: ValidatePackageParams): Observable<PackageMetadata> {
    const unzipParams: UnzipParams = {
      zipFilePath: input.packageFilePath,
      tmpDir: input.tmpDir,
    };

    return from(this.unzipService.unzip(unzipParams)).pipe(
      catchError((error) => throwError(new PackageValidationError(EPackageValidationError.FILE_FORMAT, { error }))),
      switchMap((zipFilePath: string) => this.validateZipFile$(zipFilePath)),
      catchError((error) => {
        const err = PackageValidationError.isPackageValidationError(error)
          ? error
          : new PackageValidationError(EPackageValidationError.UNKNOWN, { error });
        this.logger.error(err.toString(), err.params);
        return throwError(ErrorCode.categorize(err));
      }),
    );
  }

  /** internal */
  public validateZipFile$(zipFilePath: string): Observable<PackageMetadata> {
    let idealFiles: string[] = [];
    let actualFiles: string[] = [];

    return of(null).pipe(
      switchMap(() =>
        of(null).pipe(
          switchMap(() => from(fs.readFile(`${zipFilePath}/${MetadataFileName}`))),
          tap(() => this.logger.info(`Succeeded to read ${MetadataFileName}`)),
          catchError(() => throwError(new PackageValidationError(EPackageValidationError.METADATA_NOT_FOUND))),
        ),
      ),
      switchMap((yaml: Buffer) =>
        of(null).pipe(
          switchMap(() => of(YAML.parse(yaml.toString()))),
          tap(() => this.logger.info(`Succeeded to parse ${MetadataFileName}`)),
          catchError((error) => throwError(new PackageValidationError(EPackageValidationError.METADATA_FORMAT, { error }))),
        ),
      ),
      map((metadata: any) => {
        if (!this.guards.isPackageMetadataYaml(metadata)) {
          throw new PackageValidationError(EPackageValidationError.METADATA_FORMAT, { metadata });
        }

        this.logger.info(`Succeeded to validate ${MetadataFileName}`);
        return this.toPackageMetadata(metadata);
      }),
      tap((metadata) => {
        idealFiles = metadata.files.map((file) => path.join("/", file)).sort();
      }),
      switchMap((metadata) =>
        from(this.getFileList(zipFilePath)).pipe(
          tap((fileNames: string[]) => {
            actualFiles = fileNames
              .filter((fileName) => fileName !== MetadataFileName)
              .map((file) => path.join("/", file))
              .sort();
          }),
          map(() => metadata),
        ),
      ),
      tap(() => {
        if (JSON.stringify(idealFiles) !== JSON.stringify(actualFiles)) {
          throw new PackageValidationError(EPackageValidationError.CONTENT_MISMATCH);
        }
        this.logger.info(`Succeeded to validate package with ${MetadataFileName}`);
      }),
    );
  }

  /** internal */
  public toPackageMetadata(params: PackageMetadataYaml): PackageMetadata {
    return {
      name: params.name,
      files: [...params.files],
      summary: params.summary,
      description: params.description,
      model: params.model,
      elements: Object.entries(params.elements).map(([name, version]) => ({ name, version })),
      createdBy: params.createdBy,
    };
  }

  // wrap fs.readdir because fs.readdir can't be used in jest
  public getFileList(filePath: string): Promise<string[]> {
    return fs.readdir(filePath);
  }
}
