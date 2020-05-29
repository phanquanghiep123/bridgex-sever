import { FtpClientConfig, fs, IEnv } from "./ftp-client";

describe(FtpClientConfig.name, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor()", () => {
    it("should init default values when env/config files do not exist", () => {
      // arrage
      const expected = {
        host: expect.any(String),
        port: expect.any(Number),
        secure: expect.any(Boolean),
        user: expect.any(String),
        password: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(undefined);

      // act
      const actual = new FtpClientConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init default values when config file do not have ftp params", () => {
      // arrage
      const expected = {
        host: expect.any(String),
        port: expect.any(Number),
        secure: expect.any(Boolean),
        user: expect.any(String),
        password: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({}));

      // act
      const actual = new FtpClientConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from config file", () => {
      // arrage
      const config = {
        ftpClient: {
          host: "hoho",
          port: 123,
          secure: false,
          user: "usus",
          password: "psps",
        },
      };

      const expected = {
        host: "hoho",
        port: 123,
        secure: false,
        user: "usus",
        password: "psps",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new FtpClientConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from specified config file", () => {
      // arrage
      const config = {
        ftpClient: {
          host: "hoho",
          port: 123,
          secure: true,
          user: "usus",
          password: "psps",
        },
      };

      const env: IEnv = {
        FTP_CLIENT_CONFIG_PATH: "from-env-config-path",
      };

      const expected = {
        host: "hoho",
        port: 123,
        secure: true,
        user: "usus",
        password: "psps",
      };

      jest.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === env.FTP_CLIENT_CONFIG_PATH) {
          return JSON.stringify(config);
        }
        throw new Error("error des");
      });

      // act
      const actual = new FtpClientConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env instead of config file", () => {
      // arrage
      const config = {
        ftpClient: {
          host: "hoho",
          port: 123,
          secure: true,
          user: "usus",
          password: "psps",
        },
      };

      const env: IEnv = {
        FTP_CLIENT_SERVER_PORT: "5000",
      };

      const expected = {
        host: "hoho",
        port: 5000,
        secure: true,
        user: "usus",
        password: "psps",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new FtpClientConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
