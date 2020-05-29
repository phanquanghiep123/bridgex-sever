jest.mock("fs").mock("path");

import { PostgresConfig, fs } from "./postgres";

describe("postgres", () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor()", () => {
    beforeEach(() => {
      jest.spyOn(PostgresConfig.prototype, "getSslConnectionOptions").mockReturnValue({ rejectUnauthorized: false });
    });

    it("should init default values when env/config files do not exist", () => {
      // arrage
      const expected = {
        host: "localhost",
        database: "postgres",
        port: 5432,
        user: "postgres",
        password: "postgres",
        keepAlive: true,
        ssl: { rejectUnauthorized: false },
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(undefined);

      // act
      const actual = new PostgresConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init default values when config file do not have postgres params", () => {
      // arrage
      const expected = {
        host: "localhost",
        database: "postgres",
        port: 5432,
        user: "postgres",
        password: "postgres",
        keepAlive: true,
        ssl: { rejectUnauthorized: false },
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({}));

      // act
      const actual = new PostgresConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from config file", () => {
      // arrage
      const expected = {
        host: "from-config-host",
        database: "from-config-database",
        port: 1234,
        user: "from-config-user",
        password: "from-config-password",
        keepAlive: false,
        ssl: false,
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ postgres: { ...expected } }));

      // act
      const actual = new PostgresConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from config file with ssl config", () => {
      // arrage
      const config = {
        host: "from-config-host",
        database: "from-config-database",
        port: 1234,
        user: "from-config-user",
        password: "from-config-password",
        keepAlive: false,
        ssl: true,
        certPath: "from-config-cert-path",
      };

      const ssl = { rejectUnauthorized: true, ca: "ca-des" };

      const expected = {
        host: "from-config-host",
        database: "from-config-database",
        port: 1234,
        user: "from-config-user",
        password: "from-config-password",
        keepAlive: false,
        ssl,
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ postgres: config }));

      jest
        .spyOn(PostgresConfig.prototype, "getSslConnectionOptions")
        .mockImplementation((d, c) => (c === config.certPath ? ssl : fail(new Error("expected config is used but not"))));

      // act
      const actual = new PostgresConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env", () => {
      // arrage
      const expected = {
        host: "from-env-host",
        database: "from-env-database",
        port: 2222,
        user: "from-env-user",
        password: "from-env-password",
        keepAlive: false,
        ssl: false,
      };

      const env = {
        POSTGRES_HOST: "from-env-host",
        POSTGRES_DATABASE: "from-env-database",
        POSTGRES_PORT: "2222",
        POSTGRES_USER: "from-env-user",
        POSTGRES_PASSWORD: "from-env-password",
        POSTGRES_KEEPALIVE: "false",
        POSTGRES_USE_SSL: "false",
      };

      // act
      const actual = new PostgresConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env prior to config file", () => {
      // arrage
      const env = {
        POSTGRES_HOST: "from-env-host",
        POSTGRES_DATABASE: "from-env-database",
        POSTGRES_PORT: "2222",
        POSTGRES_USER: "from-env-user",
        POSTGRES_PASSWORD: "from-env-password",
        POSTGRES_KEEPALIVE: "false",
        POSTGRES_USE_SSL: "true",
        POSTGRES_CERT_PATH: "from-env-cert-path",
      };

      const ssl = { rejectUnauthorized: true, ca: "ca-des" };

      const expected = {
        host: "from-env-host",
        database: "from-env-database",
        port: 2222,
        user: "from-env-user",
        password: "from-env-password",
        keepAlive: false,
        ssl,
      };

      jest
        .spyOn(PostgresConfig.prototype, "getSslConnectionOptions")
        .mockImplementation((d, c) => (c === env.POSTGRES_CERT_PATH ? ssl : fail(new Error("expected env is used but not"))));

      // act
      const actual = new PostgresConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from specified file", () => {
      // arrage
      const env = {
        POSTGRES_CONFIG_PATH: "from-env-config-path",
      };

      const config = {
        host: "from-config-host",
        database: "from-config-database",
        port: 1234,
        user: "from-config-user",
        password: "from-config-password",
        keepAlive: false,
        ssl: false,
        certPath: "from-config-cert-path",
      };

      const expected = {
        host: "from-config-host",
        database: "from-config-database",
        port: 1234,
        user: "from-config-user",
        password: "from-config-password",
        keepAlive: false,
        ssl: false,
      };

      (fs.readFileSync as jest.Mock).mockImplementation((p) =>
        p === env.POSTGRES_CONFIG_PATH ? JSON.stringify({ postgres: config }) : null,
      );

      // act
      const actual = new PostgresConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });
  });

  describe("getSslConnectionOptions()", () => {
    const getSslConnectionOptions = PostgresConfig.prototype.getSslConnectionOptions;

    it("should return default value if fs.existsSync throws error", () => {
      // arrage
      const defaultPath = "default-cert-path";
      const certPath = "cert-path";
      const expected = { rejectUnauthorized: false };
      (fs.existsSync as jest.Mock).mockImplementation(() => {
        throw new Error("error-des");
      });

      // act
      const actual = getSslConnectionOptions(defaultPath, certPath);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should return default value if fs.readFileSync throws error", () => {
      // arrage
      const defaultPath = "default-cert-path";
      const certPath = "cert-path";
      const expected = { rejectUnauthorized: false };
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("error-des");
      });

      // act
      const actual = getSslConnectionOptions(defaultPath, certPath);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should return default value if cert file does not exist", () => {
      // arrage
      const defaultPath = "default-cert-path";
      const certPath = "cert-path";
      const expected = { rejectUnauthorized: false };
      (fs.existsSync as jest.Mock).mockImplementation(() => false);

      // act
      const actual = getSslConnectionOptions(defaultPath, certPath);

      // assert
      expect(actual).toEqual(expected);
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it("should return ca from specified cert-path if cert file exists", () => {
      // arrage
      const defaultPath = "default-cert-path";
      const certPath = "cert-path";
      const ca = "ca-des";
      const expected = { rejectUnauthorized: true, ca };

      (fs.existsSync as jest.Mock).mockImplementation(() => true);
      (fs.readFileSync as jest.Mock).mockImplementation((p) => (p === certPath ? ca : "error-des"));

      // act
      const actual = getSslConnectionOptions(defaultPath, certPath);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should return ca from default path if cert file exists", () => {
      // arrage
      const defaultPath = "default-cert-path";
      const ca = "ca-des";
      const expected = { rejectUnauthorized: true, ca };

      (fs.existsSync as jest.Mock).mockImplementation(() => true);
      (fs.readFileSync as jest.Mock).mockImplementation((p) => (p === defaultPath ? ca : "error-des"));

      // act
      const actual = getSslConnectionOptions(defaultPath);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
