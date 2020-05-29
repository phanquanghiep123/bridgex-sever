import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { ConnectionController } from "./connection.controller";
import { AssetStatusService } from "../../service/asset-status/asset-status.service";
import { GuardMqttMessage } from "../mqtt-message.guard";
import { LoggerService } from "../../service/logger";
import { GuardConnectionEvent } from "./connection.controller.guard";
import { UpsertConnectionParams, EAssetStatus } from "../../service/asset-status";
import { ConnectionEventPayload, EConnection } from "./connection.controller.i";
import { EMessageType, EMessageName } from "../mqtt-message.i";
import { AssetEventListService, ConnectedParams, DisconnectedParams } from "../../service/event-list";

describe(ConnectionController.name, () => {
  let controller: ConnectionController;
  let assetStatusService: AssetStatusService;
  let eventListService: AssetEventListService;
  let guardMqttMessage: GuardMqttMessage;
  let guardConnected: GuardConnectionEvent;
  let loggerService: LoggerService;

  class AssetStatusServiceMock {
    public upsertConnection$ = jest.fn();
    public createUpsertConnectionParams = jest.fn();
    public createInsertConnectionParams = jest.fn();
  }
  class AssetEventListServiceMock {
    public insertConnected$ = jest.fn();
    public insertDisconnected$ = jest.fn();
  }
  class GuardMqttMessageMock {
    public isMqttMessagePayload = jest.fn();
  }
  class GuardConnectionEventMock {
    public isConnectionEvent = jest.fn();
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
      controllers: [ConnectionController],
      providers: [
        { provide: AssetStatusService, useClass: AssetStatusServiceMock },
        { provide: AssetEventListService, useClass: AssetEventListServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: GuardMqttMessage, useClass: GuardMqttMessageMock },
        { provide: GuardConnectionEvent, useClass: GuardConnectionEventMock },
      ],
    }).compile();

    controller = module.get<ConnectionController>(ConnectionController);
    assetStatusService = module.get<AssetStatusService>(AssetStatusService);
    eventListService = module.get<AssetEventListService>(AssetEventListService);
    guardMqttMessage = module.get(GuardMqttMessage);
    guardConnected = module.get(GuardConnectionEvent);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(assetStatusService).toBeDefined();
    expect(eventListService).toBeDefined();
    expect(guardMqttMessage).toBeDefined();
    expect(guardConnected).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(ConnectionController.prototype.handleConnectionEvent$.name, () => {
    let payload: ConnectionEventPayload;

    beforeEach(() => {
      payload = {
        type: EMessageType.Event,
        name: EMessageName.Connection,
        assetMetaData: {
          typeId: "typeId",
          assetId: "assetId",
        },
        version: 1,
        detail: {
          ipAddress: "192.168.0.1",
          connection: EConnection.Connected,
        },
      };
    });

    it(`should call ${GuardMqttMessage.prototype.isMqttMessagePayload.name} to check payload`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(false);

      const expected = payload;

      // assert
      return controller
        .handleConnectionEvent$(payload as any)
        .toPromise()
        .then(() => expect(guardMqttMessage.isMqttMessagePayload).toHaveBeenCalledWith(expected))
        .catch((e) => fail(e));
    });

    it(`should call ${GuardConnectionEvent.prototype.isConnectionEvent.name} to check payload detail`, () => {
      // arrange
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardConnected, "isConnectionEvent").mockReturnValue(false);

      const expected = payload.detail;

      // assert
      return controller
        .handleConnectionEvent$(payload as any)
        .toPromise()
        .then(() => expect(guardConnected.isConnectionEvent).toHaveBeenCalledWith(expected))
        .catch((e) => fail(e));
    });

    it(`should call ${AssetStatusService.prototype.upsertConnection$.name} with value returned by ${ConnectionController.prototype.createUpsertConnectionParams.name}`, () => {
      // arrange
      const returnValue: UpsertConnectionParams = {
        typeId: "tyty",
        assetId: "asas",
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardConnected, "isConnectionEvent").mockReturnValue(true);
      jest.spyOn(controller, "createUpsertConnectionParams").mockReturnValue(returnValue);
      jest.spyOn(assetStatusService, "upsertConnection$").mockReturnValue(throwError({}));

      const expected = {
        createUpsertConnectionParams: payload,
        upsertConnection: returnValue,
      };

      // act
      return controller
        .handleConnectionEvent$(payload as any)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createUpsertConnectionParams).toHaveBeenCalledWith(expected.createUpsertConnectionParams);
          expect(assetStatusService.upsertConnection$).toHaveBeenCalledWith(expected.upsertConnection);
          expect(loggerService.error).toHaveBeenCalledTimes(1);
        })
        .catch((e) => fail(e));
    });

    it(`should call ${AssetEventListService.prototype.insertConnected$.name} when connection === ${EConnection.Connected}`, () => {
      // arrange
      payload.detail.connection = EConnection.Connected;
      const returnValue: ConnectedParams = {
        typeId: "tyty",
        assetId: "asas",
        ipAddress: "ipip",
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardConnected, "isConnectionEvent").mockReturnValue(true);
      jest.spyOn(controller, "createUpsertConnectionParams").mockReturnValue({} as any);
      jest.spyOn(assetStatusService, "upsertConnection$").mockReturnValue(of(null));
      jest.spyOn(controller, "createInsertConnectionParams").mockReturnValue(returnValue);
      jest.spyOn(eventListService, "insertConnected$").mockReturnValue(throwError({}));

      const expected = {
        createInsertConnectionParams: payload,
        insertConnected: returnValue,
      };

      // act
      return controller
        .handleConnectionEvent$(payload as any)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createInsertConnectionParams).toHaveBeenCalledWith(expected.createInsertConnectionParams);
          expect(eventListService.insertConnected$).toHaveBeenCalledWith(expected.insertConnected);
          expect(loggerService.error).toHaveBeenCalledTimes(1);
        })
        .catch((e) => fail(e));
    });

    it(`should call ${AssetEventListService.prototype.insertDisconnected$.name} when connection === ${EConnection.Disconnected}`, () => {
      // arrange
      payload.detail.connection = EConnection.Disconnected;
      const returnValue: DisconnectedParams = {
        typeId: "tyty",
        assetId: "asas",
      };
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardConnected, "isConnectionEvent").mockReturnValue(true);
      jest.spyOn(controller, "createUpsertConnectionParams").mockReturnValue({} as any);
      jest.spyOn(assetStatusService, "upsertConnection$").mockReturnValue(of(null));
      jest.spyOn(controller, "createInsertConnectionParams").mockReturnValue(returnValue);
      jest.spyOn(eventListService, "insertDisconnected$").mockReturnValue(throwError({}));

      const expected = {
        createInsertConnectionParams: payload,
        insertDisconnected: returnValue,
      };

      // act
      return controller
        .handleConnectionEvent$(payload as any)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createInsertConnectionParams).toHaveBeenCalledWith(expected.createInsertConnectionParams);
          expect(eventListService.insertDisconnected$).toHaveBeenCalledWith(expected.insertDisconnected);
          expect(loggerService.error).toHaveBeenCalledTimes(1);
        })
        .catch((e) => fail(e));
    });

    it(`should not call ${AssetEventListService.prototype.insertDisconnected$.name} and ${AssetEventListService.prototype.insertConnected$.name} when connection is invalid`, () => {
      // arrange
      payload.detail.connection = "" as any;
      jest.spyOn(guardMqttMessage, "isMqttMessagePayload").mockReturnValue(true);
      jest.spyOn(guardConnected, "isConnectionEvent").mockReturnValue(true);
      jest.spyOn(controller, "createUpsertConnectionParams").mockReturnValue({} as any);
      jest.spyOn(assetStatusService, "upsertConnection$").mockReturnValue(of(null));
      jest.spyOn(controller, "createInsertConnectionParams").mockReturnValue({} as any);
      jest.spyOn(eventListService, "insertDisconnected$").mockReturnValue(of(null));

      // act
      return controller
        .handleConnectionEvent$(payload as any)
        .toPromise()
        .then((data) => {
          expect(data).toEqual(null);
          expect(controller.createInsertConnectionParams).not.toHaveBeenCalled();
          expect(eventListService.insertDisconnected$).not.toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });
  });

  describe(ConnectionController.prototype.createUpsertConnectionParams.name, () => {
    it("should return definitely typeId and assetId", () => {
      // arrange
      const input: ConnectionEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Connection,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          ipAddress: "192.168.0.1",
          connection: EConnection.Connected,
        },
      };

      const expected: UpsertConnectionParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
      };

      // act
      const actual = controller.createUpsertConnectionParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });

    it("should also return ipAddress when input has ipAddress in detail", () => {
      // arrange
      const input: ConnectionEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Connection,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          ipAddress: "192.168.0.1",
          connection: EConnection.Connected,
        },
      };

      const expected: UpsertConnectionParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        ipAddress: input.detail.ipAddress,
      };

      // act
      const actual = controller.createUpsertConnectionParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });

    it("should return undefined about ipAddress when input doesn't have ipAddress in detail", () => {
      // arrange
      const input: ConnectionEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Connection,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          // ipAddress: "192.168.0.1",
          connection: EConnection.Connected,
        },
      };

      const expected: UpsertConnectionParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        ipAddress: undefined,
      };

      // act
      const actual = controller.createUpsertConnectionParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });

    it(`should return ${EAssetStatus.Missing} about status when input has ${EConnection.Disconnected} about connection of detail`, () => {
      // arrange
      const input: ConnectionEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Connection,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          // ipAddress: "192.168.0.1",
          connection: EConnection.Disconnected,
        },
      };

      const expected: UpsertConnectionParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        ipAddress: undefined,
        status: EAssetStatus.Missing,
      };

      // act
      const actual = controller.createUpsertConnectionParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });

    it(`should return undefined about status when input has ${EConnection.Connected} about connection of detail because system can't understand whether asset is Good or Error`, () => {
      // arrange
      const input: ConnectionEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Connection,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          // ipAddress: "192.168.0.1",
          connection: EConnection.Connected,
        },
      };

      const expected: UpsertConnectionParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        ipAddress: undefined,
        status: EAssetStatus.Online,
      };

      // act
      const actual = controller.createUpsertConnectionParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });
  });

  describe(ConnectionController.prototype.createInsertConnectionParams.name, () => {
    it("should return ConnectedParams when ipAddress exists", () => {
      const input: ConnectionEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Connection,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          ipAddress: "192.168.0.1",
          connection: EConnection.Connected,
        },
      };

      const expected: ConnectedParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
        ipAddress: input.detail.ipAddress,
      };

      // act
      const actual = controller.createInsertConnectionParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });

    it("should return DisconnectedParams when ipAddress doesn't exist", () => {
      const input: ConnectionEventPayload = {
        type: EMessageType.Event,
        name: EMessageName.Connection,
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        version: 1,
        detail: {
          connection: EConnection.Connected,
        },
      };

      const expected: DisconnectedParams = {
        typeId: input.assetMetaData.typeId,
        assetId: input.assetMetaData.assetId,
      };

      // act
      const actual = controller.createInsertConnectionParams(input);

      // assert
      expect(actual).toMatchObject(expected);
    });
  });
});
