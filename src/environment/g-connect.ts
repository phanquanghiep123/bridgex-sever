import _fs from "fs";
import _path from "path";

// ------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
// ------------------------------

// from process env
export interface IEnv {
  DATABASE_ACCESS_SERVICE_CONFIG_PATH?: string;
  DATABASE_ACCESS_SERVICE_BASE_URL?: string;
  USER_AUTH_SERVICE_BASE_URL?: string;
}

export interface IConf {
  dasBaseUrl?: string;
  userAuthBaseUrl?: string;
}

export class GConnectConfig {
  public static readonly defaultCconfigFile = path.join(__dirname, "../assets/conf/app-config.json");
  public static readonly configName = "gConnect";

  public dasBaseUrl = "http://localhost:3001";
  public userAuthBaseUrl = "http://localhost:3002";

  /**
   * Parses config files and process env.
   */
  constructor(env: IEnv = process.env) {
    let conf: IConf = {};

    try {
      const content = fs.readFileSync(env.DATABASE_ACCESS_SERVICE_CONFIG_PATH || GConnectConfig.defaultCconfigFile, "utf-8");
      conf = JSON.parse(content)[GConnectConfig.configName] || {};
    } catch {}

    this.dasBaseUrl = env.DATABASE_ACCESS_SERVICE_BASE_URL || conf.dasBaseUrl || this.dasBaseUrl;
    this.userAuthBaseUrl = env.USER_AUTH_SERVICE_BASE_URL || conf.userAuthBaseUrl || this.userAuthBaseUrl;
  }
}
