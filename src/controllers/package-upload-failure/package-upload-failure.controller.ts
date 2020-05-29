import { Controller, Param, HttpException, NotFoundException, HttpCode, Put, UseGuards } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { tap, catchError, mergeMap } from "rxjs/operators";

import { GuardPackageUploadFailure } from "./package-upload-failure.controller.guard";
import { PackagesService, UpdateStatusParams, EPackageStatus, Package } from "../../service/packages";
import { LoggerService } from "../../service/logger";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

@Controller("/packages/:packageId/uploadFailure")
@UseGuards(BearerTokenGuard)
export class PackageUploadFailureController {
  constructor(private packagesService: PackagesService, private guard: GuardPackageUploadFailure, private logger: LoggerService) {}

  @Put()
  @HttpCode(204)
  public put(@Param("packageId") packageId: string): Observable<null> {
    this.logger.info(`Enter PUT /packages/:packageId/uploadFailure`);

    const params = {
      packageId,
    };

    if (!this.guard.isPutParams(params)) {
      return throwError(new NotFoundException(`Cannot PUT /packages/${packageId}/uploadFailure`));
    }

    return this.packagesService.getPackageWithoutElements$(params.packageId).pipe(
      mergeMap((packageInfo: Package) => {
        if (packageInfo.status !== EPackageStatus.Uploading) {
          return throwError(new BridgeXServerError(ErrorCode.BAD_REQUEST, "The package status is not Uploading"));
        }

        const validatingParams: UpdateStatusParams = {
          packageId: params.packageId,
          status: EPackageStatus.Failure,
        };
        return this.packagesService
          .updateStatus$(validatingParams)
          .pipe(tap(() => this.logger.info("Succeeded to put package status to Failure")));
      }),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }
}
