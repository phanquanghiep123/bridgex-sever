import _fs from "fs";
import _path from "path";

// ------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
// ------------------------------

// from process env
export interface IEnv {
  COS_CONFIG_PATH?: string;
  COS_ENDPOINT?: string;
  COS_PORT?: string;
  COS_BUCKET?: string;
  COS_HMAC_ACCESS_KEY_ID?: string;
  COS_HMAC_SECRET_ACCESS_KEY?: string;
  COS_PATH_PREFIX?: string;
  ASSET_LOGS_PREFIX?: string;
  LOG_SIGNED_URL_AVAILABLE_TIME?: string;
  COS_PROXY?: string;
}

// from config file
export interface IConf {
  endpoint?: string;
  port?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  pathPrefix?: string;
  assetLogsPrefix?: string;
  logSignedUrlAvailableTime?: string;
  proxy?: string;
}

export class ObjectStorageConfig {
  public static readonly defaultCconfigFile = path.join(__dirname, "../assets/conf/app-config.json");
  public static readonly configName = "objectStorage";

  public endpoint = "https://s3.eu-geo.objectstorage.softlayer.net";
  public port = "";
  public bucket = "bridge-x";
  public accessKeyId = "";
  public secretAccessKey = "";
  public pathPrefix = "packages";
  public assetLogsPrefix = "asset-logs";
  public logSignedUrlAvailableTime = 60;
  public proxy = "";

  /**
   * Parses config files and process env.
   */
  constructor(env: IEnv = process.env) {
    let conf: IConf = {};

    try {
      const content = fs.readFileSync(env.COS_CONFIG_PATH || ObjectStorageConfig.defaultCconfigFile, "utf-8");
      conf = JSON.parse(content)[ObjectStorageConfig.configName] || {};
    } catch {}

    this.endpoint = env.COS_ENDPOINT || conf.endpoint || this.endpoint;
    this.port = env.COS_PORT || conf.port || this.port;
    this.bucket = env.COS_BUCKET || conf.bucket || this.bucket;
    this.assetLogsPrefix = env.COS_BUCKET || conf.assetLogsPrefix || this.assetLogsPrefix;
    this.logSignedUrlAvailableTime = Number(
      env.LOG_SIGNED_URL_AVAILABLE_TIME || conf.logSignedUrlAvailableTime || this.logSignedUrlAvailableTime,
    );
    this.accessKeyId = env.COS_HMAC_ACCESS_KEY_ID || conf.accessKeyId || this.accessKeyId;
    this.secretAccessKey = env.COS_HMAC_SECRET_ACCESS_KEY || conf.secretAccessKey || this.secretAccessKey;
    this.pathPrefix = env.COS_PATH_PREFIX || conf.pathPrefix || this.pathPrefix;
    this.proxy = env.COS_PROXY || conf.proxy || this.proxy;
  }
}
