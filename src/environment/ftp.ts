import _fs from "fs";
import path from "path";

// ------------------------------
export const fs = { ..._fs };
// ------------------------------

// from process env
export interface IEnv {
  FTP_CONFIG_PATH?: string;
  FTP_PROTOCOL?: string;
  FTP_SERVER_HOST?: string;
  FTP_SERVER_PORT?: string;
  FTP_LOGIN_USER?: string;
  FTP_LOGIN_PASSWORD?: string;
  FTP_PATH_PREFIX?: string;
}

// from config file
export interface IConf {
  protocol?: string;
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  pathPrefix?: string;
}

export class FtpConfig {
  public static readonly defaultCconfigFile = path.join(__dirname, "../assets/conf/app-config.json");
  public static readonly configName = "ftp";

  public protocol = "ftp";
  public host = "localhost";
  public port = 21;
  public user = "";
  public pass = "";
  public pathPrefix = "";

  /**
   * Parses config files and process env.
   */
  constructor(env: IEnv = process.env) {
    let conf: IConf = {};

    try {
      const content = fs.readFileSync(env.FTP_CONFIG_PATH || FtpConfig.defaultCconfigFile, "utf-8");
      conf = JSON.parse(content)[FtpConfig.configName] || {};
    } catch {}

    this.protocol = this.isGetFtpProtocol(env.FTP_PROTOCOL || conf.protocol) || this.protocol;
    this.host = env.FTP_SERVER_HOST || conf.host || this.host;
    this.port = Number(env.FTP_SERVER_PORT || conf.port || this.port);
    this.user = env.FTP_LOGIN_USER || conf.user || this.user;
    this.pass = env.FTP_LOGIN_PASSWORD || conf.pass || this.pass;
    this.pathPrefix = env.FTP_PATH_PREFIX || conf.pathPrefix || this.pathPrefix;
  }

  public isGetFtpProtocol(value: string | undefined): "ftp" | "ftps" | undefined {
    return !!value && /^ftp|ftps$/.test(value) ? (value as "ftp" | "ftps") : undefined;
  }
}
