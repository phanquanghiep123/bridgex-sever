import { Controller, Param, Res, Get, UseGuards, NotFoundException } from "@nestjs/common";
import { throwError } from "rxjs";
import { Response } from "express";

import { LoggerService } from "../../service/logger";
import { ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

import { GuardAssetFilter } from "./asset-filter.controller.guard";
import { AssetFilterService, AssetTypeRecord, RegionRecord, CustomerRecord, LocationRecord } from "../../service/asset-filter";
import { GetLocationsParams, AssetTypesResponse, RegionsResponse, CustomersResponse, LocationsResponse } from "./asset-filter.controller.i";

@Controller("/types")
@UseGuards(BearerTokenGuard)
export class AssetTypeController {
  constructor(private assetFilterService: AssetFilterService, private logger: LoggerService) {}

  @Get()
  public getAssetTypes(@Res() res: Response) {
    this.logger.info("Enter GET /types");

    this.assetFilterService
      .getAssetType$()
      .subscribe(
        (records: AssetTypeRecord[]) => {
          const convert = (data: AssetTypeRecord): AssetTypesResponse => {
            return {
              typeId: data.typeId,
            };
          };
          const tatalCount = records.length !== 0 ? records[0].totalCount : 0;
          res
            .status(200)
            .set({
              "Access-Control-Expose-Headers": "X-Total-Count",
              "X-Total-Count": `${tatalCount}`,
            })
            .json(records.map((assetType) => convert(assetType)));
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

@Controller("/regions")
@UseGuards(BearerTokenGuard)
export class RegionController {
  constructor(private assetFilterService: AssetFilterService, private logger: LoggerService) {}

  @Get()
  public getRegions(@Res() res: Response) {
    this.logger.info("Enter GET /regions");

    this.assetFilterService
      .getRegion$()
      .subscribe(
        (records: RegionRecord[]) => {
          const convert = (data: RegionRecord): RegionsResponse => {
            return {
              regionId: data.regionId,
            };
          };
          const tatalCount = records.length !== 0 ? records[0].totalCount : 0;
          res
            .status(200)
            .set({
              "Access-Control-Expose-Headers": "X-Total-Count",
              "X-Total-Count": `${tatalCount}`,
            })
            .json(records.map((region) => convert(region)));
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

@Controller("/customers")
@UseGuards(BearerTokenGuard)
export class CustomerController {
  constructor(private assetFilterService: AssetFilterService, private logger: LoggerService) {}

  @Get()
  public getCustomers(@Res() res: Response) {
    this.logger.info("Enter GET /customers");

    this.assetFilterService
      .getCustomer$()
      .subscribe(
        (records: CustomerRecord[]) => {
          const convert = (data: CustomerRecord): CustomersResponse => {
            return {
              customerId: data.customerId,
            };
          };
          const tatalCount = records.length !== 0 ? records[0].totalCount : 0;
          res
            .status(200)
            .set({
              "Access-Control-Expose-Headers": "X-Total-Count",
              "X-Total-Count": `${tatalCount}`,
            })
            .json(records.map((customer) => convert(customer)));
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

@Controller("/customers/:customerId/locations")
@UseGuards(BearerTokenGuard)
export class LocationController {
  constructor(private assetFilterService: AssetFilterService, private guard: GuardAssetFilter, private logger: LoggerService) {}

  @Get()
  public getLocations(@Param("customerId") customerId: string, @Res() res: Response) {
    this.logger.info("Enter GET /customers/:customerId/locations");

    const params: GetLocationsParams = {
      customerId,
    };

    if (!this.guard.isGetLocationsParams(params)) {
      return throwError(new NotFoundException("Invalid Request Path Params"));
    }

    this.assetFilterService
      .getLocation$(params)
      .subscribe(
        (records: LocationRecord[]) => {
          const convert = (data: LocationRecord): LocationsResponse => {
            return {
              customerId: data.customerId,
              locationId: data.locationId,
            };
          };
          const tatalCount = records.length !== 0 ? records[0].totalCount : 0;
          res
            .status(200)
            .set({
              "Access-Control-Expose-Headers": "X-Total-Count",
              "X-Total-Count": `${tatalCount}`,
            })
            .json(records.map((location) => convert(location)));
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
