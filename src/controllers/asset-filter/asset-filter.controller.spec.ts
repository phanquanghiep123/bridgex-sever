import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { of, throwError } from "rxjs";
import express from "express";

import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { ErrorCode, BridgeXServerError } from "../../service/utils";

import { ConfigService } from "../../service/config";
import { HttpClientService } from "../../service/http-client";

import { AssetTypeController, RegionController, CustomerController, LocationController } from "./asset-filter.controller";
import { AssetTypesResponse, RegionsResponse, CustomersResponse, LocationsResponse } from "./asset-filter.controller.i";
import { GuardAssetFilter } from "./asset-filter.controller.guard";
import { AssetFilterService, AssetTypeRecord, RegionRecord, CustomerRecord, LocationRecord } from "../../service//asset-filter";

describe("Asset Filter", () => {
  let controllerAssetType: AssetTypeController;
  let controllerRegion: RegionController;
  let controllerCustomer: CustomerController;
  let controllerLocation: LocationController;
  let assetFilterService: AssetFilterService;
  let guardGetLocations: GuardAssetFilter;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let httpClientService: HttpClientService;
  let res: express.Response;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class AssetFilterServiceMock {
    public getAssetType$ = jest.fn();
    public getRegion$ = jest.fn();
    public getCustomer$ = jest.fn();
    public getLocation$ = jest.fn();
  }

  class GuardAssetFilterMock {
    public isGetLocationsParams = jest.fn();
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class ConfigServiceMock {
    public appConfig = jest.fn();
  }

  class HttpClientServiceMock {
    public post$ = jest.fn();
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetTypeController, RegionController, CustomerController, LocationController],
      providers: [
        { provide: AssetFilterService, useClass: AssetFilterServiceMock },
        { provide: GuardAssetFilter, useClass: GuardAssetFilterMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controllerAssetType = module.get(AssetTypeController);
    controllerRegion = module.get(RegionController);
    controllerCustomer = module.get(CustomerController);
    controllerLocation = module.get(LocationController);
    assetFilterService = module.get(AssetFilterService);
    guardGetLocations = module.get(GuardAssetFilter);
    loggerService = module.get(LoggerService);
    configService = module.get(ConfigService);
    httpClientService = module.get(HttpClientService);
  });

  it("should be defined", () => {
    expect(controllerAssetType).toBeDefined();
    expect(controllerRegion).toBeDefined();
    expect(controllerCustomer).toBeDefined();
    expect(controllerLocation).toBeDefined();
    expect(assetFilterService).toBeDefined();
    expect(guardGetLocations).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(configService).toBeDefined();
    expect(httpClientService).toBeDefined();
  });

  describe(AssetTypeController.name, () => {
    describe(AssetTypeController.prototype.getAssetTypes.name, () => {
      res = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
      } as any;

      describe("case that res.body is valid", () => {
        beforeEach(() => {});

        it("should call getAssetType$", () => {
          // arrange
          jest.spyOn(assetFilterService, "getAssetType$").mockReturnValue(of([]));

          // act
          controllerAssetType.getAssetTypes(res);

          // assert
          expect(assetFilterService.getAssetType$).toHaveBeenCalled();
        });

        it("should respond asset type list (1 record) when getAssetType$ succeeded", () => {
          // arrange
          const expected: AssetTypesResponse[] = [
            {
              typeId: "type",
            },
          ];
          const ret: AssetTypeRecord[] = [
            {
              typeId: "type",
              totalCount: "1",
            },
          ];
          jest.spyOn(assetFilterService, "getAssetType$").mockReturnValue(of(ret));

          // act
          controllerAssetType.getAssetTypes(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expected);
        });

        it("should respond asset type data empty", () => {
          // arrange
          const expected: AssetTypesResponse[] = [];
          const ret: AssetTypeRecord[] = [];

          jest.spyOn(assetFilterService, "getAssetType$").mockReturnValue(of(ret));

          // act
          controllerAssetType.getAssetTypes(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expected);
        });

        it("should be set X-Total-Count", () => {
          // arrange
          const ret: AssetTypeRecord[] = [
            {
              typeId: "type1",
              totalCount: "2",
            },
            {
              typeId: "type2",
              totalCount: "2",
            },
          ];
          jest.spyOn(assetFilterService, "getAssetType$").mockReturnValue(of(ret));
          const expected = {
            "Access-Control-Expose-Headers": "X-Total-Count",
            "X-Total-Count": "2",
          };

          // act
          controllerAssetType.getAssetTypes(res);

          // assert
          expect(res.set).toHaveBeenCalledWith(expected);
        });

        it("should respond error when lower layer emit error", () => {
          // arrange
          const error = new BridgeXServerError(500, "error");
          jest.spyOn(assetFilterService, "getAssetType$").mockReturnValue(throwError(error));

          const expected = ErrorCode.categorize(error);

          // act
          controllerAssetType.getAssetTypes(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(expected.code);
          expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
        });

        it("should call res.end() when error occured", () => {
          // arrange
          const error = Error("error");
          jest.spyOn(assetFilterService, "getAssetType$").mockReturnValue(throwError(error));

          // act
          controllerAssetType.getAssetTypes(res);

          // assert
          expect(res.end).toHaveBeenCalled();
        });
      });
    });
  });

  describe(RegionController.name, () => {
    describe(RegionController.prototype.getRegions.name, () => {
      res = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
      } as any;

      describe("case that res.body is valid", () => {
        beforeEach(() => {});

        it("should call getRegion$", () => {
          // arrange
          jest.spyOn(assetFilterService, "getRegion$").mockReturnValue(of([]));

          // act
          controllerRegion.getRegions(res);

          // assert
          expect(assetFilterService.getRegion$).toHaveBeenCalled();
        });

        it("should respond region list (1 record) when getRegion$ succeeded", () => {
          // arrange
          const expected: RegionsResponse[] = [
            {
              regionId: "region",
            },
          ];
          const ret: RegionRecord[] = [
            {
              regionId: "region",
              totalCount: "1",
            },
          ];
          jest.spyOn(assetFilterService, "getRegion$").mockReturnValue(of(ret));

          // act
          controllerRegion.getRegions(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expected);
        });

        it("should respond region data empty", () => {
          // arrange
          const expected: RegionsResponse[] = [];
          const ret: RegionRecord[] = [];

          jest.spyOn(assetFilterService, "getRegion$").mockReturnValue(of(ret));

          // act
          controllerRegion.getRegions(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expected);
        });

        it("should be set X-Total-Count", () => {
          // arrange
          const ret: RegionRecord[] = [
            {
              regionId: "region1",
              totalCount: "2",
            },
            {
              regionId: "region2",
              totalCount: "2",
            },
          ];
          jest.spyOn(assetFilterService, "getRegion$").mockReturnValue(of(ret));
          const expected = {
            "Access-Control-Expose-Headers": "X-Total-Count",
            "X-Total-Count": "2",
          };

          // act
          controllerRegion.getRegions(res);

          // assert
          expect(res.set).toHaveBeenCalledWith(expected);
        });

        it("should respond error when lower layer emit error", () => {
          // arrange
          const error = new BridgeXServerError(500, "error");
          jest.spyOn(assetFilterService, "getRegion$").mockReturnValue(throwError(error));

          const expected = ErrorCode.categorize(error);

          // act
          controllerRegion.getRegions(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(expected.code);
          expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
        });

        it("should call res.end() when error occured", () => {
          // arrange
          const error = Error("error");
          jest.spyOn(assetFilterService, "getRegion$").mockReturnValue(throwError(error));

          // act
          controllerRegion.getRegions(res);

          // assert
          expect(res.end).toHaveBeenCalled();
        });
      });
    });
  });

  describe(CustomerController.name, () => {
    describe(CustomerController.prototype.getCustomers.name, () => {
      res = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
      } as any;

      describe("case that res.body is valid", () => {
        beforeEach(() => {});

        it("should call getCustomer$", () => {
          // arrange
          jest.spyOn(assetFilterService, "getCustomer$").mockReturnValue(of([]));

          // act
          controllerCustomer.getCustomers(res);

          // assert
          expect(assetFilterService.getCustomer$).toHaveBeenCalled();
        });

        it("should respond customer list (1 record) when getCustomer$ succeeded", () => {
          // arrange
          const expected: CustomersResponse[] = [
            {
              customerId: "customer",
            },
          ];
          const ret: CustomerRecord[] = [
            {
              customerId: "customer",
              totalCount: "1",
            },
          ];
          jest.spyOn(assetFilterService, "getCustomer$").mockReturnValue(of(ret));

          // act
          controllerCustomer.getCustomers(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expected);
        });

        it("should respond customer data empty", () => {
          // arrange
          const expected: CustomersResponse[] = [];
          const ret: CustomerRecord[] = [];

          jest.spyOn(assetFilterService, "getCustomer$").mockReturnValue(of(ret));

          // act
          controllerCustomer.getCustomers(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expected);
        });

        it("should be set X-Total-Count", () => {
          // arrange
          const ret: CustomerRecord[] = [
            {
              customerId: "customer1",
              totalCount: "2",
            },
            {
              customerId: "customer2",
              totalCount: "2",
            },
          ];
          jest.spyOn(assetFilterService, "getCustomer$").mockReturnValue(of(ret));
          const expected = {
            "Access-Control-Expose-Headers": "X-Total-Count",
            "X-Total-Count": "2",
          };

          // act
          controllerCustomer.getCustomers(res);

          // assert
          expect(res.set).toHaveBeenCalledWith(expected);
        });

        it("should respond error when lower layer emit error", () => {
          // arrange
          const error = new BridgeXServerError(500, "error");
          jest.spyOn(assetFilterService, "getCustomer$").mockReturnValue(throwError(error));

          const expected = ErrorCode.categorize(error);

          // act
          controllerCustomer.getCustomers(res);

          // assert
          expect(res.status).toHaveBeenCalledWith(expected.code);
          expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
        });

        it("should call res.end() when error occured", () => {
          // arrange
          const error = Error("error");
          jest.spyOn(assetFilterService, "getCustomer$").mockReturnValue(throwError(error));

          // act
          controllerCustomer.getCustomers(res);

          // assert
          expect(res.end).toHaveBeenCalled();
        });
      });
    });
  });

  describe(LocationController.name, () => {
    describe(LocationController.prototype.getLocations.name, () => {
      res = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
      } as any;

      it("shoud throw NotFoundException when request params is invalid", (done) => {
        // arrange
        jest.spyOn(guardGetLocations, "isGetLocationsParams").mockReturnValue(false);
        const expected = new NotFoundException("Invalid Request Path Params");

        // act
        controllerLocation.getLocations("bad", res).subscribe(
          () => {
            fail();
          },
          (err) => {
            // assert
            expect(err).toBeInstanceOf(NotFoundException);
            expect(err.status).toEqual(expected.getStatus());
            expect(err.response).toEqual(expected.getResponse());
            done();
          },
        );
      });

      describe("case that res.body is valid", () => {
        beforeEach(() => {
          jest.spyOn(guardGetLocations, "isGetLocationsParams").mockReturnValue(true);
        });

        it("should call getLocation$", () => {
          // arrange
          jest.spyOn(assetFilterService, "getLocation$").mockReturnValue(of([]));

          // act
          controllerLocation.getLocations("customer", res);

          // assert
          expect(assetFilterService.getLocation$).toHaveBeenCalled();
        });

        it("should respond customer list (1 record) when getLocation$ succeeded", () => {
          // arrange
          const expected: LocationsResponse[] = [
            {
              customerId: "customer",
              locationId: "location",
            },
          ];
          const ret: LocationRecord[] = [
            {
              customerId: "customer",
              locationId: "location",
              totalCount: "1",
            },
          ];
          jest.spyOn(assetFilterService, "getLocation$").mockReturnValue(of(ret));

          // act
          controllerLocation.getLocations("customer", res);

          // assert
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expected);
        });

        it("should respond customer data empty", () => {
          // arrange
          const expected: LocationsResponse[] = [];
          const ret: LocationRecord[] = [];

          jest.spyOn(assetFilterService, "getLocation$").mockReturnValue(of(ret));

          // act
          controllerLocation.getLocations("customer", res);

          // assert
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expected);
        });

        it("should be set X-Total-Count", () => {
          // arrange
          const ret: LocationRecord[] = [
            {
              customerId: "customer",
              locationId: "location1",
              totalCount: "2",
            },
            {
              customerId: "customer",
              locationId: "location2",
              totalCount: "2",
            },
          ];
          jest.spyOn(assetFilterService, "getLocation$").mockReturnValue(of(ret));
          const expected = {
            "Access-Control-Expose-Headers": "X-Total-Count",
            "X-Total-Count": "2",
          };

          // act
          controllerLocation.getLocations("customer", res);

          // assert
          expect(res.set).toHaveBeenCalledWith(expected);
        });

        it("should respond error when lower layer emit error", () => {
          // arrange
          const error = new BridgeXServerError(500, "error");
          jest.spyOn(assetFilterService, "getLocation$").mockReturnValue(throwError(error));

          const expected = ErrorCode.categorize(error);

          // act
          controllerLocation.getLocations("customer", res);

          // assert
          expect(res.status).toHaveBeenCalledWith(expected.code);
          expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
        });

        it("should call res.end() when error occured", () => {
          // arrange
          const error = Error("error");
          jest.spyOn(assetFilterService, "getLocation$").mockReturnValue(throwError(error));

          // act
          controllerLocation.getLocations("customer", res);

          // assert
          expect(res.end).toHaveBeenCalled();
        });
      });
    });
  });
});
