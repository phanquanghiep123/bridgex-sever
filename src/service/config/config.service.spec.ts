import { ConfigServiceModule } from "./config.service.module";
import { Test, TestingModule } from "@nestjs/testing";

import { ConfigService } from "./config.service";
import { AppConfig } from "../../environment/app";
import { PostgresConfig } from "../../environment/postgres";
import { GConnectConfig } from "../../environment/g-connect";
import { ObjectStorageConfig } from "../../environment/object-storage";
import { FtpConfig } from "../../environment/ftp";
import { FtpClientConfig } from "../../environment/ftp-client";
import { PersistentVolumeConfig } from "../../environment/persistent-volume";

describe("ConfigService", () => {
  let service: ConfigService;

  beforeEach(async () => {
    AppConfig.prototype.constructor = jest.fn();
    PostgresConfig.prototype.constructor = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigServiceModule],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("appConfig", () => {
    it("should return AppConfig", () => {
      // arrange
      const expected = new AppConfig();

      // act
      const actual = service.appConfig();

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe("postgresConfig", () => {
    it("should return PostgresConfig", () => {
      // arrange
      const expected = new PostgresConfig();

      // act
      const actual = service.postgresConfig();

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe("gConnectConfig", () => {
    it("should return GConnectConfig", () => {
      // arrange
      const expected = new GConnectConfig();

      // act
      const actual = service.gConnectConfig();

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe("objectStorageConfig", () => {
    it("should return ObjectStorageConfig", () => {
      // arrange
      const expected = new ObjectStorageConfig();

      // act
      const actual = service.objectStorageConfig();

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe("ftpConfig", () => {
    it("should return FtpConfig", () => {
      // arrange
      const expected = new FtpConfig();

      // act
      const actual = service.ftpConfig();

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe("ftpClientConfig", () => {
    it("should return FtpConfig", () => {
      // arrange
      const expected = new FtpClientConfig();

      // act
      const actual = service.ftpClientConfig();

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe("persistentVolumeConfig", () => {
    it("should return persistentVolumeConfig", () => {
      // arrange
      const expected = new PersistentVolumeConfig();

      // act
      const actual = service.persistentVolumeConfig();

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
