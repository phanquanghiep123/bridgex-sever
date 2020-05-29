import { GConnectConfig, fs } from "./g-connect";

describe("GConnectConfig", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor()", () => {
    it("should init default values when env/config files do not exist", () => {
      // arrage
      const expected = {
        dasBaseUrl: expect.any(String),
        userAuthBaseUrl: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(undefined);

      // act
      const actual = new GConnectConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init default values when config file do not have gConnect params", () => {
      // arrage
      const expected = {
        dasBaseUrl: expect.any(String),
        userAuthBaseUrl: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({}));

      // act
      const actual = new GConnectConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from config file", () => {
      // arrage
      const config = {
        gConnect: {
          dasBaseUrl: "http://dasBaseUrl:6666",
          userAuthBaseUrl: "http://userAuthBaseUrl:7777",
        },
      };

      const expected = {
        dasBaseUrl: "http://dasBaseUrl:6666",
        userAuthBaseUrl: "http://userAuthBaseUrl:7777",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new GConnectConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from specified config file", () => {
      // arrage
      const config = {
        gConnect: {
          dasBaseUrl: "http://dasBaseUrl:6666",
          userAuthBaseUrl: "http://userAuthBaseUrl:7777",
        },
      };

      const env = {
        DATABASE_ACCESS_SERVICE_CONFIG_PATH: "from-env-config-path",
      };

      const expected = {
        dasBaseUrl: "http://dasBaseUrl:6666",
        userAuthBaseUrl: "http://userAuthBaseUrl:7777",
      };

      jest.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === env.DATABASE_ACCESS_SERVICE_CONFIG_PATH) {
          return JSON.stringify(config);
        }
        throw new Error("error des");
      });

      // act
      const actual = new GConnectConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env prior to config file", () => {
      // arrage
      const config = {
        gConnect: {
          dasBaseUrl: "localhost",
          dasPort: 3001,
        },
      };

      const env = {
        DATABASE_ACCESS_SERVICE_BASE_URL: "http://dasBaseUrl:6666",
        USER_AUTH_SERVICE_BASE_URL: "http://userAuthBaseUrl:7777",
      };

      const expected = {
        dasBaseUrl: "http://dasBaseUrl:6666",
        userAuthBaseUrl: "http://userAuthBaseUrl:7777",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new GConnectConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
