import { Controller, Req, Res, Get, Post, UseGuards, Query } from "@nestjs/common";
import { Request, Response } from "express";

import { GuardBulkAssetsGetMany } from "./bulk-assets-getmany.controller.guard";
import { Asset, AssetStatus, EAssetStatus } from "./bulk-assets-getmany.controller.i";

import {
  AssetStatusService,
  AssetStatus as AssetStatusData,
  GetAssetsParams,
  AssetRecord,
  EAssetStatus as EAssetStatusOfService,
} from "../../service/asset-status";
import { ErrorInformationService } from "../../service/error-information";
import { LoggerService } from "../../service/logger";
import { ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

@Controller("/bulk/assets/")
@UseGuards(BearerTokenGuard)
export class BulkAssetsGetManyController {
  constructor(
    private assetStatusService: AssetStatusService,
    private errorInformationService: ErrorInformationService,
    private guard: GuardBulkAssetsGetMany,
    private logger: LoggerService,
  ) {}

  @Get()
  public getBulkAssets(@Query() query: GetAssetsParams, @Res() res: Response) {
    this.logger.info("Enter GET /bulk/assets/");
    if (!this.guard.isGetAssetsParams(query)) {
      return res
        .status(400)
        .json("Invalid Request Path Params")
        .end();
    }
    query = {
      isFilter: query.isFilter ? query.isFilter : "false",
      status: query.status ? query.status : "%",
      typeId: query.typeId ? query.typeId : "%",
      organization: query.organization ? query.organization : "%",
      location: query.location ? query.location : "%",
      region: query.region ? query.region : "%",
      text: query.text ? this.getFreeSearchKeywords(query.text) : "%",
      limit: query.limit ? query.limit : "10",
      offset: query.offset ? query.offset : "0",
      sortName: query.sortName ? query.sortName : "installationDate",
      sort: query.sort ? query.sort : "desc",
    };

    this.assetStatusService
      .getAssets$(query)
      .subscribe(
        (records: AssetRecord[]) => {
          const convert = (data: AssetRecord): Asset => {
            return {
              typeId: data.typeId,
              assetId: data.assetId,
              status: !data.status || data.status === EAssetStatusOfService.Online ? EAssetStatus.Missing : (data.status as any),
              ipAddress: data.ipAddress || "",
              note: data.note || "",
              customerId: data.customerId || "",
              locationId: data.locationId || "",
              regionId: data.regionId || "",
              description: data.description || "",
              alias: data.alias || "",
              installationDate: data.installationDate || "",
            };
          };
          const tatalCount = records.length !== 0 ? records[0].totalCount : 0;
          res
            .status(200)
            .set({
              "Access-Control-Expose-Headers": "X-Total-Count",
              "X-Total-Count": `${tatalCount}`,
            })
            .json(records.map((asset) => convert(asset)));
        },
        (e) => {
          const err = ErrorCode.categorize(e);
          this.logger.info(err.message);
          res.status(err.code).json({ code: err.code, message: err.message });
        },
      )
      .add(() => res.end());
  }

  @Post("getMany")
  public getBulkAssetsStatus(@Req() req: Request, @Res() res: Response) {
    this.logger.info("Enter POST /bulk/assets/getMany");

    if (!this.guard.isGetBulkAssetsStatusBody(req.body)) {
      return res
        .status(400)
        .json("Invalid Request Body")
        .end();
    }

    const params: Asset[] = req.body;

    this.assetStatusService
      .getMany$(params)
      .subscribe(
        (datas) => {
          const convert = (data: AssetStatusData): AssetStatus => {
            return {
              typeId: data.typeId,
              assetId: data.assetId,
              status: !data.status || data.status === EAssetStatusOfService.Online ? EAssetStatus.Missing : (data.status as any),
              errorCode: data.errorCode,
              errorMessage: data.errorCode ? this.errorInformationService.getErrorMessage(data.typeId, data.errorCode) : undefined,
              subAssets: data.subAssets ? data.subAssets.map((d) => convert(d)) : undefined,
            };
          };

          this.logger.info("Succeeded to get asset status list");
          res.status(200).json(datas.map((data: AssetStatusData) => convert(data)));
        },
        (e) => {
          const err = ErrorCode.categorize(e);
          this.logger.info(err.message);
          res.status(err.code).json({ code: err.code, message: err.message });
        },
      )
      .add(() => res.end());
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
