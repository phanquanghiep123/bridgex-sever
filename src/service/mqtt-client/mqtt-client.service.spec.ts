import { Test, TestingModule } from "@nestjs/testing";

import { MqttClientService } from "./mqtt-client.service";
import { LoggerService } from "../logger/logger.service";

describe("MqttClientService", () => {
  let service: MqttClientService;
  let loggerService: LoggerServiceMock;
  let client: MqttClientMock;

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class MqttClientMock {
    public disconnecting = false;
    public end = jest.fn();
    public publish = jest.fn((...args) => args[args.length - 1]());
  }

  class MqttServiceMock {
    public createClient = jest.fn();
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    client = new MqttClientMock();
    const mqttServiceMock = new MqttServiceMock();
    mqttServiceMock.createClient.mockReturnValue(client);

    // @Inject("MqttService") mqttService: ClientMqtt,

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MqttClientService,
        { provide: "MqttService", useValue: mqttServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(MqttClientService);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(MqttClientService.prototype.onModuleDestroy.name, () => {
    it("should not call client.end() if client is disconnecting", () => {
      // arrange
      client.disconnecting = true;

      // act
      service.onModuleDestroy();

      // assert
      expect(client.end).not.toHaveBeenCalled();
    });

    it("should call client.end() if client is not disconnecting", () => {
      // arrange
      client.disconnecting = false;

      // act
      service.onModuleDestroy();

      // assert
      expect(client.end).toHaveBeenCalled();
    });
  });

  describe(MqttClientService.prototype.publish$.name, () => {
    it("should call client.publish with expected params", () => {
      // arrange
      const topic = "some/topic";
      const payload = { this: { is: "test data" } };
      const expected = {
        topic,
        payload: JSON.stringify(payload),
        opts: { qos: 0, retain: false },
      };

      // act
      return (
        service
          .publish$(topic, payload)
          .toPromise()
          // assert
          .then(() => expect(client.publish).toHaveBeenCalledWith(expected.topic, expected.payload, expected.opts, expect.anything()))
          .catch(fail)
      );
    });

    it("should return expected data", () => {
      // arrange
      const topic = "some/topic";
      const payload = { this: { is: "test data" } };
      const expected = {
        topic,
        payload,
        opts: { qos: 0, retain: false },
      };

      // act
      return (
        service
          .publish$(topic, payload)
          .toPromise()
          // assert
          .then((actual) => expect(actual).toEqual(expected))
          .catch(fail)
      );
    });
  });

  describe(MqttClientService.prototype.publishRetain$.name, () => {
    it("should call client.publish with expected params", () => {
      // arrange
      const topic = "some/topic";
      const payload = { this: { is: "test data" } };
      const expected = {
        topic,
        payload: JSON.stringify(payload),
        opts: { qos: 0, retain: true },
      };

      // act
      return (
        service
          .publishRetain$(topic, payload)
          .toPromise()
          // assert
          .then(() => expect(client.publish).toHaveBeenCalledWith(expected.topic, expected.payload, expected.opts, expect.anything()))
          .catch(fail)
      );
    });

    it("should return expected data", () => {
      // arrange
      const topic = "some/topic";
      const payload = { this: { is: "test data" } };
      const expected = {
        topic,
        payload,
        opts: { qos: 0, retain: true },
      };

      // act
      return (
        service
          .publishRetain$(topic, payload)
          .toPromise()
          // assert
          .then((actual) => expect(actual).toEqual(expected))
          .catch(fail)
      );
    });
  });

  describe(MqttClientService.prototype.releaseRetain$.name, () => {
    it("should call client.publish with expected params", () => {
      // arrange
      const topic = "some/topic";
      const expected = {
        topic,
        payload: "",
        opts: { qos: 0, retain: true },
      };

      // act
      return (
        service
          .releaseRetain$(topic)
          .toPromise()
          // assert
          .then(() => expect(client.publish).toHaveBeenCalledWith(expected.topic, expected.payload, expected.opts, expect.anything()))
          .catch(fail)
      );
    });

    it("should return expected data", () => {
      // arrange
      const topic = "some/topic";
      const expected = {
        topic,
        payload: "",
        opts: { qos: 0, retain: true },
      };

      // act
      return (
        service
          .releaseRetain$(topic)
          .toPromise()
          // assert
          .then((actual) => expect(actual).toEqual(expected))
          .catch(fail)
      );
    });
  });
});
