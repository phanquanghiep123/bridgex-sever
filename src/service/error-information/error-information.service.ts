import { Injectable } from "@nestjs/common";

import _fs from "fs";
import _path from "path";
import _yaml from "yaml";

import { ErrorInformation, ErrorInformationMap } from "./error-information.service.i";
import { LoggerService } from "../logger/logger.service";
import { GuardErrorInformationMap } from "./error-information.service.guard";

// ------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
export const yaml = { ..._yaml };
// ------------------------------

@Injectable()
export class ErrorInformationService {
  public readonly mapDir = path.join(__dirname, `../../assets/error-map`);
  public readonly errorInformationMap: ErrorInformationMap;

  public constructor(public guard: GuardErrorInformationMap, public logger: LoggerService) {
    const filePaths: string[] = this.getFilePaths(this.mapDir);

    this.errorInformationMap = this.getErrorInformationMap(filePaths);
  }

  public getFilePaths(dir: string): string[] {
    try {
      return fs.readdirSync(dir).reduce((r: string[], filename: string) => {
        try {
          const filePath = path.join(dir, filename);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            r.push(filePath);
          }
          return r;
        } catch (e) {
          this.logger.error(`failed to read file. dir=${dir}, name=${filename}`);
          throw e;
        }
      }, []);
    } catch (e) {
      this.logger.error(`failed to read. dir=${dir}`);
      throw e;
    }
  }

  public readYamlFile(filename: string) {
    try {
      const yamlText = fs.readFileSync(filename, "utf8");
      return yaml.parse(yamlText);
    } catch (e) {
      this.logger.error(`failed to read yaml. filename=${filename}`);
      throw e;
    }
  }

  public getErrorInformationMap(yamlPaths: string[]): ErrorInformationMap {
    return yamlPaths.reduce((r: ErrorInformationMap, yamlPath: string): ErrorInformationMap => {
      const readData = this.readYamlFile(yamlPath);

      if (!this.guard.isReadErrorMap(readData)) {
        throw new Error(`Invalid error-map filePath=${yamlPath}`);
      }

      const typeId = readData.typeId;

      if (r[typeId]) {
        throw new Error(`asset-typeid is duplicated. file=${yamlPath}, typeId=${typeId}`);
      }
      r[typeId] = {};

      readData.errors.forEach((errorInfo: ErrorInformation) => {
        r[typeId][errorInfo.code] = errorInfo;
      });

      return r;
    }, {});
  }

  public getErrorInformation(typeId: string, errorCode: string): ErrorInformation {
    if (!this.errorInformationMap[typeId]) {
      return { ...this.errorInformationMap[`system-error`][`unsupported-asset-type`], code: errorCode };
    }
    if (!this.errorInformationMap[typeId][errorCode]) {
      return { ...this.errorInformationMap[`system-error`][`unsupported-error-code`], code: errorCode };
    }
    return this.errorInformationMap[typeId][errorCode];
  }

  public getErrorMessage(typeId: string, errorCode: string): string {
    return this.getErrorInformation(typeId, errorCode).message;
  }
}
