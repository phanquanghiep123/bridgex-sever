jest
  .mock("fs")
  .mock("path")
  .mock("yaml");

import { Test, TestingModule } from "@nestjs/testing";

import { ErrorInformation } from "./error-information.service.i";
import { ErrorInformationService, fs, path, yaml } from "./error-information.service";
import { GuardErrorInformationMap } from "./error-information.service.guard";
import { LoggerService } from "../logger/logger.service";
import { Stats } from "fs";

describe("ErrorInformationService", () => {
  let service: ErrorInformationService;
  let guard: GuardErrorInformationMap;
  let loggerService: LoggerService;

  class GuardErrorInformationMapMock {
    public isReadErrorMap = jest.fn(() => true);
  }
  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  beforeEach(async () => {
    jest.restoreAllMocks();
    (fs.readdirSync as jest.Mock).mockReturnValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorInformationService,
        { provide: GuardErrorInformationMap, useClass: GuardErrorInformationMapMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(ErrorInformationService);
    guard = module.get(GuardErrorInformationMap);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(guard).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe("getFilePaths", () => {
    it("should load yaml-file and return read-data", () => {
      // arrange
      (fs.readdirSync as jest.Mock).mockReturnValue(["01.yaml", "02.yaml", "child-dir", "03.yaml"]);
      (path.join as jest.Mock).mockReturnValueOnce("didi/01.yaml");
      (path.join as jest.Mock).mockReturnValueOnce("didi/02.yaml");
      (path.join as jest.Mock).mockReturnValueOnce("didi/child-dir");
      (path.join as jest.Mock).mockReturnValueOnce("didi/03.yaml");
      const stats = new Stats();
      (fs.statSync as jest.Mock).mockReturnValue(stats);
      jest.spyOn(stats, "isFile").mockReturnValueOnce(true);
      jest.spyOn(stats, "isFile").mockReturnValueOnce(true);
      jest.spyOn(stats, "isFile").mockReturnValueOnce(false);
      jest.spyOn(stats, "isFile").mockReturnValueOnce(true);

      const expected = ["didi/01.yaml", "didi/02.yaml", "didi/03.yaml"];

      // act
      const actual = service.getFilePaths("map-dir");

      // assert
      expect(fs.readdirSync).toBeCalledWith("map-dir");
      expect(path.join).toBeCalledWith("map-dir", "01.yaml");
      expect(path.join).toBeCalledWith("map-dir", "02.yaml");
      expect(path.join).toBeCalledWith("map-dir", "child-dir");
      expect(path.join).toBeCalledWith("map-dir", "03.yaml");
      expect(fs.statSync).toBeCalledWith("didi/01.yaml");
      expect(fs.statSync).toBeCalledWith("didi/02.yaml");
      expect(fs.statSync).toBeCalledWith("didi/child-dir");
      expect(fs.statSync).toBeCalledWith("didi/03.yaml");
      expect(actual).toEqual(expected);
    });

    it("should throw error when failed to read dir", () => {
      // arrange
      const error = new Error("test error");
      fs.readdirSync = jest.fn(() => {
        throw error;
      });

      // act
      let actual = null;
      try {
        service.getFilePaths("map-dir");
      } catch (e) {
        actual = e;
      }

      // assert
      expect(fs.readdirSync).toBeCalledWith("map-dir");
      expect(actual).toBe(error);
    });

    it("should throw error when failed to read file-state", () => {
      // arrange
      (fs.readdirSync as jest.Mock).mockReturnValue(["aaa"]);
      (path.join as jest.Mock).mockReturnValue("bbb");
      const error = new Error("test error");
      fs.statSync = jest.fn(() => {
        throw error;
      });

      // act
      let actual = null;
      try {
        service.getFilePaths("map-dir");
      } catch (e) {
        actual = e;
      }

      // assert
      expect(fs.readdirSync).toBeCalledWith("map-dir");
      expect(actual).toBe(error);
    });
  });

  describe("readYamlFile", () => {
    it("should load yaml-file and return read-data", () => {
      // arrange
      (fs.readFileSync as jest.Mock).mockReturnValue("tete");
      const readData = {};
      yaml.parse = jest.fn(() => readData);

      // act
      const actual = service.readYamlFile("fifi");

      // assert
      expect(fs.readFileSync).toBeCalledWith("fifi", "utf8");
      expect(yaml.parse).toBeCalledWith("tete");
      expect(actual).toBe(readData);
    });

    it("should throw error when failed to read yaml", () => {
      // arrange
      (fs.readFileSync as jest.Mock).mockReturnValue("tete");
      const error = new Error("test error");
      yaml.parse = jest.fn(() => {
        throw error;
      });

      // act
      let actual = null;
      try {
        service.readYamlFile("fifi");
      } catch (e) {
        actual = e;
      }

      // assert
      expect(fs.readFileSync).toBeCalledWith("fifi", "utf8");
      expect(yaml.parse).toBeCalledWith("tete");
      expect(actual).toBe(error);
    });
  });

  describe("getErrorInformationMap", () => {
    it("should return errorInformationMap", () => {
      // arrange
      const yamlPaths: string[] = ["yaml01", "yaml02", "yaml03"];
      const readData = [
        { typeId: "ty01", errors: [{ code: "co0101", message: "me0101" }] },
        {
          typeId: "ty02",
          errors: [
            { code: "co0201", message: "me0201" },
            { code: "co0202", message: "me0202" },
          ],
        },
        {
          typeId: "ty03",
          errors: [
            { code: "co0301", message: "me0301" },
            { code: "co0302", message: "me0302" },
            { code: "co0303", message: "me0303" },
          ],
        },
      ];
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[0]);
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[1]);
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[2]);
      const expected = {
        ty01: { co0101: { code: "co0101", message: "me0101" } },
        ty02: { co0201: { code: "co0201", message: "me0201" }, co0202: { code: "co0202", message: "me0202" } },
        ty03: {
          co0301: { code: "co0301", message: "me0301" },
          co0302: { code: "co0302", message: "me0302" },
          co0303: { code: "co0303", message: "me0303" },
        },
      };

      // act
      const actual = service.getErrorInformationMap(yamlPaths);

      // assert
      expect(service.readYamlFile).toHaveBeenCalledTimes(3);
      expect(service.readYamlFile).toHaveBeenNthCalledWith(1, "yaml01");
      expect(service.readYamlFile).toHaveBeenNthCalledWith(2, "yaml02");
      expect(service.readYamlFile).toHaveBeenNthCalledWith(3, "yaml03");
      expect(guard.isReadErrorMap).toHaveBeenCalledTimes(3);
      expect(guard.isReadErrorMap).toHaveBeenNthCalledWith(1, readData[0]);
      expect(guard.isReadErrorMap).toHaveBeenNthCalledWith(2, readData[1]);
      expect(guard.isReadErrorMap).toHaveBeenNthCalledWith(3, readData[2]);
      expect(actual).toEqual(expected);
    });

    it("should throw error when typeId is duplicated", () => {
      // arrange
      const yamlPaths: string[] = ["yaml01", "yaml02", "yaml03"];
      const readData = [
        { typeId: "ty01", errors: [{ code: "co0101", message: "me0101" }] },
        { typeId: "ty01", errors: [{ code: "co0201", message: "me0201" }] },
        { typeId: "ty03", errors: [{ code: "co0301", message: "me0301" }] },
      ];
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[0]);
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[1]);
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[2]);
      jest.spyOn(guard, "isReadErrorMap").mockReturnValueOnce(true);
      jest.spyOn(guard, "isReadErrorMap").mockReturnValueOnce(false);
      jest.spyOn(guard, "isReadErrorMap").mockReturnValueOnce(true[2]);
      const expected = new Error(`Invalid error-map filePath=yaml02`);

      // act
      let actual = null;
      try {
        service.getErrorInformationMap(yamlPaths);
      } catch (e) {
        actual = e;
      }

      // assert
      expect(service.readYamlFile).toHaveBeenCalledTimes(2);
      expect(service.readYamlFile).toHaveBeenNthCalledWith(1, "yaml01");
      expect(service.readYamlFile).toHaveBeenNthCalledWith(2, "yaml02");
      expect(guard.isReadErrorMap).toHaveBeenCalledTimes(2);
      expect(guard.isReadErrorMap).toHaveBeenNthCalledWith(1, readData[0]);
      expect(guard.isReadErrorMap).toHaveBeenNthCalledWith(2, readData[1]);
      expect(actual).toEqual(expected);
    });

    it("should throw error when typeId is duplicated", () => {
      // arrange
      const yamlPaths: string[] = ["yaml01", "yaml02", "yaml03"];
      const readData = [
        { typeId: "ty01", errors: [{ code: "co0101", message: "me0101" }] },
        { typeId: "ty01", errors: [{ code: "co0201", message: "me0201" }] },
        { typeId: "ty03", errors: [{ code: "co0301", message: "me0301" }] },
      ];
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[0]);
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[1]);
      jest.spyOn(service, "readYamlFile").mockReturnValueOnce(readData[2]);
      const expected = new Error(`asset-typeid is duplicated. file=yaml02, typeId=ty01`);

      // act
      let actual = null;
      try {
        service.getErrorInformationMap(yamlPaths);
      } catch (e) {
        actual = e;
      }

      // assert
      expect(service.readYamlFile).toHaveBeenCalledTimes(2);
      expect(service.readYamlFile).toHaveBeenNthCalledWith(1, "yaml01");
      expect(service.readYamlFile).toHaveBeenNthCalledWith(2, "yaml02");
      expect(guard.isReadErrorMap).toHaveBeenCalledTimes(2);
      expect(guard.isReadErrorMap).toHaveBeenNthCalledWith(1, readData[0]);
      expect(guard.isReadErrorMap).toHaveBeenNthCalledWith(2, readData[1]);
      expect(actual).toEqual(expected);
    });
  });

  describe("getErrorInformation", () => {
    it("should return errorInformation", () => {
      // arrange
      const expected = { code: "code 02", message: "message 02" };
      service.errorInformationMap[`tyty`] = {};
      service.errorInformationMap[`tyty`][`E0000`] = { code: "code 00", message: "message 00" };
      service.errorInformationMap[`tyty`][`E0001`] = { code: "code 01", message: "" };
      service.errorInformationMap[`tyty`][`E0002`] = expected;
      service.errorInformationMap[`tyty`][`E0003`] = { code: "code 03", message: "message 03" };

      // act
      const actual = service.getErrorInformation("tyty", "E0002");

      // assert
      expect(actual).toBe(expected);
    });

    it("should return system-error information when typeId is not found", () => {
      // arrange
      service.errorInformationMap[`tyty`] = {};
      service.errorInformationMap[`system-error`] = {};
      service.errorInformationMap[`system-error`][`unsupported-asset-type`] = { code: "coco", message: "meme" };

      // act
      const actual = service.getErrorInformation("tytyty", "E0002");

      // assert
      expect(actual).toEqual({ code: "E0002", message: "meme" });
    });

    it("should return system-error information when error-code is not found", () => {
      // arrange
      service.errorInformationMap[`tyty`] = {};
      service.errorInformationMap[`tyty`][`E0000`] = { code: "code 00", message: "message 00" };
      service.errorInformationMap[`system-error`] = {};
      service.errorInformationMap[`system-error`][`unsupported-error-code`] = { code: "coco", message: "meme" };

      // act
      const actual = service.getErrorInformation("tyty", "E0002");

      // assert
      expect(actual).toEqual({ code: "E0002", message: "meme" });
    });
  });

  describe("getErrorMessage", () => {
    it("should call this.getErrorInformation() and return message", () => {
      // arrange
      const errorInfo = { message: "meme" } as ErrorInformation;
      jest.spyOn(service, "getErrorInformation").mockReturnValue(errorInfo);

      // act
      const actual = service.getErrorMessage("tyty", "coco");

      // assert
      expect(service.getErrorInformation).toBeCalledWith("tyty", "coco");
      expect(actual).toEqual("meme");
    });
  });
});
