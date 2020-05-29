import {
  Controller,
  HttpException,
  NotFoundException,
  HttpCode,
  Body,
  UseGuards,
  Post,
  Req,
  Put,
  Param,
  BadRequestException,
  Get,
  Query,
  Res,
  UnauthorizedException,
  Delete,
} from "@nestjs/common";
import { Observable, throwError, of } from "rxjs";
import { tap, catchError, map, mergeMap } from "rxjs/operators";
import { v4 as uuid } from "uuid";
import { Request, Response } from "express";

import { PostBody, PutBody, Package } from "./packages.controller.i";
import { GuardPackages } from "./packages.controller.guard";
import {
  PackagesService,
  EPackageStatus,
  InsertPackageParams,
  GetPackageParams,
  PackageRecord,
  UpdatePackageParams,
  Package as PackageOfSvc,
} from "../../service/packages";
import { IbmCosService } from "../../service/ibm-cos";
import { UserAuthService, UserInfo } from "../../service/user-auth";
import { ConfigService } from "../../service/config";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { BridgeXServerError } from "../../service/utils";
import { FtpClientService } from "../../service/ftp-client/ftp-client.service";

@Controller("/packages")
@UseGuards(BearerTokenGuard)
export class PackagesController {
  constructor(
    private packagesService: PackagesService,
    private ibmCosService: IbmCosService,
    private userAuthService: UserAuthService,
    private configService: ConfigService,
    private ftpService: FtpClientService,
    private guard: GuardPackages,
    private logger: LoggerService,
  ) {}

  @Post()
  @HttpCode(201)
  public postPackage(@Body() body: PostBody, @Req() req: Request): Observable<any> {
    this.logger.info(`Enter POST /packages`);

    const accessToken = this.getTokenFromHeader(req);

    if (!accessToken) {
      return throwError(new UnauthorizedException("invalid bearer token"));
    }

    if (!this.guard.isPostBody(body)) {
      return throwError(new BadRequestException(`Cannot POST /packages`));
    }

    const packageId = uuid();
    const bucketName = this.configService.objectStorageConfig().bucket;
    const objectName = `${this.configService.objectStorageConfig().pathPrefix}/${packageId}/${body.name}`;

    const insertPackageParams: InsertPackageParams = {
      packageId,
      name: body.name,
      status: EPackageStatus.Uploading,
      comment: "",
      uploadBy: "Suzuki",
      summary: "",
      description: "",
      model: "",
      memo: "",
      bucketName,
      objectName,
      ftpFilePath: "",
    };

    return this.userAuthService.getUserInfo$(accessToken).pipe(
      map((userInfo: UserInfo) => {
        return {
          ...insertPackageParams,
          uploadBy: userInfo.displayName,
        };
      }),
      mergeMap((params: InsertPackageParams) => this.packagesService.insertPackage$(params)),
      tap(() => this.logger.info("Succeeded to post package")),
      mergeMap(() => this.ibmCosService.putObjectUrl$(objectName)),
      map((uploadUrl: string) => {
        return {
          packageId: insertPackageParams.packageId,
          uploadUrl,
        };
      }),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public getTokenFromHeader(req: Request): string {
    const regexp = /^Bearer\s+/i;
    if (!req.headers.authorization || !regexp.test(req.headers.authorization)) {
      return "";
    }
    return req.headers.authorization.replace(/^Bearer\s+/i, "");
  }

  @Put(":packageId")
  @HttpCode(204)
  public updatePackage(@Param("packageId") packageId: string, @Body() body: PutBody) {
    this.logger.info(`Enter PUT /packages/:packageId`);

    if (!this.guard.isPutPath({ packageId })) {
      this.logger.info("Invalid request path", { packageId });
      return throwError(new NotFoundException(`Cannot PUT /packages/:packageId`));
    }

    if (!this.guard.isPutBody(body)) {
      this.logger.info("Invalid request body", body);
      return throwError(new BadRequestException(`Cannot PUT /packages/:packageId`));
    }

    const updatePackageParams: UpdatePackageParams = {
      packageId,
      memo: body.memo,
    };

    return this.packagesService.updatePackage$(updatePackageParams).pipe(
      tap(() => this.logger.info("Succeeded to PUT /package/:packageId")),
      map(() => null),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  @Get()
  public getPackages(@Query() query: GetPackageParams, @Res() res: Response) {
    this.logger.info(`Enter GET /packages`);

    if (!this.guard.isGetPackageParams(query)) {
      return throwError(new BadRequestException("Invalid Request Path Params"));
    }

    const params: GetPackageParams = {
      limit: query.limit || "20",
      offset: query.offset || "0",
      status: query.status,
      text: query.text ? this.getFreeSearchKeywords(query.text) : "%",
      sortName: query.sortName ? query.sortName : "date",
      sort: query.sort ? query.sort : "desc",
    };

    this.packagesService
      .get$(params)
      .subscribe(
        (records: PackageRecord[]) => {
          const bundle = (recs: PackageRecord[]): Package[] => {
            return recs.reduce((pre, current) => {
              const element = pre.find((ele) => ele.packageId === current.id);
              if (element) {
                element.elements.push({ name: current.key, version: current.value });
              } else {
                pre.push({
                  packageId: current.id,
                  name: current.name,
                  status: current.status,
                  summary: current.summary,
                  date: current.updateUtc ? current.updateUtc.toISOString() : "",
                  description: current.description,
                  uploadBy: current.updateBy,
                  model: current.model,
                  memo: current.memo,
                  elements: current.key !== "" ? [{ name: current.key, version: current.value }] : [],
                });
              }
              return pre;
            }, [] as Package[]);
          };
          const tatalCount = records.length !== 0 ? records[0].totalCount : 0;
          res
            .status(200)
            .set({
              "Access-Control-Expose-Headers": "X-Total-Count",
              "X-Total-Count": `${tatalCount}`,
            })
            .json(bundle(records));
        },
        (err: BridgeXServerError) => {
          this.logger.info(err.message);
          res.status(err.code).json({ code: err.code, message: err.message });
        },
      )
      .add(() => res.end());
  }

  @Delete(":packageId")
  @HttpCode(204)
  public deletePackage(@Param("packageId") packageId: string) {
    this.logger.info(`Enter DELETE /packages/:packageId`);

    if (!this.guard.isDeletePath({ packageId })) {
      this.logger.info("Invalid request path", { packageId });
      return throwError(new NotFoundException(`Cannot DELETE /packages/:packageId`));
    }

    return this.packagesService.getPackageWithoutElements$(packageId).pipe(
      tap((packageInfo) => this.logger.info("DELETE /packages/:packageId  Package info", packageInfo)),
      mergeMap((data: PackageOfSvc) =>
        this.packagesService.deletePackage$(packageId).pipe(
          tap((d) => this.logger.info("Succeeded to DELETE /package/:packageId from DB", d)),
          mergeMap(() =>
            this.ibmCosService.deleteObject$(data.objectName).pipe(
              tap(() => this.logger.info("Succeeded to remove file from Object Storage", data)),
              catchError((err) => {
                this.logger.warn("Failure to remove file from Object Storage", { error: err, objectName: data.objectName });
                return of(data);
              }),
            ),
          ),
          mergeMap(() =>
            this.ftpService.deleteObject$(data.ftpFilePath).pipe(
              tap(() => this.logger.info("Succeeded to remove file from FTP Server", data.ftpFilePath)),
              catchError((err) => {
                this.logger.warn("Failure to remove file from FTP Server", { error: err, ftpFilePath: data.ftpFilePath });
                return of(data);
              }),
            ),
          ),
        ),
      ),
      map(() => null),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public getFreeSearchKeywords(text: string): string {
    const arrKeyWords = text
      .replace(/　/g, " ")
      .replace(/ +/g, " ")
      .split(" ");
    arrKeyWords.forEach((value, index, array) => (array[index] = `%${value}%`));
    return arrKeyWords.join(" ");
  }
}
