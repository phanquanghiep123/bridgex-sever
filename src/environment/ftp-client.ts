import _fs from "fs";
import path from "path";

import { ParserUtils } from "./parser-utils";

// ------------------------------
export const fs = { ..._fs };
// ------------------------------

// from process env
export interface IEnv {
  FTP_CLIENT_CONFIG_PATH?: string;
  FTP_CLIENT_SERVER_HOST?: string;
  FTP_CLIENT_SERVER_PORT?: string;
  FTP_CLIENT_SECURE?: string;
  FTP_CLIENT_LOGIN_USER?: string;
  FTP_CLIENT_LOGIN_PASSWORD?: string;
}

// from config file
export interface IConf {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
}

export class FtpClientConfig {
  public static readonly defaultConfigFile = path.join(__dirname, "../assets/conf/app-config.json");
  public static readonly configName = "ftpClient";

  public host = "localhost";
  public port = 21;
  public secure = false;
  public user = "";
  public password = "";

  /**
   * Parses config files and process env.
   */
  constructor(env: IEnv = process.env) {
    let conf: IConf = {};

    try {
      const content = fs.readFileSync(env.FTP_CLIENT_CONFIG_PATH || FtpClientConfig.defaultConfigFile, "utf-8");
      conf = JSON.parse(content)[FtpClientConfig.configName] || {};
    } catch {}

    this.host = env.FTP_CLIENT_SERVER_HOST || conf.host || this.host;
    this.port = Number(env.FTP_CLIENT_SERVER_PORT || conf.port || this.port);
    this.secure = ParserUtils.assignBoolean(this.secure, env.FTP_CLIENT_SECURE, conf.secure);
    this.user = env.FTP_CLIENT_LOGIN_USER || conf.user || this.user;
    this.password = env.FTP_CLIENT_LOGIN_PASSWORD || conf.password || this.password;
  }
}
