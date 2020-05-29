import { Test, TestingModule } from "@nestjs/testing";

import { of, empty, throwError } from "rxjs";

import { MqttPublishService } from "./mqtt-publish.service";

import {
  SendCreateSessionParams,
  SendCloseSessionParams,
  DownloadPackageParams,
  UploadRetrieveLogParams,
  SendRebootParams,
  SendSelfTestParams,
} from "./mqtt-publish.service.i";

import { LoggerService } from "../logger/logger.service";

import { MqttClientService } from "../mqtt-client";

import { ErrorCode, BridgeXServerError } from "../utils";

// -----------------------------------------

describe("MqttPublishService", () => {
  let service: MqttPublishService;
  let loggerService: LoggerServiceMock;
  let mqttClient: MqttClientServiceMock;

  class MqttClientServiceMock {
    public onModuleDestroy = jest.fn();
    public publish$ = jest.fn(() => empty());
    public publishRetain$ = jest.fn(() => empty());
    public releaseRetain$ = jest.fn(() => empty());
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
        MqttPublishService,
        { provide: MqttClientService, useClass: MqttClientServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(MqttPublishService);
    loggerService = module.get(LoggerService);
    mqttClient = module.get(MqttClientService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(MqttPublishService.prototype.publish$.name, () => {
    it("should call mqttClient.publish$() with expected params", () => {
      // arrange
      const topic = "/this/is/topic";
      const payload = { this: "is", the: "payload" };
      const expected = { topic, payload: { version: 1, sender: "bridge-x-server", ...payload } };

      mqttClient.publish$.mockReturnValue(empty());

      // act
      return (
        service
          .publish$(topic, payload as any)
          .toPromise()
          // assert
          .then(() => expect(mqttClient.publish$).toHaveBeenCalledWith(expected.topic, expected.payload))
          .catch(fail)
      );
    });

    it("should return expected data", () => {
      // arrange
      const topic = "/this/is/topic";
      const payload = { this: "is", the: "payload" };
      const expected = { topic, payload: { version: 1, sender: "bridge-x-server", ...payload } };

      mqttClient.publish$.mockReturnValue(of(null as any) as any);

      // act
      return (
        service
          .publish$(topic, payload as any)
          .toPromise()
          // assert
          .then((actual) => expect(actual).toEqual(expected))
          .catch(fail)
      );
    });

    it("should throw internal error", () => {
      // arrange
      const topic = "/this/is/topic";
      const payload = { this: "is", the: "payload" };
      const err = { this: "is", the: "error" };
      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Unexpected error", err);

      mqttClient.publish$.mockReturnValue(throwError(err));

      // act
      return (
        service
          .publish$(topic, payload as any)
          .toPromise()
          // assert
          .then(fail)
          .catch((actual) => expect(actual).toEqual(expected))
      );
    });
  });

  describe(MqttPublishService.prototype.publishRetain$.name, () => {
    it("should call mqttClient.publishRetain$() with expected params", () => {
      // arrange
      const topic = "/this/is/topic";
      const payload = { this: "is", the: "payload" };
      const expected = { topic, payload: { version: 1, sender: "bridge-x-server", ...payload } };

      mqttClient.publishRetain$.mockReturnValue(empty());

      // act
      return (
        service
          .publishRetain$(topic, payload as any)
          .toPromise()
          // assert
          .then(() => expect(mqttClient.publishRetain$).toHaveBeenCalledWith(expected.topic, expected.payload))
          .catch(fail)
      );
    });

    it("should return expected data", () => {
      // arrange
      const topic = "/this/is/topic";
      const payload = { this: "is", the: "payload" };
      const expected = { topic, payload: { version: 1, sender: "bridge-x-server", ...payload } };

      mqttClient.publishRetain$.mockReturnValue(of(null as any) as any);

      // act
      return (
        service
          .publishRetain$(topic, payload as any)
          .toPromise()
          // assert
          .then((actual) => expect(actual).toEqual(expected))
          .catch(fail)
      );
    });

    it("should throw internal error", () => {
      // arrange
      const topic = "/this/is/topic";
      const payload = { this: "is", the: "payload" };
      const err = { this: "is", the: "error" };
      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Unexpected error", err);

      mqttClient.publishRetain$.mockReturnValue(throwError(err));

      // act
      return (
        service
          .publishRetain$(topic, payload as any)
          .toPromise()
          // assert
          .then(fail)
          .catch((actual) => expect(actual).toEqual(expected))
      );
    });
  });

  describe(MqttPublishService.prototype.releaseRetain$.name, () => {
    it("should call mqttClient.releaseRetain$() with expected params", () => {
      // arrange
      const topic = "/this/is/topic";
      const expected = { topic, payload: { version: 1, sender: "bridge-x-server" } };

      mqttClient.releaseRetain$.mockReturnValue(empty());

      // act
      return (
        service
          .releaseRetain$(topic)
          .toPromise()
          // assert
          .then(() => expect(mqttClient.releaseRetain$).toHaveBeenCalledWith(expected.topic))
          .catch(fail)
      );
    });

    it("should throw internal error", () => {
      // arrange
      const topic = "/this/is/topic";
      const err = { this: "is", the: "error" };
      const expected = new BridgeXServerError(ErrorCode.INTERNAL, "Unexpected error", err);

      mqttClient.releaseRetain$.mockReturnValue(throwError(err));

      // act
      return (
        service
          .releaseRetain$(topic)
          .toPromise()
          // assert
          .then(fail)
          .catch((actual) => expect(actual).toEqual(expected))
      );
    });
  });

  describe(MqttPublishService.prototype.createSessionEvent$.name, () => {
    it("should call service.publish$() with expected params", () => {
      // arrange
      const params = {
        typeId: "tyty",
        assetId: "asas",
        sessionId: "sese",
        topicPrefix: "/glory/g-connect-session/sese",
      } as SendCreateSessionParams;

      const topic = `/glory/g-connect/tyty/asas/event/CreateSession`;
      const expected = {
        type: "Event",
        name: "CreateSession",
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: {
          sessionId: "sese",
          topicPrefix: `/glory/g-connect-session/sese`,
        },
      };

      jest.spyOn(service, "publish$").mockReturnValue(of(null as any));

      // act
      return service
        .createSessionEvent$(params)
        .toPromise()
        .then(() => {
          expect(service.publish$).toHaveBeenCalledWith(topic, expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(MqttPublishService.prototype.closeSessionCommand$.name, () => {
    it("should call service.publish$() with expected params", () => {
      // arrange
      const params = {
        typeId: "tyty",
        assetId: "asas",
        sessionTopic: "stst",
        sessionId: "sese",
        messageId: "meme",
      } as SendCloseSessionParams;

      const topic = `stst/command/CloseSession`;
      const expected = {
        type: "Command",
        name: "CloseSession",
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
          sessionId: "sese",
          messageId: "meme",
        },
      };

      jest.spyOn(service, "publish$").mockReturnValue(of(null as any));

      // act
      return service
        .closeSessionCommand$(params)
        .toPromise()
        .then(() => {
          expect(service.publish$).toHaveBeenCalledWith(topic, expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(MqttPublishService.prototype.createSessionAction$.name, () => {
    it("should call service.publish$() with expected params", () => {
      // arrange
      const params = {
        typeId: "tyty",
        assetId: "asas",
        sessionId: "sese",
        topicPrefix: "/glory/g-connect-session/sese",
      } as SendCreateSessionParams;

      const topic = `/glory/g-connect/tyty/asas/action/CreateSession`;
      const expected = {
        type: "Action",
        name: "CreateSession",
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: {
          sessionId: "sese",
          topicPrefix: `/glory/g-connect-session/sese`,
        },
      };

      jest.spyOn(service, "publish$").mockReturnValue(of(null as any));

      // act
      return service
        .createSessionAction$(params)
        .toPromise()
        .then(() => {
          expect(service.publish$).toHaveBeenCalledWith(topic, expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(MqttPublishService.prototype.closeSessionAction$.name, () => {
    it("should call service.publish$() with expected params", () => {
      // arrange
      const params = {
        typeId: "tyty",
        assetId: "asas",
        sessionId: "sese",
        topicPrefix: "/glory/g-connect-session/sese",
      } as SendCreateSessionParams;

      const topic = `/glory/g-connect/tyty/asas/action/CloseSession`;
      const expected = {
        type: "Action",
        name: "CloseSession",
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
        },
        detail: {
          sessionId: "sese",
          topicPrefix: `/glory/g-connect-session/sese`,
        },
      };

      jest.spyOn(service, "publish$").mockReturnValue(of(null as any));

      // act
      return service
        .closeSessionAction$(params)
        .toPromise()
        .then(() => {
          expect(service.publish$).toHaveBeenCalledWith(topic, expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(MqttPublishService.prototype.downloadPackageCommand$.name, () => {
    it("should call service.publish$() with expected params", () => {
      // arrange
      const params = {
        typeId: "tyty",
        assetId: "asas",
        sessionTopic: "stst",
        sessionId: "sese",
        messageId: "meme",
        protocol: "prpr",
        url: "urur",
        username: "usus",
        password: "papa",
      } as DownloadPackageParams;

      const topic = `stst/command/DownloadPackage`;
      const expected = {
        type: "Command",
        name: "DownloadPackage",
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
          sessionId: "sese",
          messageId: "meme",
        },
        detail: {
          protocol: "prpr",
          url: "urur",
          username: "usus",
          password: "papa",
        },
      };

      jest.spyOn(service, "publishRetain$").mockReturnValue(of(null as any));

      // act
      return service
        .downloadPackageCommand$(params)
        .toPromise()
        .then(() => {
          expect(service.publishRetain$).toHaveBeenCalledWith(topic, expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(MqttPublishService.prototype.uploadRetrieveLogCommand$.name, () => {
    it("should call service.publish$() with expected params", () => {
      // arrange
      const params = {
        typeId: "tyty",
        assetId: "asas",
        sessionTopic: "stst",
        sessionId: "sese",
        messageId: "meme",
        type: ["tptp"],
        protocol: "prpr",
        url: "urur",
        filename: "fifi",
        username: "usus",
        password: "papa",
      } as UploadRetrieveLogParams;

      const topic = `stst/command/RetrieveLog`;
      const expected = {
        type: "Command",
        name: "RetrieveLog",
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
          sessionId: "sese",
          messageId: "meme",
        },
        detail: {
          type: ["tptp"],
          protocol: "prpr",
          url: "urur",
          filename: "fifi",
          username: "usus",
          password: "papa",
        },
      };

      jest.spyOn(service, "publishRetain$").mockReturnValue(of(null as any));

      // act
      return service
        .uploadRetrieveLogCommand$(params)
        .toPromise()
        .then(() => {
          expect(service.publishRetain$).toHaveBeenCalledWith(topic, expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(MqttPublishService.prototype.sendRebootCommand$.name, () => {
    it("should call service.publish$() with expected params", () => {
      // arrange
      const params = {
        typeId: "tyty",
        assetId: "asas",
        sessionTopic: "stst",
        sessionId: "sese",
        messageId: "meme",
      } as SendRebootParams;

      const topic = `stst/command/Reboot`;
      const expected = {
        type: "Command",
        name: "Reboot",
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
          sessionId: "sese",
          messageId: "meme",
        },
      };

      jest.spyOn(service, "publishRetain$").mockReturnValue(of(null as any));

      // act
      return service
        .sendRebootCommand$(params)
        .toPromise()
        .then(() => {
          expect(service.publishRetain$).toHaveBeenCalledWith(topic, expected);
        })
        .catch((e) => fail(e));
    });
  });

  describe(MqttPublishService.prototype.sendSelfTestCommand$.name, () => {
    it("should call service.publish$() with expected params", () => {
      // arrange
      const params = {
        typeId: "tyty",
        assetId: "asas",
        sessionTopic: "stst",
        sessionId: "sese",
        messageId: "meme",
      } as SendSelfTestParams;

      const topic = `stst/command/SelfTest`;
      const expected = {
        type: "Command",
        name: "SelfTest",
        assetMetaData: {
          typeId: "tyty",
          assetId: "asas",
          sessionId: "sese",
          messageId: "meme",
        },
      };

      jest.spyOn(service, "publishRetain$").mockReturnValue(of(null as any));

      // act
      return service
        .sendSelfTestCommand$(params)
        .toPromise()
        .then(() => {
          expect(service.publishRetain$).toHaveBeenCalledWith(topic, expected);
        })
        .catch((e) => fail(e));
    });
  });
});
