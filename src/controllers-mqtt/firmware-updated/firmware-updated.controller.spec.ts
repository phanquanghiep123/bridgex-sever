import { Test, TestingModule } from "@nestjs/testing";

import { FirmwareUpdatedController } from "./firmware-updated.controller";
import { LoggerService } from "../../service/logger";
import { AssetEventListService, FirmwareUpdatedParams } from "../../service/event-list";
import { FirmwareUpdatedPayload } from "./firmware-updated.controller.i";
import { throwError } from "rxjs";
import { EMessageType, EMessageName } from "../mqtt-message.i";

describe(FirmwareUpdatedController.name, () => {
  let controller: FirmwareUpdatedController;
  let eventListService: AssetEventListService;
  let loggerService: LoggerService;

  class AssetEventListServiceMock {
    public insertFirmwareUpdated$ = jest.fn();
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
      controllers: [FirmwareUpdatedController],
      providers: [
        { provide: AssetEventListService, useClass: AssetEventListServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    controller = module.get<FirmwareUpdatedController>(FirmwareUpdatedController);
    eventListService = module.get<AssetEventListService>(AssetEventListService);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(eventListService).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(FirmwareUpdatedController.prototype.handleFirmwareUpdated$.name, () => {
    it(`should call ${FirmwareUpdatedController.prototype.handleFirmwareUpdated$.name} with ${FirmwareUpdatedController.prototype.createInsertFirmwareUpdated.name}`, () => {
      // arrange
      const params: FirmwareUpdatedPayload = {
        type: EMessageType.Event,
        name: EMessageName.Established,
        version: 1,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: {
          package: ["packageName"],
        },
      };
      const returnValue: FirmwareUpdatedParams = {
        typeId: "tyty",
        assetId: "asas",
      };

      controller.createInsertFirmwareUpdated = jest.fn(() => returnValue);
      eventListService.insertFirmwareUpdated$ = jest.fn(() => throwError({}));

      const expected = {
        createInsertFirmwareUpdated: params,
        insertFirmwareUpdated: returnValue,
      };

      // act
      controller
        .handleFirmwareUpdated$(params)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createInsertFirmwareUpdated).toHaveBeenCalledWith(expected.createInsertFirmwareUpdated);
          expect(eventListService.insertFirmwareUpdated$).toHaveBeenCalledWith(expected.insertFirmwareUpdated);
          expect(loggerService.info).toHaveBeenCalled();
        })
        .catch(fail);
    });
  });

  describe(FirmwareUpdatedController.prototype.createInsertFirmwareUpdated.name, () => {
    it("should return typeId, assetId and packageList", () => {
      // arrange
      const input: FirmwareUpdatedPayload = {
        type: EMessageType.Event,
        name: EMessageName.FirmwareUpdated,
        version: 1,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: {
          package: [],
        },
      };

      const expected: FirmwareUpdatedParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        packageList: input.detail.package,
      };

      // act
      const actual = controller.createInsertFirmwareUpdated(input);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should return only typeId and assetId when package of detail doesn't exist", () => {
      // arrange
      const input: FirmwareUpdatedPayload = {
        type: EMessageType.Event,
        name: EMessageName.FirmwareUpdated,
        version: 1,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: {},
      };

      const expected: FirmwareUpdatedParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
      };

      // act
      const actual = controller.createInsertFirmwareUpdated(input);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
