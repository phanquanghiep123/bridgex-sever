import { FtpConfig, fs, IEnv } from "./ftp";

describe(FtpConfig.name, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor()", () => {
    it("should init default values when env/config files do not exist", () => {
      // arrage
      const expected = {
        protocol: expect.any(String),
        host: expect.any(String),
        port: expect.any(Number),
        user: expect.any(String),
        pass: expect.any(String),
        pathPrefix: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(undefined);

      // act
      const actual = new FtpConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init default values when config file do not have ftp params", () => {
      // arrage
      const expected = {
        protocol: expect.any(String),
        host: expect.any(String),
        port: expect.any(Number),
        user: expect.any(String),
        pass: expect.any(String),
        pathPrefix: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({}));

      // act
      const actual = new FtpConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from config file", () => {
      // arrage
      const config = {
        ftp: {
          protocol: "ftp",
          host: "hoho",
          port: 123,
          user: "usus",
          pass: "psps",
          pathPrefix: "pppp",
        },
      };

      const expected = {
        protocol: "ftp",
        host: "hoho",
        port: 123,
        user: "usus",
        pass: "psps",
        pathPrefix: "pppp",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new FtpConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from specified config file", () => {
      // arrage
      const config = {
        ftp: {
          protocol: "ftps",
          host: "hoho",
          port: 123,
          user: "usus",
          pass: "psps",
          pathPrefix: "pppp",
        },
      };

      const env: IEnv = {
        FTP_CONFIG_PATH: "from-env-config-path",
      };

      const expected = {
        protocol: "ftps",
        host: "hoho",
        port: 123,
        user: "usus",
        pass: "psps",
        pathPrefix: "pppp",
      };

      jest.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === env.FTP_CONFIG_PATH) {
          return JSON.stringify(config);
        }
        throw new Error("error des");
      });

      // act
      const actual = new FtpConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env instead of config file", () => {
      // arrage
      const config = {
        ftp: {
          protocol: "prpr",
          host: "hoho",
          port: 123,
          user: "usus",
          pass: "psps",
          pathPrefix: "pppp",
        },
      };

      const env: IEnv = {
        FTP_SERVER_PORT: "5000",
      };

      const expected = {
        protocol: "ftp",
        host: "hoho",
        port: 5000,
        user: "usus",
        pass: "psps",
        pathPrefix: "pppp",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new FtpConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
