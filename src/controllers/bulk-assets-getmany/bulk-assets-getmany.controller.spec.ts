import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";

import { of, throwError } from "rxjs";

import { BulkAssetsGetManyController } from "./bulk-assets-getmany.controller";
import { GuardBulkAssetsGetMany } from "./bulk-assets-getmany.controller.guard";
import { Asset, AssetStatus, EAssetStatus, AssetBase } from "./bulk-assets-getmany.controller.i";

import { AssetStatusService } from "../../service/asset-status/asset-status.service";
import { ErrorInformationService } from "../../service/error-information";
import { LoggerService } from "../../service/logger";
import { ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import {
  GetAssetsParams,
  AssetRecord,
  AssetStatus as AssetStatusData,
  EAssetStatus as EAssetStatusOfService,
} from "../../service/asset-status";

describe("BulkAssetsGetManyController", () => {
  let controller: BulkAssetsGetManyController;
  let assetStatusService: AssetStatusService;
  let errorInformationService: ErrorInformationService;
  let guardBulkAssetsGetMany: GuardBulkAssetsGetMany;
  let loggerService: LoggerService;
  let req: Request;
  let res: Response;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class AssetStatusServiceMock {
    public getClient$ = jest.fn();
    public controlTransaction$ = jest.fn();
    public getMany$ = jest.fn();
    public getAssets$ = jest.fn();
    public convertToAssetStatus = jest.fn();
  }

  class ErrorInformationServiceMock {
    public getErrorMessage = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkAssetsGetManyController],
      providers: [
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: ErrorInformationService, useClass: ErrorInformationServiceMock },
        GuardBulkAssetsGetMany,
        LoggerService,
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get<BulkAssetsGetManyController>(BulkAssetsGetManyController);
    assetStatusService = module.get<AssetStatusService>(AssetStatusService);
    errorInformationService = module.get(ErrorInformationService);
    guardBulkAssetsGetMany = module.get(GuardBulkAssetsGetMany);
    loggerService = module.get(LoggerService);

    req = {} as any;
    res = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    } as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetStatusService).toBeDefined();
    expect(errorInformationService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(guardBulkAssetsGetMany).toBeDefined();
  });

  describe("getBulkAssetsStatus", () => {
    describe("case that req.body is invalid", () => {
      it("should return 400 when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkAssetsGetMany, "isGetBulkAssetsStatusBody").mockReturnValue(false);

        const expected = 400;

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected);
      });

      it("should return specified message when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkAssetsGetMany, "isGetBulkAssetsStatusBody").mockReturnValue(false);

        const expected = "Invalid Request Body";

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should call res.end() when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkAssetsGetMany, "isGetBulkAssetsStatusBody").mockReturnValue(false);

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });

    describe("case that req.body is valid", () => {
      beforeEach(() => {
        jest.spyOn(guardBulkAssetsGetMany, "isGetBulkAssetsStatusBody").mockReturnValue(true);
      });

      it("should call getMany$ with req.body", () => {
        // arrange
        req.body = [];
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of([]));

        const expected = req.body;

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(assetStatusService.getMany$).toHaveBeenCalledWith(expected);
      });

      it("should respond asset status when getMany$ succeeded with missing", () => {
        // arrange
        const reqAsset: AssetBase[] = [{ typeId: "UW-F", assetId: "000001" }];
        const expected: AssetStatus[] = [
          {
            typeId: "UW-F",
            assetId: "000001",
            status: EAssetStatus.Missing,
            subAssets: [{ typeId: "UW-F", assetId: "000001", status: EAssetStatus.Missing, errorCode: "erer", errorMessage: "meme" }],
          },
        ];
        req.body = reqAsset;
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of(expected));
        jest.spyOn(errorInformationService, "getErrorMessage").mockReturnValue("meme");

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should respond asset status when getMany$ succeeded with online", () => {
        // arrange
        const reqAsset: AssetBase[] = [{ typeId: "UW-F", assetId: "000001" }];
        const resAsset: AssetStatusData[] = [
          {
            typeId: "UW-F",
            assetId: "000001",
            status: EAssetStatusOfService.Online,
            subAssets: [{ typeId: "UW-F", assetId: "000002", status: EAssetStatusOfService.Online, errorCode: "erer" }],
          },
        ];
        const expected: AssetStatus[] = [
          {
            typeId: "UW-F",
            assetId: "000001",
            status: EAssetStatus.Missing,
            errorCode: undefined,
            errorMessage: undefined,
            ipAddress: undefined,
            subAssets: [
              {
                typeId: "UW-F",
                assetId: "000002",
                status: EAssetStatus.Missing,
                errorCode: "erer",
                errorMessage: "meme",
                ipAddress: undefined,
                subAssets: undefined,
              },
            ],
          },
        ];
        req.body = reqAsset;
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of(resAsset));
        jest.spyOn(errorInformationService, "getErrorMessage").mockReturnValue("meme");

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should call res.end() when process finish normally", () => {
        // arrange
        req.body = [];
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(of([]));

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });

      it("should call ErrorCode.categorize when lower layer emit error", () => {
        // arrange
        req.body = [];
        const error = Error("error");
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(throwError(error));
        jest.spyOn(ErrorCode, "categorize");

        const expected = error;

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(ErrorCode.categorize).toHaveBeenCalledWith(expected);
      });

      it("should respond error when lower layer emit error", () => {
        // arrange
        req.body = [];
        const error = Error("error");
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(throwError(error));

        const expected = ErrorCode.categorize(error);

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected.code);
        expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
      });

      it("should call res.end() when error occured", () => {
        // arrange
        req.body = [];
        jest.spyOn(assetStatusService, "getMany$").mockReturnValue(throwError(""));

        // act
        controller.getBulkAssetsStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });
  });

  describe("getBulkAssets", () => {
    let params: GetAssetsParams = {
      isFilter: "true",
      status: "good",
      typeId: "type",
      organization: "organization",
      location: "location",
      region: "region",
      text: "search-string",
      sortName: "sortName",
      sort: "sort-condition",
      limit: "10",
      offset: "0",
    };
    describe("case that req.body is invalid", () => {
      it("should return 400 when request body is invalid form", () => {
        // arrange
        jest.spyOn(guardBulkAssetsGetMany, "isGetAssetsParams").mockReturnValue(false);

        const expected = 400;

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected);
      });

      it("should return specified message when request body is invalid form", () => {
        // arrange
        jest.spyOn(guardBulkAssetsGetMany, "isGetAssetsParams").mockReturnValue(false);

        const expected = "Invalid Request Path Params";

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should call res.end() when request body is invalid form", () => {
        // arrange
        jest.spyOn(guardBulkAssetsGetMany, "isGetAssetsParams").mockReturnValue(false);

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });

    describe("case that req.body is valid", () => {
      beforeEach(() => {
        jest.spyOn(guardBulkAssetsGetMany, "isGetAssetsParams").mockReturnValue(true);
      });

      it("should call getBulkAssets$ with params", () => {
        // arrange
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of([]));
        const expected = { ...params };
        expected.text = `%${expected.text}%`;

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(assetStatusService.getAssets$).toHaveBeenCalledWith(expected);
      });
      it("should call getBulkAssets$ with default", () => {
        // arrange
        params = {
          isFilter: undefined as any,
          status: undefined as any,
          typeId: undefined as any,
          organization: undefined as any,
          location: undefined as any,
          region: undefined as any,
          text: undefined as any,
          sortName: undefined as any,
          sort: undefined as any,
          limit: undefined as any,
          offset: undefined as any,
        };
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of([]));
        const expected = {
          isFilter: "false",
          status: "%",
          typeId: "%",
          organization: "%",
          location: "%",
          region: "%",
          text: "%",
          limit: "10",
          offset: "0",
          sortName: "installationDate",
          sort: "desc",
        };

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(assetStatusService.getAssets$).toHaveBeenCalledWith(expected);
      });

      it("should call getBulkAssets$ with free word", () => {
        // arrange
        params = {
          isFilter: undefined as any,
          status: undefined as any,
          typeId: undefined as any,
          organization: undefined as any,
          location: undefined as any,
          region: undefined as any,
          text: "typeId customerId",
          sortName: undefined as any,
          sort: undefined as any,
          limit: undefined as any,
          offset: undefined as any,
        };
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of([]));
        const expected = {
          isFilter: "false",
          status: "%",
          typeId: "%",
          organization: "%",
          location: "%",
          region: "%",
          text: "%typeId% %customerId%",
          limit: "10",
          offset: "0",
          sortName: "installationDate",
          sort: "desc",
        };

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(assetStatusService.getAssets$).toHaveBeenCalledWith(expected);
      });

      it("should call getBulkAssets$ with sort item", () => {
        // arrange
        params = {
          isFilter: undefined as any,
          status: undefined as any,
          typeId: undefined as any,
          organization: undefined as any,
          location: undefined as any,
          region: undefined as any,
          text: undefined as any,
          sortName: "typeId",
          sort: "asc",
          limit: undefined as any,
          offset: undefined as any,
        };
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of([]));
        const expected = {
          isFilter: "false",
          status: "%",
          typeId: "%",
          organization: "%",
          location: "%",
          region: "%",
          text: "%",
          limit: "10",
          offset: "0",
          sortName: "typeId",
          sort: "asc",
        };

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(assetStatusService.getAssets$).toHaveBeenCalledWith(expected);
      });

      it("should respond asset status when getAssets$ succeeded with missing", () => {
        // arrange
        const expected: Asset[] = [
          {
            typeId: "UW-F",
            assetId: "000001",
            status: EAssetStatus.Missing,
            note: "no no",
            ipAddress: "ip ip",
            customerId: "cu cu",
            locationId: "lo lo",
            regionId: "re re",
            description: "de de",
            alias: "al al",
            installationDate: "2020-01-27T03:00:00.000Z",
          },
        ];
        const ret: AssetRecord[] = [
          {
            ...expected[0],
            totalCount: "1",
          },
        ];
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of(ret));

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should respond asset status when getAssets$ succeeded with online", () => {
        // arrange
        const expected: Asset[] = [
          {
            typeId: "UW-F",
            assetId: "000001",
            status: EAssetStatus.Missing,
            note: "no no",
            ipAddress: "ip ip",
            customerId: "cu cu",
            locationId: "lo lo",
            regionId: "re re",
            description: "de de",
            alias: "al al",
            installationDate: "2020-01-27T03:00:00.000Z",
          },
        ];
        const ret: AssetRecord[] = [
          {
            typeId: "UW-F",
            assetId: "000001",
            status: EAssetStatusOfService.Online,
            note: "no no",
            ipAddress: "ip ip",
            customerId: "cu cu",
            locationId: "lo lo",
            regionId: "re re",
            description: "de de",
            alias: "al al",
            installationDate: "2020-01-27T03:00:00.000Z",
            totalCount: "1",
          },
        ];
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of(ret));

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should respond asset status when getAssets$ succeeded with undefined properties", () => {
        // arrange
        const expected: Asset[] = [
          {
            typeId: "UW-F",
            assetId: "000001",
            status: EAssetStatus.Missing,
            note: "",
            ipAddress: "",
            customerId: "",
            locationId: "",
            regionId: "",
            description: "",
            alias: "",
            installationDate: "",
          },
        ];
        const ret: AssetRecord[] = [
          {
            ...expected[0],
            status: EAssetStatusOfService.Missing,
            note: undefined,
            ipAddress: undefined,
            customerId: undefined as any,
            locationId: undefined as any,
            regionId: undefined as any,
            description: undefined as any,
            alias: undefined as any,
            installationDate: undefined,
            totalCount: "1",
          },
        ];
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of(ret));

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should be set X-Total-Count", () => {
        // arrange
        const ret: AssetRecord[] = [
          {
            typeId: "UW-F",
            assetId: "000001",
            status: EAssetStatusOfService.Missing,
            note: undefined,
            ipAddress: undefined,
            customerId: undefined as any,
            locationId: undefined as any,
            regionId: undefined as any,
            description: undefined as any,
            alias: undefined as any,
            totalCount: "2",
          },
        ];
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of(ret));
        const expected = {
          "Access-Control-Expose-Headers": "X-Total-Count",
          "X-Total-Count": ret[0].totalCount,
        };

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.set).toHaveBeenCalledWith(expected);
      });

      it("should be set X-Total-Count 0 when response []", () => {
        // arrange
        const ret: AssetRecord[] = [];
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(of(ret));
        const expected = {
          "Access-Control-Expose-Headers": "X-Total-Count",
          "X-Total-Count": "0",
        };

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.set).toHaveBeenCalledWith(expected);
      });

      it("should call ErrorCode.categorize when lower layer emit error", () => {
        // arrange
        const error = Error("error");
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(throwError(error));
        jest.spyOn(ErrorCode, "categorize");

        const expected = error;

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(ErrorCode.categorize).toHaveBeenCalledWith(expected);
      });

      it("should respond error when lower layer emit error", () => {
        // arrange
        const error = Error("error");
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(throwError(error));
        jest.spyOn(ErrorCode, "categorize");

        const expected = ErrorCode.categorize(error);

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected.code);
        expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
      });

      it("should call res.end() when error occured", () => {
        // arrange
        const error = Error("error");
        jest.spyOn(assetStatusService, "getAssets$").mockReturnValue(throwError(error));
        jest.spyOn(ErrorCode, "categorize");

        // act
        controller.getBulkAssets(params, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });
  });

  describe("getFreeSearchKeywords", () => {
    it("Wildcard (%) should be given to free words", () => {
      // arrange
      const input = "typeId customerId";
      const expected = "%typeId% %customerId%";

      // act
      const output = controller.getFreeSearchKeywords(input);

      // assert
      expect(output).toEqual(expected);
    });

    it("double-byte spaces should be converted to single-byte spaces", () => {
      // arrange
      const input = "typeId　customerId";
      const expected = "%typeId% %customerId%";

      // act
      const output = controller.getFreeSearchKeywords(input);

      // assert
      expect(output).toEqual(expected);
    });

    it("duplicate spaces should be converted to one", () => {
      // arrange
      const input = "typeId   　    　   customerId";
      const expected = "%typeId% %customerId%";

      // act
      const output = controller.getFreeSearchKeywords(input);

      // assert
      expect(output).toEqual(expected);
    });
  });
});
