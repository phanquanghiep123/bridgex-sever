import { Controller, Param, HttpException, NotFoundException, HttpCode, Put, UseGuards } from "@nestjs/common";
import { Observable, throwError, of, from } from "rxjs";
import { tap, map, catchError, mergeMap, finalize } from "rxjs/operators";
import { accessSync, mkdirSync, promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import rimraf from "rimraf";

import { GuardPackageUploadCompletion } from "./package-upload-completion.controller.guard";
import { PackagesService, UpdateStatusParams, EPackageStatus, Package, UpdateMetadataParams } from "../../service/packages";
import { IbmCosService } from "../../service/ibm-cos";
import { PackageValidationService, PackageElement, ValidatePackageParams, ValidationResult } from "../../service/package-validation";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { FtpClientService } from "../../service/ftp-client/ftp-client.service";
import { ConfigService } from "../../service/config";

// ------------------------------
// ------------------------------

@Controller("/packages/:packageId/uploadCompletion")
@UseGuards(BearerTokenGuard)
export class PackageUploadCompletionController {
  private readonly tmpDir: string = path.join(__dirname, "../../../", this.config.persistentVolumeConfig().validatePackageTmpDir);

  constructor(
    private packagesService: PackagesService,
    private ibmCosService: IbmCosService,
    private packageValidationService: PackageValidationService,
    private guard: GuardPackageUploadCompletion,
    private logger: LoggerService,
    private ftpClient: FtpClientService,
    private config: ConfigService,
  ) {
    this.createTmpDir();
  }

  @Put()
  @HttpCode(204)
  public put(@Param("packageId") packageId: string): Observable<null> {
    this.logger.info(`Enter PUT /packages/:packageId/uploadCompletion`);

    const params = {
      packageId,
    };

    if (!this.guard.isPutParams(params)) {
      return throwError(new NotFoundException(`Cannot PUT /packages/${packageId}/uploadCompletion`));
    }

    return this.packagesService.getPackageWithoutElements$(params.packageId).pipe(
      mergeMap((packageInfo: Package) => {
        if (packageInfo.status !== EPackageStatus.Uploading) {
          return throwError(new BridgeXServerError(ErrorCode.BAD_REQUEST, "The package status is not Uploading"));
        }

        const validatingParams: UpdateStatusParams = {
          packageId: params.packageId,
          status: EPackageStatus.Validating,
        };
        return this.packagesService.updateStatus$(validatingParams).pipe(
          tap(() => this.logger.info("Succeeded to put package status to Validating")),
          tap(() =>
            this.validatePackage$(packageInfo).subscribe(
              () => {},
              () => {},
            ),
          ),
        );
      }),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public validatePackage$(packageInfo: Package): Observable<null> {
    const packageFilePath = `${this.tmpDir}/${packageInfo.id}.zip`;
    const packageDir = `${this.tmpDir}/${packageInfo.id}`;

    return of(null).pipe(
      mergeMap(() =>
        from(fs.mkdir(packageDir)).pipe(
          tap(() => this.logger.info(`Succeeded to make directory ${packageDir} for package: ${packageInfo.id}`)),
          catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", e))),
        ),
      ),
      mergeMap(() =>
        this.ibmCosService.getFile$(packageInfo.objectName, packageFilePath).pipe(
          catchError((e) => {
            const failureParams: UpdateStatusParams = {
              packageId: packageInfo.id,
              status: EPackageStatus.Failure,
            };

            return this.packagesService.updateStatus$(failureParams).pipe(
              tap(() => this.logger.info("Succeeded to put package status to Failure")),
              map(() => {
                throw new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", e);
              }),
            );
          }),
        ),
      ),
      mergeMap((packagePath: string) => {
        const validatePackageInfo: ValidatePackageParams = {
          packageFilePath: packagePath,
          tmpDir: packageDir,
        };

        this.logger.info(`Start to validate zip file about package: ${packageInfo.id}`);
        return this.packageValidationService.validate$(validatePackageInfo).pipe(
          map((metadata) => {
            const params: ValidationResult = {
              tmpDir: validatePackageInfo.tmpDir,
              metadata,
            };

            return params;
          }),
          catchError((e) => {
            const invalidParams: UpdateStatusParams = {
              packageId: packageInfo.id,
              status: EPackageStatus.Invalid,
            };

            return this.packagesService.updateStatus$(invalidParams).pipe(
              tap(() => this.logger.info("Succeeded to put package status to Invalid")),
              map(() => {
                throw new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", e);
              }),
            );
          }),
        );
      }),
      mergeMap((validated: ValidationResult) => {
        const ftpFilePath = `${this.config.ftpConfig().pathPrefix}/${packageInfo.id}/${validated.metadata.files[0]}`;
        const packagePath = `${validated.tmpDir}/${validated.metadata.files[0]}`;

        return this.ftpClient.putFile$(ftpFilePath, packagePath).pipe(
          tap(() => this.logger.info(`Succeeded to send package to ftp server`)),
          catchError((e) => {
            const failureParams: UpdateStatusParams = {
              packageId: packageInfo.id,
              status: EPackageStatus.Failure,
            };

            return this.packagesService.updateStatus$(failureParams).pipe(
              tap(() => this.logger.info("Succeeded to put package status to Failure")),
              map(() => {
                throw new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", e);
              }),
            );
          }),
          mergeMap(() => {
            const completeParams: UpdateMetadataParams = {
              packageId: packageInfo.id,
              status: EPackageStatus.Complete,
              summary: validated.metadata.summary,
              description: validated.metadata.description,
              model: validated.metadata.model,
              ftpFilePath: validated.metadata.files.length > 0 ? ftpFilePath : "",
              elements: validated.metadata.elements.map((element: PackageElement) => ({ key: element.name, value: element.version })),
            };

            return this.packagesService.updataMetadata$(completeParams).pipe(
              tap(() => this.logger.info("Succeeded to put package status to Complete")),
              catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Internal Error", e))),
            );
          }),
        );
      }),
      catchError((err: BridgeXServerError) => {
        this.logger.error(`Failed to validate pacakge=${packageInfo.id} error=${JSON.stringify(err)}`);
        return throwError(err);
      }),
      finalize(() => {
        promisify(rimraf)(`${packageDir}`)
          .then(() => promisify(rimraf)(`${packageFilePath}`))
          .then(() => this.logger.info(`Succeeded to clean up about packageId: ${packageInfo.id}`))
          .catch(() => this.logger.info(`System error: Failed to clean up about packageId: ${packageInfo.id}`));
      }),
    );
  }

  public createTmpDir() {
    try {
      accessSync(this.tmpDir);
    } catch {
      try {
        mkdirSync(this.tmpDir);
        this.logger.info("Succeeded to create temp directory for validating package");
      } catch {
        this.logger.error("System error: Failed to create temp directory for validating package");
      }
    }
  }
}
