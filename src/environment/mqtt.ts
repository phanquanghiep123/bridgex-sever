import _fs from "fs";
import path from "path";
import { MqttClientOptions } from "@nestjs/common/interfaces/external/mqtt-options.interface";
// import { ParserUtils } from "./parser-utils";

// ------------------------------
export const fs = { ..._fs };
// ------------------------------

// from process env
export interface IEnv {
  MQTT_CONFIG_PATH?: string;
  MQTT_BROKER_PORT?: string;
  MQTT_BROKER_HOSTNAME?: string;
  MQTT_PROTOCOL?: string;
  MQTT_PROTOCOL_VER?: string;
  MQTT_USERNAME?: string;
  MQTT_PASSWORD?: string;
  MQTT_CERT_PATH?: string;
}

// from config file
export interface IConf {
  port?: number;
  hostname?: string;
  protocol?: string;
  protocolVersion?: number;
  username?: string;
  password?: string;
  certPath?: string;
}

export class MqttConfig implements MqttClientOptions {
  public static readonly defaultCconfigFile = path.join(__dirname, "../assets/conf/app-config.json");
  public static readonly configName = "mqtt";

  public port = 1883;
  public hostname = "localhost";
  public protocol: "mqtt" | "mqtts" = "mqtt";
  public protocolVersion = 4;
  public username?: string = undefined;
  public password?: string = undefined;
  public cert?: string | string[] | Buffer | Buffer[] = undefined;
  public rejectUnauthorized = false;

  /**
   * Parses config files and process env.
   */
  constructor(env: IEnv = process.env) {
    let conf: IConf = {};

    try {
      const content = fs.readFileSync(env.MQTT_CONFIG_PATH || MqttConfig.defaultCconfigFile, "utf-8");
      conf = JSON.parse(content)[MqttConfig.configName] || {};
    } catch {}

    this.port = Number(env.MQTT_BROKER_PORT || conf.port || this.port);
    this.hostname = env.MQTT_BROKER_HOSTNAME || conf.hostname || this.hostname;
    this.protocol = this.isGetMqttProtocol(env.MQTT_PROTOCOL || conf.protocol) || this.protocol;
    this.protocolVersion = Number(env.MQTT_PROTOCOL_VER || conf.protocolVersion || this.protocolVersion);
    this.username = env.MQTT_USERNAME || conf.username || this.username;
    this.password = env.MQTT_PASSWORD || conf.password || this.password;
    this.cert = this.getCert("", env.MQTT_CERT_PATH || conf.certPath) || this.cert;
    this.rejectUnauthorized = this.cert ? true : false;
  }

  public isGetMqttProtocol(value: string | undefined): "mqtt" | "mqtts" | undefined {
    return !!value && /^mqtt|mqtts$/.test(value) ? (value as "mqtt" | "mqtts") : undefined;
  }

  public getCert(defaultCertPath: string, certPath?: string): string {
    try {
      const mqttCertPath = ((p) => (fs.existsSync(p) ? p : undefined))(certPath || defaultCertPath);
      const cert = mqttCertPath ? fs.readFileSync(mqttCertPath, "utf-8") : "";
      return cert;
    } catch {}

    return "";
  }
}
