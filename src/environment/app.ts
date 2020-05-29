import _fs from "fs";
import _path from "path";

// ------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
// ------------------------------

// from process env
export interface IEnv {
  APP_CONFIG_PATH?: string;
  SERVER_PORT?: string;
  HOSTNAME?: string;
  PRODUCTION?: string;
}

// from config file
export interface IConf {
  port?: number;
  appName?: string;
  version?: string;
  production?: boolean;
}

export class AppConfig implements IConf {
  public static readonly defaultCconfigFile = path.join(__dirname, "../assets/conf/app-config.json");
  public static readonly packageJsonPath = path.join(__dirname, "../../package.json");
  public static readonly configName = "app";

  public appName = "server";
  public version = "0.0.0";
  public port = 3000;
  public production = true;

  constructor(env: IEnv = process.env) {
    let conf: IConf = {};
    let packageJson: { name?: string; version?: string } = {};

    try {
      conf = JSON.parse(fs.readFileSync(env.APP_CONFIG_PATH || AppConfig.defaultCconfigFile, "utf-8"))[AppConfig.configName] || {};
    } catch {}

    try {
      packageJson = JSON.parse(fs.readFileSync(AppConfig.packageJsonPath, "utf-8"));
    } catch {}

    this.port = Number(env.SERVER_PORT || conf.port || this.port);
    this.appName = packageJson.name || this.appName;
    this.version = packageJson.version || this.version;

    if (env.PRODUCTION && /^false$/i.test(env.PRODUCTION)) {
      this.production = false;
    } else if (conf.production === false) {
      this.production = false;
    }
  }
}
