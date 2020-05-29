import _fs from "fs";
import _path from "path";

// ------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
// ------------------------------

// from process env
export interface IEnv {
  PERSISTENT_VOLUME_CONFIG_PATH?: string;
  VALIDATE_PACKAGE_TMP_DIR?: string;
}

// from config file
export interface IConf {
  validatePackageTmpDir?: string;
}

export class PersistentVolumeConfig implements IConf {
  public static readonly defaultCconfigFile = path.join(__dirname, "../assets/conf/app-config.json");
  public static readonly configName = "persistentVolume";

  public validatePackageTmpDir = "/temp";

  constructor(env: IEnv = process.env) {
    let conf: IConf = {};

    try {
      conf =
        JSON.parse(fs.readFileSync(env.PERSISTENT_VOLUME_CONFIG_PATH || PersistentVolumeConfig.defaultCconfigFile, "utf-8"))[
          PersistentVolumeConfig.configName
        ] || {};
    } catch {}

    this.validatePackageTmpDir = env.VALIDATE_PACKAGE_TMP_DIR || conf.validatePackageTmpDir || this.validatePackageTmpDir;
  }
}
