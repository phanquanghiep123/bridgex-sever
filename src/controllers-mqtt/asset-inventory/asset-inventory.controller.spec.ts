import { Test, TestingModule } from "@nestjs/testing";
import { of } from "rxjs";

import { AssetInventoryController } from "./asset-inventory.controller";
import { AssetInventoryService } from "../../service/asset-inventory/asset-inventory.service";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { GuardAssetInventory } from "./asset-inventory.controller.guard";
import { LoggerService } from "../../service/logger";
import { EMessageType, EMessageName } from "../mqtt-message.i";

describe(AssetInventoryController.name, () => {
  let controller: AssetInventoryController;
  let assetInventoryService: AssetInventoryService;
  let guardMqttMessage: GuardMqttMessage;
  let guardAssetInventory: GuardAssetInventory;
  let loggerService: LoggerService;

  class AssetInventoryServiceMock {
    public upsertAssetInventory$ = jest.fn();
  }
  class GuardMqttMessageMock {
    public isMqttMessagePayload = jest.fn();
  }
  class GuardAssetInventoryMock {
    public isAssetInventoryEvent = jest.fn();
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
      controllers: [AssetInventoryController],
      providers: [
        { provide: AssetInventoryService, useClass: AssetInventoryServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: GuardMqttMessage, useClass: GuardMqttMessageMock },
        { provide: GuardAssetInventory, useClass: GuardAssetInventoryMock },
      ],
    }).compile();

    controller = module.get<AssetInventoryController>(AssetInventoryController);
    assetInventoryService = module.get<AssetInventoryService>(AssetInventoryService);
    guardMqttMessage = module.get(GuardMqttMessage);
    guardAssetInventory = module.get(GuardAssetInventory);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetInventoryService).toBeDefined();
    expect(guardMqttMessage).toBeDefined();
    expect(guardAssetInventory).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(AssetInventoryController.prototype.handleAssetInventoryEvent$.name, () => {
    it("should not call upsertAssetInventory$ when payload is invalid form", () => {
      // arrange
      const payload = {
        type: EMessageType.Event,
        name: EMessageName.InventoryChanged,
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(false);
      jest.spyOn(guardAssetInventory, "isAssetInventoryEvent").mockReturnValue(false);

      // act
      return controller
        .handleAssetInventoryEvent$(payload)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(payload);
          expect(guardAssetInventory.isAssetInventoryEvent).not.toHaveBeenCalled();
          expect(assetInventoryService.upsertAssetInventory$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it("should not call upsertAssetInventory$ when detail is invalid form", () => {
      // arrange
      const payload = { type: EMessageType.Event, name: EMessageName.InventoryChanged, detail: { foo: "some-data" } };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardAssetInventory, "isAssetInventoryEvent").mockReturnValue(false);

      // act
      return controller
        .handleAssetInventoryEvent$(payload)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(payload);
          expect(guardAssetInventory.isAssetInventoryEvent).toHaveBeenCalledWith(payload.detail);
          expect(assetInventoryService.upsertAssetInventory$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it("should call upsertAssetInventory$ with a Asset params", () => {
      // arrange
      const typeId = "tyty";
      const assetId = "asas";

      const payload = {
        type: EMessageType.Event,
        name: EMessageName.InventoryChanged,
        assetMetaData: {
          typeId,
          assetId,
        },
        detail: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [
                {
                  currencyCode: "EUR",
                  faceValue: "0.50",
                  count: 0,
                  revision: 0,
                },
              ],
            },
          ],
        },
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardAssetInventory, "isAssetInventoryEvent").mockReturnValue(true);
      const expected = {
        typeId,
        assetId,
        units: [
          {
            unit: "casset A",
            status: "Full",
            nearFull: 550,
            nearEmpty: 10,
            capacity: 600,
            denominations: [
              {
                currencyCode: "EUR",
                faceValue: "0.50",
                count: 0,
                revision: 0,
              },
            ],
          },
        ],
      };
      jest.spyOn(assetInventoryService, "upsertAssetInventory$").mockReturnValue(of(null));

      return controller
        .handleAssetInventoryEvent$(payload)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(payload);
          expect(guardAssetInventory.isAssetInventoryEvent).toHaveBeenCalledWith(payload.detail);
          expect(assetInventoryService.upsertAssetInventory$).toHaveBeenCalledWith(expected);
        })
        .catch((e) => fail(e));
    });
  });
});
