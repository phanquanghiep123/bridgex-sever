import { ObjectStorageConfig, fs, IEnv } from "./object-storage";

describe(ObjectStorageConfig.name, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor()", () => {
    it("should init default values when env/config files do not exist", () => {
      // arrage
      const expected = {
        endpoint: expect.any(String),
        port: expect.any(String),
        bucket: expect.any(String),
        accessKeyId: expect.any(String),
        secretAccessKey: expect.any(String),
        pathPrefix: expect.any(String),
        assetLogsPrefix: expect.any(String),
        logSignedUrlAvailableTime: expect.any(Number),
        proxy: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(undefined);

      // act
      const actual = new ObjectStorageConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init default values when config file do not have objectstorage params", () => {
      // arrage
      const expected = {
        endpoint: expect.any(String),
        port: expect.any(String),
        bucket: expect.any(String),
        accessKeyId: expect.any(String),
        secretAccessKey: expect.any(String),
        pathPrefix: expect.any(String),
        assetLogsPrefix: expect.any(String),
        logSignedUrlAvailableTime: expect.any(Number),
        proxy: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({}));

      // act
      const actual = new ObjectStorageConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from config file", () => {
      // arrage
      const config = {
        objectStorage: {
          endpoint: "endpoint",
          port: "3000",
          bucket: "test",
          accessKeyId: "accessKeyId",
          secretAccessKey: "secretAccessKey",
          pathPrefix: "pathPrefix",
          assetLogsPrefix: "assetLogsPrefix",
          logSignedUrlAvailableTime: 120,
          proxy: "proxy",
        },
      };

      const expected = {
        endpoint: "endpoint",
        port: "3000",
        bucket: "test",
        accessKeyId: "accessKeyId",
        secretAccessKey: "secretAccessKey",
        pathPrefix: "pathPrefix",
        assetLogsPrefix: "assetLogsPrefix",
        logSignedUrlAvailableTime: 120,
        proxy: "proxy",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new ObjectStorageConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from specified config file", () => {
      // arrage
      const config = {
        objectStorage: {
          endpoint: "endpoint",
          port: "3000",
          bucket: "test",
          accessKeyId: "accessKeyId",
          secretAccessKey: "secretAccessKey",
          pathPrefix: "pathPrefix",
          assetLogsPrefix: "assetLogsPrefix",
          logSignedUrlAvailableTime: 120,
          proxy: "proxy",
        },
      };

      const env: IEnv = {
        COS_CONFIG_PATH: "from-env-config-path",
      };

      const expected = {
        endpoint: "endpoint",
        port: "3000",
        bucket: "test",
        accessKeyId: "accessKeyId",
        secretAccessKey: "secretAccessKey",
        pathPrefix: "pathPrefix",
        assetLogsPrefix: "assetLogsPrefix",
        logSignedUrlAvailableTime: 120,
        proxy: "proxy",
      };

      jest.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === env.COS_CONFIG_PATH) {
          return JSON.stringify(config);
        }
        throw new Error("error des");
      });

      // act
      const actual = new ObjectStorageConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env instead of config file", () => {
      // arrage
      const config = {
        objectStorage: {
          endpoint: "endpoint",
          port: "3000",
          bucket: "test",
          accessKeyId: "accessKeyId",
          secretAccessKey: "secretAccessKey",
          pathPrefix: "pathPrefix",
          assetLogsPrefix: "assetLogsPrefix",
          logSignedUrlAvailableTime: 120,
          proxy: "proxy",
        },
      };

      const env: IEnv = {
        COS_PORT: "5000",
      };

      const expected = {
        endpoint: expect.any(String),
        port: "5000",
        bucket: expect.any(String),
        accessKeyId: expect.any(String),
        secretAccessKey: expect.any(String),
        pathPrefix: expect.any(String),
        assetLogsPrefix: expect.any(String),
        logSignedUrlAvailableTime: expect.any(Number),
        proxy: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new ObjectStorageConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
