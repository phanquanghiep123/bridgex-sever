import _fs from "fs";
import _path from "path";
import { ConnectionOptions } from "tls";
import { PoolConfig } from "pg";
import { ParserUtils } from "./parser-utils";

// ------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
// ------------------------------

// from process env
export interface IEnv {
  POSTGRES_CONFIG_PATH?: string;
  POSTGRES_HOST?: string;
  POSTGRES_DATABASE?: string;
  POSTGRES_PORT?: string;
  POSTGRES_USER?: string;
  POSTGRES_PASSWORD?: string;
  POSTGRES_KEEPALIVE?: string;
  POSTGRES_USE_SSL?: string;
  POSTGRES_CERT_PATH?: string;
}

// from config file
export interface IConf {
  host?: string;
  database?: string;
  port?: number;
  user?: string;
  password?: string;
  keepAlive?: boolean;
  ssl?: boolean;
  certPath?: string;
}

export class PostgresConfig implements PoolConfig {
  public static readonly defaultCconfigFile = path.join(__dirname, "../assets/conf/app-config.json");
  public static readonly configName = "postgres";
  public static readonly defaultCertFile = "/app/certs/postgres.crt";

  public host = "localhost";
  public database = "postgres";
  public port = 5432;
  public user = "postgres";
  public password = "postgres";
  public keepAlive = true;
  public ssl: boolean | ConnectionOptions = { rejectUnauthorized: false, ca: undefined };

  /**
   * Parses config files and process env.
   */
  constructor(env: IEnv = process.env) {
    let conf: IConf = {};

    try {
      const content = fs.readFileSync(env.POSTGRES_CONFIG_PATH || PostgresConfig.defaultCconfigFile, "utf-8");
      conf = JSON.parse(content)[PostgresConfig.configName] || {};
    } catch {}

    this.host = env.POSTGRES_HOST || conf.host || this.host;
    this.database = env.POSTGRES_DATABASE || conf.database || this.database;
    this.port = Number(env.POSTGRES_PORT || conf.port || this.port);
    this.user = env.POSTGRES_USER || conf.user || this.user;
    this.password = env.POSTGRES_PASSWORD || conf.password || this.password;
    this.keepAlive = ParserUtils.assignBoolean(true, env.POSTGRES_KEEPALIVE, conf.keepAlive);

    const useSsl = ParserUtils.assignBoolean(true, env.POSTGRES_USE_SSL, conf.ssl);
    this.ssl = useSsl ? this.getSslConnectionOptions(PostgresConfig.defaultCertFile, env.POSTGRES_CERT_PATH || conf.certPath) : false;
  }

  /**
   * Reads SSL certificate from specified path, and returns ConnectionOptions of TlsSocket.
   */
  public getSslConnectionOptions(defaultCertPath: string, certPath?: string): ConnectionOptions {
    try {
      const postgresCertPath = ((p) => (fs.existsSync(p) ? p : undefined))(certPath || defaultCertPath);
      const ca = postgresCertPath ? fs.readFileSync(postgresCertPath, "utf-8") : undefined;
      return { rejectUnauthorized: !!ca, ca };
    } catch {}

    return { rejectUnauthorized: false };
  }
}
