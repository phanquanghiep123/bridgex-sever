import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { AssetStatusUpdatedController } from "./asset-status-updated.controller";
import { AssetStatusService } from "../../service/asset-status/asset-status.service";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { GuardAssetUpdatedStatus } from "./asset-status-updated.controller.guard";
import { LoggerService } from "../../service/logger";
import { EMessageType, EMessageName } from "../mqtt-message.i";
import { UpsertAssetStatusParams } from "../../service/asset-status";
import { EAssetStatus, AssetStatusUpdatedEventPayload } from "./asset-status-updated.controller.i";
import { AssetStatusErrorParams, AssetEventListService } from "../../service/event-list";

describe(AssetStatusUpdatedController.name, () => {
  let controller: AssetStatusUpdatedController;
  let assetStatusService: AssetStatusService;
  let eventListService: AssetEventListService;
  let guardMqttMessage: GuardMqttMessage;
  let guardAssetStatus: GuardAssetUpdatedStatus;
  let loggerService: LoggerService;

  class AssetStatusServiceMock {
    public upsertAssetStatus$ = jest.fn();
  }
  class AssetEventListServiceMock {
    public insertAssetStatusError$ = jest.fn();
  }
  class GuardMqttMessageMock {
    public isMqttMessagePayload = jest.fn();
  }
  class GuardAssetStatusMock {
    public isAssetStatusUpdatedEvent = jest.fn();
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
      controllers: [AssetStatusUpdatedController],
      providers: [
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: AssetEventListService, useClass: AssetEventListServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: GuardMqttMessage, useClass: GuardMqttMessageMock },
        { provide: GuardAssetUpdatedStatus, useClass: GuardAssetStatusMock },
      ],
    }).compile();

    controller = module.get<AssetStatusUpdatedController>(AssetStatusUpdatedController);
    assetStatusService = module.get<AssetStatusService>(AssetStatusService);
    eventListService = module.get<AssetEventListService>(AssetEventListService);
    guardMqttMessage = module.get(GuardMqttMessage);
    guardAssetStatus = module.get(GuardAssetUpdatedStatus);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetStatusService).toBeDefined();
    expect(eventListService).toBeDefined();
    expect(guardMqttMessage).toBeDefined();
    expect(guardAssetStatus).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(AssetStatusUpdatedController.prototype.handleAssetStatusEvent$.name, () => {
    it("should not call upsertAssetStatus$ when payload is invalid form", () => {
      // arrange
      const payload = { type: EMessageType.Event, name: EMessageName.AssetStatusUpdated, detail: { status: EAssetStatus.Good } };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(false);
      jest.spyOn(guardAssetStatus, "isAssetStatusUpdatedEvent").mockReturnValue(false);

      // act
      return controller
        .handleAssetStatusEvent$(payload)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(payload);
          expect(guardAssetStatus.isAssetStatusUpdatedEvent).not.toHaveBeenCalled();
          expect(assetStatusService.upsertAssetStatus$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it("should not call upsertAssetStatus$ when detail is invalid form", () => {
      // arrange
      const payload = { type: EMessageType.Event, name: EMessageName.AssetStatusUpdated, detail: { status: EAssetStatus.Good } };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardAssetStatus, "isAssetStatusUpdatedEvent").mockReturnValue(false);

      // act
      return controller
        .handleAssetStatusEvent$(payload)
        .toPromise()
        .then(() => {
          expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(payload);
          expect(guardAssetStatus.isAssetStatusUpdatedEvent).toHaveBeenCalledWith(payload.detail);
          expect(assetStatusService.upsertAssetStatus$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });

    it(`should call ${AssetStatusService.prototype.upsertAssetStatus$.name} with params given by ${AssetStatusUpdatedController.prototype.createUpsertAssetStatusParams.name}`, () => {
      // arrange
      const payload = {
        type: EMessageType.Event,
        name: EMessageName.AssetStatusUpdated,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: { status: EAssetStatus.Good },
      };
      const returnValue: UpsertAssetStatusParams = {
        typeId: "tyty",
        assetId: "asas",
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardAssetStatus, "isAssetStatusUpdatedEvent").mockReturnValue(true);
      jest.spyOn(controller, "createUpsertAssetStatusParams").mockReturnValue(returnValue);
      jest.spyOn(assetStatusService, "upsertAssetStatus$").mockReturnValue(throwError({}));

      const expected = {
        createUpsertAssetStatusParams: payload,
        upsertAssetStatus: returnValue,
      };

      return controller
        .handleAssetStatusEvent$(payload)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createUpsertAssetStatusParams).toHaveBeenCalledWith(expected.createUpsertAssetStatusParams);
          expect(assetStatusService.upsertAssetStatus$).toHaveBeenCalledWith(expected.upsertAssetStatus);
          expect(loggerService.error).toHaveBeenCalledTimes(1);
        })
        .catch((e) => fail(e));
    });

    it(`should call ${AssetEventListService.prototype.insertAssetStatusError$.name} when status === Error`, () => {
      // arrange
      const payload = {
        type: EMessageType.Event,
        name: EMessageName.AssetStatusUpdated,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: { status: EAssetStatus.Error },
      };

      const returnValue: AssetStatusErrorParams = {
        typeId: "tyty",
        assetId: "asas",
        errorCode: "code",
      };

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardAssetStatus, "isAssetStatusUpdatedEvent").mockReturnValue(true);
      jest.spyOn(controller, "createUpsertAssetStatusParams").mockReturnValue({} as any);
      jest.spyOn(assetStatusService, "upsertAssetStatus$").mockReturnValue(of(null));
      jest.spyOn(controller, "createAssetStatusErrorParams").mockReturnValue(returnValue);
      jest.spyOn(eventListService, "insertAssetStatusError$").mockReturnValue(throwError({}));

      const expected = {
        createAssetStatusErrorParams: payload,
        insertAssetStatusError: returnValue,
      };

      return controller
        .handleAssetStatusEvent$(payload)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createAssetStatusErrorParams).toHaveBeenCalledWith(expected.createAssetStatusErrorParams);
          expect(eventListService.insertAssetStatusError$).toHaveBeenCalledWith(expected.insertAssetStatusError);
          expect(loggerService.error).toHaveBeenCalledTimes(1);
        })
        .catch((e) => fail(e));
    });

    it(`should not call ${AssetEventListService.prototype.insertAssetStatusError$.name} when status !== Error`, () => {
      // arrange
      const payload = {
        type: EMessageType.Event,
        name: EMessageName.AssetStatusUpdated,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: { status: EAssetStatus.Good },
      };

      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardAssetStatus, "isAssetStatusUpdatedEvent").mockReturnValue(true);
      jest.spyOn(controller, "createUpsertAssetStatusParams").mockReturnValue({} as any);
      jest.spyOn(assetStatusService, "upsertAssetStatus$").mockReturnValue(of(null));
      jest.spyOn(controller, "createAssetStatusErrorParams").mockReturnValue({} as any);
      jest.spyOn(eventListService, "insertAssetStatusError$").mockReturnValue(of(null));

      return controller
        .handleAssetStatusEvent$(payload)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createUpsertAssetStatusParams).toHaveBeenCalled();
          expect(assetStatusService.upsertAssetStatus$).toHaveBeenCalled();
          expect(controller.createAssetStatusErrorParams).not.toHaveBeenCalled();
          expect(eventListService.insertAssetStatusError$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });
  });

  describe(AssetStatusUpdatedController.prototype.createUpsertAssetStatusParams.name, () => {
    it("should return typeId, assetId, status and errorCode", () => {
      // arrange
      const input: AssetStatusUpdatedEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.AssetStatusUpdated,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          status: EAssetStatus.Good,
        },
      };

      const expected: UpsertAssetStatusParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        status: input.detail.status,
        errorCode: input.detail.errorCode,
      };

      // act
      const actual = controller.createUpsertAssetStatusParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });
  });

  describe(AssetStatusUpdatedController.prototype.createAssetStatusErrorParams.name, () => {
    it("should return typeId, assetId, errorCode and errorMessage", () => {
      // arrange
      const input: AssetStatusUpdatedEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.AssetStatusUpdated,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          status: EAssetStatus.Error,
          errorCode: "errorCode",
          errorMsg: "emes",
        },
      };

      const expected: AssetStatusErrorParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        errorCode: input.detail.errorCode as string,
        errorMessage: input.detail.errorMsg,
      };

      // act
      const actual = controller.createAssetStatusErrorParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });

    it("should return empty string about errorCode when errorCode is empty", () => {
      // arrange
      const input: AssetStatusUpdatedEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.AssetStatusUpdated,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          status: EAssetStatus.Error,
          errorMsg: "emes",
        },
      };

      const expected: AssetStatusErrorParams = {
        typeId: expect.any(String),
        assetId: expect.any(String),
        errorCode: "",
        errorMessage: expect.any(String),
      };

      // act
      const actual = controller.createAssetStatusErrorParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });
  });
});
