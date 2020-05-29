import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

import {
  ETaskType,
  TaskImportanceMap,
  TaskSubjectMap,
  TaskEventParams,
  CreateTaskParams,
  ExecuteTaskParams,
  SuccessTaskParams,
  FailTaskParams,
  DownloadPackageTaskParams,
  InstallTaskParams,
  RetrieveLogTaskParams,
  RebootTaskParams,
  SelfTestTaskParams,
} from "./event-list.service.i";

import { LoggerService } from "../logger/logger.service";
import { EventListService } from ".";

class TaskEvent<T extends Record<string, any>> {
  constructor(
    public type: ETaskType,
    public service: EventListService,
    public importanceMap: TaskImportanceMap,
    public subjectMap: TaskSubjectMap,
  ) {}

  public insertCreate$(params: CreateTaskParams & T): Observable<null> {
    return this.service.insertBridgeTask$<TaskEventParams>(this.importanceMap.create, this.subjectMap.create, params, this.type);
  }

  public insertExecute$(params: ExecuteTaskParams & T): Observable<null> {
    return this.service.insertBridgeTask$<TaskEventParams>(this.importanceMap.execute, this.subjectMap.execute, params, this.type);
  }

  public insertSuccess$(params: SuccessTaskParams & T): Observable<null> {
    return this.service.insertBridgeTask$<TaskEventParams>(this.importanceMap.success, this.subjectMap.success, params, this.type);
  }

  public insertFail$(params: FailTaskParams & T): Observable<null> {
    return this.service.insertBridgeTask$<TaskEventParams>(this.importanceMap.fail, this.subjectMap.fail, params, this.type);
  }
}

@Injectable()
export class BridgeEventListService {
  public readonly downloadPackageTask: TaskEvent<DownloadPackageTaskParams>;
  public readonly installTask: TaskEvent<InstallTaskParams>;
  public readonly retrieveLogTask: TaskEvent<RetrieveLogTaskParams>;
  public readonly rebootTask: TaskEvent<RebootTaskParams>;
  public readonly selfTestTask: TaskEvent<SelfTestTaskParams>;

  public constructor(public service: EventListService, public logger: LoggerService) {
    this.downloadPackageTask = new TaskEvent(
      ETaskType.DownloadPackage,
      service,
      service.importanceMap.task.downloadPackage,
      service.subjectMap.task.downloadPackage,
    );

    this.installTask = new TaskEvent(ETaskType.Install, service, service.importanceMap.task.install, service.subjectMap.task.install);

    this.retrieveLogTask = new TaskEvent(ETaskType.RetrieveLog, service, service.importanceMap.task.logs, service.subjectMap.task.logs);

    this.rebootTask = new TaskEvent(ETaskType.Reboot, service, service.importanceMap.task.reboots, service.subjectMap.task.reboots);

    this.selfTestTask = new TaskEvent(ETaskType.SelfTest, service, service.importanceMap.task.selftests, service.subjectMap.task.selftests);
  }
}
