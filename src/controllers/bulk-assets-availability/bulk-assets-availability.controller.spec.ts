import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { cases } from "rxjs-marbles/jest";

import { BulkAssetsAvailabilityController } from "./bulk-assets-availability.controller";
import { EAssetStatus, AssetAvailability } from "./bulk-assets-availability.controller.i";
import { AssetStatusService, GetAssetAvailability, EAssetStatus as EAssetStatusOfService } from "../../service/asset-status";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { BridgeXServerError } from "../../service/utils";

describe("BulkAssetsAvailabilityController", () => {
  let controller: BulkAssetsAvailabilityController;
  let assetStatusService: AssetStatusService;
  let loggerService: LoggerService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class AssetStatusServiceMock {
    public getAssetAvailability$ = jest.fn();
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkAssetsAvailabilityController],
      providers: [
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get<BulkAssetsAvailabilityController>(BulkAssetsAvailabilityController);
    assetStatusService = module.get<AssetStatusService>(AssetStatusService);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetStatusService).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe("get", () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        const records: GetAssetAvailability[] = [
          { status: EAssetStatusOfService.Good, count: 11 },
          { status: EAssetStatusOfService.Error, count: 22 },
          { status: EAssetStatusOfService.Missing, count: 33 },
          { status: EAssetStatusOfService.Online, count: 44 },
        ];
        jest.spyOn(assetStatusService, "getAssetAvailability$").mockReturnValue(of(records));
        // act
        const actual$ = controller.get().toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should call getAssetAvailabilitiy": {
          assert: (p$: Promise<AssetAvailability[]>) => {
            return p$.then(() => expect(assetStatusService.getAssetAvailability$).toHaveBeenCalled()).catch(fail);
          },
        },
        "should return response data": {
          assert: (p$: Promise<AssetAvailability[]>) => {
            const expected = [
              { status: EAssetStatus.Good, count: 11 },
              { status: EAssetStatus.Error, count: 22 },
              { status: EAssetStatus.Missing, count: 77 },
            ];
            return p$.then((actual) => expect(actual).toEqual(expected)).catch(fail);
          },
        },
      },
    );

    cases(
      "when happning error",
      (_, c) => {
        // arrange
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(assetStatusService, "getAssetAvailability$").mockReturnValue(throwError(error));
        // act
        const actual$ = controller.get().toPromise();
        // assert
        return c.assert(actual$);
      },
      {
        "should throw HttpException": {
          assert: (p$: Promise<AssetAvailability[]>) => {
            return p$.then(fail).catch((e) => {
              expect(e).toBeInstanceOf(HttpException);
              expect(e.getStatus()).toEqual(123);
              expect(e.getResponse().message).toEqual("test error");
            });
          },
        },
      },
    );
  });
});
