jest.mock("fs").mock("path");

import { MqttConfig, fs } from "./mqtt";

describe("mqtt", () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor()", () => {
    beforeEach(() => {});

    it("should init default values when env/config files do not exist", () => {
      // arrage
      const expected = {
        port: 1883,
        hostname: "localhost",
        protocol: "mqtt",
        protocolVersion: 4,
        username: undefined,
        password: undefined,
        cert: undefined,
        rejectUnauthorized: false,
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(undefined);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // act
      const actual = new MqttConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init default values when config file do not have mqtt params", () => {
      // arrage
      const expected = {
        port: 1883,
        hostname: "localhost",
        protocol: "mqtt",
        protocolVersion: 4,
        username: undefined,
        password: undefined,
        cert: undefined,
        rejectUnauthorized: false,
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({}));
      (fs.existsSync as jest.Mock).mockImplementation(() => {
        throw new Error();
      });

      // act
      const actual = new MqttConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from config file", () => {
      // arrage
      const config = {
        port: 1234,
        hostname: "from-config-host",
        protocol: "mqtts",
        protocolVersion: 5678,
        username: "from-config-username",
        password: "from-config-password",
        certPath: "from-config-cert",
        rejectUnauthorized: true,
      };

      const expected = {
        port: 1234,
        hostname: "from-config-host",
        protocol: "mqtts",
        protocolVersion: 5678,
        username: "from-config-username",
        password: "from-config-password",
        cert: "cert mock value",
        rejectUnauthorized: true,
      };

      (fs.readFileSync as jest.Mock).mockReturnValueOnce(JSON.stringify({ mqtt: { ...config } }));
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValueOnce("cert mock value");

      // act
      const actual = new MqttConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env", () => {
      // arrage
      const expected = {
        port: 9012,
        hostname: "from-env-host",
        protocol: "mqtts",
        protocolVersion: 3456,
        username: "from-env-username",
        password: "from-env-password",
        cert: "cert mock value",
        rejectUnauthorized: true,
      };

      const env = {
        MQTT_BROKER_PORT: "9012",
        MQTT_BROKER_HOSTNAME: "from-env-host",
        MQTT_PROTOCOL: "mqtts",
        MQTT_PROTOCOL_VER: "3456",
        MQTT_USERNAME: "from-env-username",
        MQTT_PASSWORD: "from-env-password",
        MQTT_CERT_PATH: "from-env-cert",
      };

      (fs.readFileSync as jest.Mock).mockReturnValueOnce("read file sync mock");
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValueOnce("cert mock value");

      // act
      const actual = new MqttConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env prior to config file", () => {
      // arrage
      const expected = {
        port: 9012,
        hostname: "from-env-host",
        protocol: "mqtts",
        protocolVersion: 3456,
        username: "from-env-username",
        password: "from-env-password",
        cert: "cert mock value",
        rejectUnauthorized: true,
      };

      const env = {
        MQTT_BROKER_PORT: "9012",
        MQTT_BROKER_HOSTNAME: "from-env-host",
        MQTT_PROTOCOL: "mqtts",
        MQTT_PROTOCOL_VER: "3456",
        MQTT_USERNAME: "from-env-username",
        MQTT_PASSWORD: "from-env-password",
        MQTT_CERT_PATH: "from-env-cert",
      };

      (fs.readFileSync as jest.Mock).mockReturnValueOnce("read file sync mock");
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValueOnce("cert mock value");

      // act
      const actual = new MqttConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from specified file", () => {
      // arrage
      const env = {
        MQTT_CONFIG_PATH: "from-env-config-path",
      };

      const config = {
        port: 1234,
        hostname: "from-config-host",
        protocol: "mqtts",
        protocolVersion: 5678,
        username: "from-config-username",
        password: "from-config-password",
        certPath: "from-config-cert",
      };

      const expected = {
        port: 1234,
        hostname: "from-config-host",
        protocol: "mqtts",
        protocolVersion: 5678,
        username: "from-config-username",
        password: "from-config-password",
        cert: "cert mock value",
        rejectUnauthorized: true,
      };

      (fs.readFileSync as jest.Mock).mockReturnValueOnce(JSON.stringify({ mqtt: config }));
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValueOnce("cert mock value");

      // act
      const actual = new MqttConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
