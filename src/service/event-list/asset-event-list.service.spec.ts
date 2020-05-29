import { Test, TestingModule } from "@nestjs/testing";
import { of } from "rxjs";

import { AssetEventListService } from ".";
import { EImportance } from "./event-list.service.i";
import { EventListService } from "./event-list.service";
import { LoggerService } from "../logger/logger.service";

describe("AssetEventListService", () => {
  let service: AssetEventListService;
  let eventListService: EventListService;

  class EventListServiceMock {
    public insertAssetEvent$ = jest.fn(() => of(null));
    public importanceMap = {
      event: {
        connected: EImportance.Information,
        disconnected: EImportance.Information,
        established: EImportance.Information,
        assetStatusError: EImportance.Error,
        firmwareUpdated: EImportance.Information,
      },
    };
    public subjectMap = {
      event: {
        connected: "Device ${assetId} / ${typeId} : Connected ( IP Address : ${ipAddress} )",
        disconnected: "Device ${assetId} / ${typeId} : Disconnected",
        established: "Device ${assetId} / ${typeId} : Established versions：${versions}",
        assetStatusError: "Device ${assetId} / ${typeId} : Error : ${errorCode} ( ${errorMessage} )",
        firmwareUpdated: "Device ${assetId} / ${typeId} : Firmware updated ${packageList}",
      },
    };
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
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetEventListService,
        { provide: EventListService, useClass: EventListServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(AssetEventListService);
    eventListService = module.get(EventListService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(eventListService).toBeDefined();
  });

  describe("insertConnected$", () => {
    it("should call insertAssetEvent$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          ipAddress: "ipip",
        },
      };

      const expected = {
        importance: eventListService.importanceMap.event.connected,
        subject: eventListService.subjectMap.event.connected,
        params: input.params,
      };
      // act
      return service
        .insertConnected$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertAssetEvent$).toHaveBeenCalledWith(expected.importance, expected.subject, expected.params);
        })
        .catch((e) => fail(e));
    });
  });

  describe("insertDisconnected$", () => {
    it("should call insertAssetEvent$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
        },
      };

      const expected = {
        importance: eventListService.importanceMap.event.disconnected,
        subject: eventListService.subjectMap.event.disconnected,
        params: input.params,
      };
      // act
      return service
        .insertDisconnected$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertAssetEvent$).toHaveBeenCalledWith(expected.importance, expected.subject, expected.params);
        })
        .catch((e) => fail(e));
    });
  });

  describe("insertEstablished$", () => {
    it("should call insertAssetEvent$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          versions: [{ test01: true }, { test02: 123 }],
        },
      };

      const expected = {
        importance: eventListService.importanceMap.event.established,
        subject: eventListService.subjectMap.event.established,
        params: input.params,
      };
      // act
      return service
        .insertEstablished$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertAssetEvent$).toHaveBeenCalledWith(expected.importance, expected.subject, expected.params);
        })
        .catch((e) => fail(e));
    });
  });

  describe("insertAssetStatusError$", () => {
    it("should call insertAssetEvent$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          errorCode: "erer",
          errorMessage: "meme",
        },
      };

      const expected = {
        importance: eventListService.importanceMap.event.assetStatusError,
        subject: eventListService.subjectMap.event.assetStatusError,
        params: input.params,
      };
      // act
      return service
        .insertAssetStatusError$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertAssetEvent$).toHaveBeenCalledWith(expected.importance, expected.subject, expected.params);
        })
        .catch((e) => fail(e));
    });
  });

  describe("insertFirmwareUpdated$", () => {
    it("should call insertAssetEvent$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          packageList: ["aaa", "bbb"],
        },
      };

      const expected = {
        importance: eventListService.importanceMap.event.firmwareUpdated,
        subject: eventListService.subjectMap.event.firmwareUpdated,
        params: input.params,
      };
      // act
      return service
        .insertFirmwareUpdated$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertAssetEvent$).toHaveBeenCalledWith(expected.importance, expected.subject, expected.params);
        })
        .catch((e) => fail(e));
    });
  });
});
