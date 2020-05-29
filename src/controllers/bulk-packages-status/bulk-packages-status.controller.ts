import { Controller, Req, Res, Post, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";

import { GuardBulkPackagesStatus } from "./bulk-packages-status.controller.guard";
import { PackageStatus } from "./bulk-packages-status.controller.i";

import { PackagesService, PackageStatus as PackageStatusData } from "../../service/packages";
import { LoggerService } from "../../service/logger";
import { ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

@Controller("/bulk/packages/")
@UseGuards(BearerTokenGuard)
export class BulkPackagesStatusController {
  constructor(private packagesService: PackagesService, private guard: GuardBulkPackagesStatus, private logger: LoggerService) {}

  @Post("status")
  public getBulkPackagesStatus(@Req() req: Request, @Res() res: Response) {
    this.logger.info("Enter POST /bulk/packages/status");

    if (!this.guard.isGetBulkPackagesStatusBody(req.body)) {
      return res
        .status(400)
        .json("Invalid Request Body")
        .end();
    }

    const params: PackageStatus[] = req.body;

    this.packagesService
      .getPackagesStatus$(params)
      .subscribe(
        (data: PackageStatusData[]) => {
          this.logger.info("Succeeded to get package status list");
          res.status(200).json(data);
        },
        (e) => {
          const err = ErrorCode.categorize(e);
          this.logger.info(err.message);
          res.status(err.code).json({ code: err.code, message: err.message });
        },
      )
      .add(() => res.end());
  }
}
