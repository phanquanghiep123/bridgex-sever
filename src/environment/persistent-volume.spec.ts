import { PersistentVolumeConfig, fs, IEnv } from "./persistent-volume";

describe(PersistentVolumeConfig.name, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor()", () => {
    it("should init default values when env/config files do not exist", () => {
      // arrage
      const expected = {
        validatePackageTmpDir: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(undefined);

      // act
      const actual = new PersistentVolumeConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init default values when config file do not have persistent volume params", () => {
      // arrage
      const expected = {
        validatePackageTmpDir: expect.any(String),
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({}));

      // act
      const actual = new PersistentVolumeConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from config file", () => {
      // arrage
      const config = {
        persistentVolume: {
          validatePackageTmpDir: "/vava",
        },
      };

      const expected = {
        validatePackageTmpDir: "/vava",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new PersistentVolumeConfig();

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from specified config file", () => {
      // arrage
      const config = {
        persistentVolume: {
          validatePackageTmpDir: "/vava",
        },
      };

      const env: IEnv = {
        PERSISTENT_VOLUME_CONFIG_PATH: "from-env-config-path",
      };

      const expected = {
        validatePackageTmpDir: "/vava",
      };

      jest.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === env.PERSISTENT_VOLUME_CONFIG_PATH) {
          return JSON.stringify(config);
        }
        throw new Error("error des");
      });

      // act
      const actual = new PersistentVolumeConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });

    it("should init values from env instead of config file", () => {
      // arrage
      const config = {
        persistentVolume: {
          validatePackageTmpDir: "/temp",
        },
      };

      const env: IEnv = {
        VALIDATE_PACKAGE_TMP_DIR: "/vava",
      };

      const expected = {
        validatePackageTmpDir: "/vava",
      };

      jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

      // act
      const actual = new PersistentVolumeConfig(env);

      // assert
      expect(actual).toEqual(expected);
    });
  });
});
