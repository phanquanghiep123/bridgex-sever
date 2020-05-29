import { Injectable } from "@nestjs/common/decorators";

import { AppConfig } from "../../environment/app";
import { PostgresConfig } from "../../environment/postgres";
import { GConnectConfig } from "../../environment/g-connect";
import { ObjectStorageConfig } from "../../environment/object-storage";
import { FtpConfig } from "../../environment/ftp";
import { FtpClientConfig } from "../../environment/ftp-client";
import { PersistentVolumeConfig } from "../../environment/persistent-volume";

@Injectable()
export class ConfigService {
  private readonly app: AppConfig;
  private readonly postgres: PostgresConfig;
  private readonly gConnect: GConnectConfig;
  private readonly objectStorage: ObjectStorageConfig;
  private readonly ftp: FtpConfig;
  private readonly ftpClient: FtpClientConfig;
  private readonly persistentVolume: PersistentVolumeConfig;

  public constructor() {
    this.app = new AppConfig();
    this.postgres = new PostgresConfig();
    this.gConnect = new GConnectConfig();
    this.objectStorage = new ObjectStorageConfig();
    this.ftp = new FtpConfig();
    this.ftpClient = new FtpClientConfig();
    this.persistentVolume = new PersistentVolumeConfig();
  }

  public appConfig(): AppConfig {
    return this.app;
  }

  public postgresConfig(): PostgresConfig {
    return this.postgres;
  }

  public gConnectConfig(): GConnectConfig {
    return this.gConnect;
  }

  public objectStorageConfig(): ObjectStorageConfig {
    return this.objectStorage;
  }

  public ftpConfig(): FtpConfig {
    return this.ftp;
  }

  public ftpClientConfig(): FtpClientConfig {
    return this.ftpClient;
  }

  public persistentVolumeConfig(): PersistentVolumeConfig {
    return this.persistentVolume;
  }
}
