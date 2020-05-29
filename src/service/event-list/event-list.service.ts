import { Injectable } from "@nestjs/common";
import { Observable, throwError } from "rxjs";

import _fs from "fs";
import _path from "path";
import _yaml from "yaml";

import {
  EImportance,
  EventParams,
  ImportanceMap,
  SubjectMap,
  AssetEventParams,
  TaskEventParams,
  ETaskType,
  GetEventListParams,
  EventList,
  EventListItemRecord,
} from "./event-list.service.i";

import { GuardEventListService } from "./event-list.service.guard";
import { LoggerService } from "../logger/logger.service";
import { PostgresService, IClient, IClientResponse } from "../postgres";
import { ConfigService } from "../config";
import { finalize, mergeMap, map, catchError } from "rxjs/operators";
import { ErrorCode, BridgeXServerError } from "../utils";

// ------------------------------
export const fs = { ..._fs };
export const path = { ..._path };
export const yaml = { ..._yaml };
// ------------------------------

@Injectable()
export class EventListService {
  public readonly sqlDir = path.join(__dirname, `../../assets/sql`);
  public readonly filePath = {
    importance: path.join(__dirname, `../../assets/event-list-map/importance.yaml`),
    subject: path.join(__dirname, `../../assets/event-list-map/subject.yaml`),
  };
  public readonly importanceMap: ImportanceMap;
  public readonly subjectMap: SubjectMap;

  public constructor(
    public postgres: PostgresService,
    public configService: ConfigService,
    public logger: LoggerService,
    public guard: GuardEventListService,
  ) {
    this.importanceMap = this.getImportanceMap(this.filePath.importance);
    this.subjectMap = this.getSubjectMap(this.filePath.subject);
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

  public getImportanceMap(yamlPath: string): ImportanceMap {
    const readData = this.readYamlFile(yamlPath);

    if (!this.guard.isImportanceMap(readData)) {
      throw new Error(`Invalid importance-map filePath=${yamlPath}`);
    }
    return readData;
  }

  public getSubjectMap(yamlPath: string): SubjectMap {
    const readData = this.readYamlFile(yamlPath);

    if (!this.guard.isSubjectMap(readData)) {
      throw new Error(`Invalid subject-map filePath=${yamlPath}`);
    }
    return readData;
  }

  public getEventList$(params: GetEventListParams): Observable<EventList> {
    const sqlPath = `${this.sqlDir}/select-event-list.sql`;
    const placeHolder = [params.typeId, params.assetId, params.filter.text, params.filter.eventSource, params.limit, params.offset];

    return this.postgres.getClient$(this.configService.postgresConfig()).pipe(
      mergeMap((client: IClient) =>
        client.queryByFile$<EventListItemRecord>(sqlPath, placeHolder).pipe(finalize(() => client.disconnect())),
      ),
      map((res: IClientResponse<EventListItemRecord>) => {
        if (!this.guard.isEventListItemRecords(res.records)) {
          throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from database");
        }

        return {
          items: res.records.map((record: EventListItemRecord) => {
            return {
              date: record.date,
              eventSource: record.eventSource,
              subject: record.subject,
              importance: record.importance,
            };
          }),
          totalCount: res.records.length > 0 ? Number(res.records[0].totalCount) : 0,
        };
      }),
      catchError((err) => throwError(ErrorCode.categorize(err))),
    );
  }

  public replaceSubject<T extends EventParams>(subject: string, params: T): string {
    const keys: Array<keyof T> = Object.keys(params) as Array<keyof T>;
    const replaceSubject = keys.reduce((r: string, key: keyof T): string => {
      const value = params[key];
      if (typeof value === "string") {
        return r.replace("${" + key + "}", value).trim();
      } else if (typeof value === "object") {
        return r.replace("${" + key + "}", JSON.stringify(value)).trim();
      } else {
        return r.replace("${" + key + "}", "").trim();
      }
    }, subject);

    return replaceSubject;
  }

  public insertAssetEvent$<T extends AssetEventParams>(importance: EImportance, subject: string, params: T): Observable<null> {
    const sqlPath = `${this.sqlDir}/insert-event-list-asset.sql`;

    const placeHolder = [params.typeId, params.assetId, this.replaceSubject(subject, params), importance];

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), (client: IClient) =>
      this.postgres.transactBySql$(client, sqlPath, placeHolder),
    );
  }

  public insertBridgeTask$<T extends TaskEventParams>(
    importance: EImportance,
    subject: string,
    params: T,
    taskType: ETaskType,
  ): Observable<null> {
    const sqlPath = `${this.sqlDir}/insert-event-list-bridge.sql`;
    const placeHolder = [params.typeId, params.assetId, params.taskId, taskType, this.replaceSubject(subject, params), importance];

    return this.postgres.controlTransaction$(this.configService.postgresConfig(), (client: IClient) =>
      this.postgres.transactBySql$(client, sqlPath, placeHolder),
    );
  }
}
