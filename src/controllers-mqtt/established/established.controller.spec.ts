import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { EstablishedController } from "./established.controller";
import { AssetVersionsService, PostParams } from "../../service/asset-versions";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { GuardEstablished } from "./established.controller.guard";
import { LoggerService } from "../../service/logger";
import { EMessageType, EMessageName } from "../mqtt-message.i";
import { EstablishedEventPayload } from "./established.controller.i";
import { AssetEventListService, EstablishedParams } from "../../service/event-list";

describe(EstablishedController.name, () => {
  let controller: EstablishedController;
  let assetVersionsService: AssetVersionsService;
  let eventListService: AssetEventListService;
  let guardMqttMessage: GuardMqttMessage;
  let guardEstablished: GuardEstablished;
  let loggerService: LoggerService;

  class AssetVersionsServiceMock {
    public post$ = jest.fn();
  }
  class AssetEventListServiceMock {
    public insertEstablished$ = jest.fn();
  }
  class GuardMqttMessageMock {
    public isMqttMessagePayload = jest.fn();
  }
  class GuardAssetVersionMock {
    public isEstablishedEvent = jest.fn();
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
      controllers: [EstablishedController],
      providers: [
        { provide: AssetVersionsService, useClass: AssetVersionsServiceMock },
        { provide: AssetEventListService, useClass: AssetEventListServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: GuardMqttMessage, useClass: GuardMqttMessageMock },
        { provide: GuardEstablished, useClass: GuardAssetVersionMock },
      ],
    }).compile();

    controller = module.get<EstablishedController>(EstablishedController);
    assetVersionsService = module.get<AssetVersionsService>(AssetVersionsService);
    eventListService = module.get<AssetEventListService>(AssetEventListService);
    guardMqttMessage = module.get(GuardMqttMessage);
    guardEstablished = module.get(GuardEstablished);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetVersionsService).toBeDefined();
    expect(eventListService).toBeDefined();
    expect(guardMqttMessage).toBeDefined();
    expect(guardEstablished).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(EstablishedController.prototype.handleAssetVersion$.name, () => {
    it("should not call post$ when payload is invalid form", () => {
      // arrange
      const payload = {
        type: EMessageType.Event,
        name: EMessageName.Established,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: { versions: [{ name: "nana", version: "veve" }] },
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(false);

      // act
      return controller
        .handleAssetVersion$(payload)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(payload);
          expect(guardEstablished.isEstablishedEvent).not.toHaveBeenCalled();
          expect(assetVersionsService.post$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it("should not call post$ when detail is invalid form", () => {
      // arrange
      const payload = {
        type: EMessageType.Event,
        name: EMessageName.Established,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: { versions: [{ name: "nana", version: "veve" }] },
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardEstablished, "isEstablishedEvent").mockReturnValue(false);

      // act
      return controller
        .handleAssetVersion$(payload)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(payload);
          expect(guardEstablished.isEstablishedEvent).toHaveBeenCalledWith(payload.detail);
          expect(assetVersionsService.post$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it(`should call ${AssetVersionsService.prototype.post$.name} with ${EstablishedController.prototype.createAssetVersionsService.name}`, () => {
      // arrange
      const payload = {
        type: EMessageType.Event,
        name: EMessageName.Established,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: { versions: [{ name: "nana", version: "veve" }] },
      };
      const returnValue: PostParams = {
        typeId: "tyty",
        assetId: "asas",
        subparts: [],
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardEstablished, "isEstablishedEvent").mockReturnValue(true);
      jest.spyOn(controller, "createAssetVersionsService").mockReturnValue(returnValue);
      jest.spyOn(assetVersionsService, "post$").mockReturnValue(throwError({}));

      const expected = {
        createAssetVersionsService: payload,
        post: returnValue,
      };

      // act
      return controller
        .handleAssetVersion$(payload)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createAssetVersionsService).toHaveBeenCalledWith(expected.createAssetVersionsService);
          expect(assetVersionsService.post$).toHaveBeenCalledWith(expected.post);
          expect(loggerService.error).toHaveBeenCalledTimes(1);
        })
        .catch((e) => fail(e));
    });

    it(`should call ${AssetEventListService.prototype.insertEstablished$.name} with ${EstablishedController.prototype.createInsertEstablished.name}`, () => {
      // arrange
      const payload = {
        type: EMessageType.Event,
        name: EMessageName.Established,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: { versions: [{ name: "nana", version: "veve" }] },
      };
      const returnValue: EstablishedParams = {
        typeId: payload.assetMetaData.typeId,
        assetId: payload.assetMetaData.assetId,
        versions: [],
      };

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardEstablished, "isEstablishedEvent").mockReturnValue(true);
      jest.spyOn(controller, "createAssetVersionsService").mockReturnValue({} as any);
      jest.spyOn(assetVersionsService, "post$").mockReturnValue(of(null));
      jest.spyOn(controller, "createInsertEstablished").mockReturnValue(returnValue);
      jest.spyOn(eventListService, "insertEstablished$").mockReturnValue(throwError({}));

      const expected = {
        createInsertEstablished: payload,
        insertEstablished: returnValue,
      };

      // act
      return controller
        .handleAssetVersion$(payload)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createInsertEstablished).toHaveBeenCalledWith(expected.createInsertEstablished);
          expect(eventListService.insertEstablished$).toHaveBeenCalledWith(expected.insertEstablished);
          expect(loggerService.error).toHaveBeenCalledTimes(1);
        })
        .catch((e) => fail(e));
    });
  });

  describe(EstablishedController.prototype.createAssetVersionsService.name, () => {
    it("should return typeId, assetId and subparts", () => {
      // arrange
      const input: EstablishedEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Established,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          versions: [
            {
              name: "nana1",
              value: "vava1",
            },
            {
              name: "nana2",
              value: "vava2",
            },
          ],
        },
      };

      const expected: PostParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        subparts: [
          {
            subpartId: input.detail.versions[0].name,
            subpartVersion: input.detail.versions[0].value as string,
          },
          {
            subpartId: input.detail.versions[1].name,
            subpartVersion: input.detail.versions[1].value as string,
          },
        ],
      };

      // act
      const actual = controller.createAssetVersionsService(input);

      // assert
      expect(actual).toMatchObject(expected);
    });

    it("should complement value by empty string when value doesn't exist", () => {
      // arrange
      const input: EstablishedEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Established,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          versions: [
            {
              name: "nana1",
            },
            {
              name: "nana2",
            },
          ],
        },
      };

      const expected: PostParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        subparts: [
          {
            subpartId: input.detail.versions[0].name,
            subpartVersion: "",
          },
          {
            subpartId: input.detail.versions[1].name,
            subpartVersion: "",
          },
        ],
      };

      // act
      const actual = controller.createAssetVersionsService(input);

      // assert
      expect(actual).toMatchObject(expected);
    });
  });

  describe(EstablishedController.prototype.createInsertEstablished.name, () => {
    it("should return typeId, assetId and versions", () => {
      // arrange
      const input: EstablishedEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Established,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          versions: [
            {
              name: "nana1",
              value: "vava1",
            },
            {
              name: "nana2",
              value: "vava2",
            },
          ],
        },
      };

      const expected: EstablishedParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        versions: input.detail.versions,
      };

      // act
      const actual = controller.createInsertEstablished(input);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
