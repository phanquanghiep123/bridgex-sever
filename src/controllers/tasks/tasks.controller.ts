import {
  Controller,
  UseGuards,
  Get,
  Query,
  Res,
  Post,
  HttpCode,
  Body,
  Req,
  UnauthorizedException,
  HttpException,
  BadRequestException,
  Param,
} from "@nestjs/common";
import { throwError, Observable, of, from } from "rxjs";
import { map, mergeMap, tap, catchError, switchMap, concatMap, toArray } from "rxjs/operators";
import { Request, Response } from "express";
import uuid from "uuid";

import { GuardTasks } from "./tasks.controller.guard";
import {
  TasksService,
  GetDepolymentTasksParam,
  GetTasks,
  InsertDownloadPackageTaskParams,
  InsertInstallTaskParams,
  InsertDeploymentRelationParams,
  ETaskStatus,
  ETaskAssetStatus,
  InsertLogTaskParams,
  GetTask,
  InsertRebootSelfTestTaskParams,
} from "../../service/tasks";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { BridgeXServerError, ErrorCode } from "../../service/utils";
import { UserAuthService, UserInfo } from "../../service/user-auth";
import {
  TaskResponseBody,
  DeploymentTaskAsset,
  PostDeploymentTaskBody,
  LogTaskAssetRecord,
  RetriveLogsRecord,
  RebootTaskAssetRecord,
  SelfTestTaskAssetRecord,
  PostLogTaskBody,
  PostRebootSelfTestTaskBody,
} from "./tasks.controller.i";

import { ConfigService } from "../../service/config";
import { HttpClientService } from "../../service/http-client";
import { PostSchedulesBody } from "../../microservices/task-scheduler/controllers/task-scheduler";
import { BridgeEventListService } from "../../service/event-list";
import * as EventListParams from "../../service/event-list";
import { PackagesService } from "../../service/packages";

@Controller("/tasks")
@UseGuards(BearerTokenGuard)
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private userAuthService: UserAuthService,
    private guard: GuardTasks,
    private logger: LoggerService,
    private configService: ConfigService,
    private httpClientService: HttpClientService,
    private packageService: PackagesService,
    private eventListService: BridgeEventListService,
  ) {}

  @Get()
  public getTasks(@Query() query: GetDepolymentTasksParam, @Res() res: Response) {
    this.logger.info(`Enter GET /tasks`);
    if (!this.guard.isGetTaskParams(query)) {
      return res
        .status(400)
        .json("Invalid Request Path Params")
        .end();
    }

    query = {
      limit: query.limit ? query.limit : "20",
      offset: query.offset ? query.offset : "0",
      text: query.text ? this.getFreeSearchKeywords(query.text) : "%",
      sortName: query.sortName ? query.sortName : "updateDate",
      sort: query.sort ? query.sort : "desc",
    };

    this.tasksService
      .get$(query)
      .pipe(
        map((records: GetTasks[]) => ({
          totalCount: records.length > 0 ? records[0].totalCount : 0,
          tasks: records.map((record) => this.fromTaskRecordToTasksResponseBody(record)),
        })),
      )
      .subscribe(
        ({ totalCount, tasks }) => {
          res
            .status(200)
            .set({
              "Access-Control-Expose-Headers": "X-Total-Count",
              "X-Total-Count": `${totalCount}`,
            })
            .json(tasks);
        },
        (err: BridgeXServerError) => {
          this.logger.info(err.message);
          res.status(err.code).json({ code: err.code, message: err.message });
        },
      )
      .add(() => res.end());
  }

  public fromTaskRecordToTasksResponseBody(data: GetTasks): TaskResponseBody {
    const downloadPackageTaskAssets = data.downloadPackageTaskAssets
      ? data.downloadPackageTaskAssets.map(
          (asset): DeploymentTaskAsset => ({
            ...asset,
            startedAt: asset.startedAt || "",
            updatedAt: asset.updatedAt || "",
          }),
        )
      : undefined;

    const installTaskAssets = data.installTaskAssets
      ? data.installTaskAssets.map(
          (asset): DeploymentTaskAsset => ({
            ...asset,
            startedAt: asset.startedAt || "",
            updatedAt: asset.updatedAt || "",
          }),
        )
      : undefined;

    const deploymentTaskPackages = data.deploymentTaskPackages;

    const logTask = data.logTask;

    const logTaskAssets = data.logTaskAssets
      ? data.logTaskAssets.map(
          (lta): LogTaskAssetRecord => ({
            ...lta,
            startedAt: lta.startedAt || "",
            updatedAt: lta.updatedAt || "",
          }),
        )
      : undefined;

    const retrieveLogs = data.retrieveLogs
      ? data.retrieveLogs.map(
          (rtl): RetriveLogsRecord => ({
            ...rtl,
            createdAt: rtl.createdAt || "",
          }),
        )
      : undefined;

    const rebootTask = data.rebootTask;

    const rebootTaskAssets = data.rebootTaskAssets.map(
      (lta): RebootTaskAssetRecord => ({
        ...lta,
        startedAt: lta.startedAt || "",
        updatedAt: lta.updatedAt || "",
      }),
    );

    const selfTestTask = data.selfTestTask;

    const selfTestTaskAssets = data.selfTestTaskAssets.map(
      (lta): SelfTestTaskAssetRecord => ({
        ...lta,
        startedAt: lta.startedAt || "",
        updatedAt: lta.updatedAt || "",
      }),
    );

    return {
      id: data.id,
      name: data.name,
      taskType: data.taskType,
      relatedTaskId: data.relatedTaskId,
      relatedTaskType: data.relatedTaskType,
      status: data.status,
      createdBy: data.createdBy,
      updatedAt: data.updatedAt ? data.updatedAt.toISOString() : "",
      downloadPackageTaskAssets,
      installTaskAssets,
      deploymentTaskPackages,
      logTask,
      logTaskAssets,
      retrieveLogs,
      rebootTask,
      rebootTaskAssets,
      selfTestTask,
      selfTestTaskAssets,
    };
  }

  @Get(":taskId")
  public getTask(@Param() path: { taskId: string }, @Res() res: Response) {
    this.logger.info(`Enter GET /tasks/:tasks`);

    this.tasksService
      .getTask$({
        taskId: path.taskId,
      })
      .subscribe(
        (task: GetTask) => {
          res.status(200).json(task);
        },
        (err: BridgeXServerError) => {
          this.logger.info(err.message);
          res.status(err.code).json({ code: err.code, message: err.message });
        },
      )
      .add(() => res.end());
  }

  @Post("deployments")
  @HttpCode(201)
  public postDeploymentTask(@Body() body: PostDeploymentTaskBody, @Req() req: Request): Observable<any> {
    this.logger.info(`Enter POST /tasks/deployments`);

    const accessToken = this.getTokenFromHeader(req);

    if (!accessToken) {
      return throwError(new UnauthorizedException("invalid bearer token"));
    }

    if (!this.guard.isPostBody(body)) {
      return throwError(new BadRequestException(`Cannot execute POST /tasks/deployments, request-body error`));
    }

    return this.userAuthService.getUserInfo$(accessToken).pipe(
      switchMap((userInfo: UserInfo) => {
        const downloadPackageTaskId = uuid();
        const installTaskId = uuid();
        const taskRegistrant = userInfo.displayName;

        return of(null).pipe(
          switchMap(() => {
            const params: InsertDownloadPackageTaskParams = {
              taskId: downloadPackageTaskId,
              name: body.name,
              status: ETaskStatus.Scheduled,
              createdBy: taskRegistrant,
              assets:
                body.assets.length > 0
                  ? body.assets.map((asset) => ({
                      ...asset,
                      status: ETaskAssetStatus.Scheduled,
                    }))
                  : [],
              packages:
                body.packages.length > 0
                  ? body.packages.map((pkg) => ({
                      packageId: pkg,
                    }))
                  : [],
            };

            return this.tasksService.insertDownloadPackageTask$(params).pipe(
              mergeMap(() => this.saveDownloadPackageTaskEventLog$(params)),
              catchError((e: any) => {
                this.logger.info("Failed to register DownloadPackage task of Deployment task");
                return throwError(ErrorCode.categorize(e));
              }),
            );
          }),
          switchMap(() => {
            const params: InsertInstallTaskParams = {
              taskId: installTaskId,
              name: body.name,
              status: ETaskStatus.Scheduled,
              createdBy: taskRegistrant,
              assets:
                body.assets.length > 0
                  ? body.assets.map((asset) => ({
                      ...asset,
                      status: ETaskAssetStatus.Scheduled,
                    }))
                  : [],
              packages:
                body.packages.length > 0
                  ? body.packages.map((pkg) => ({
                      packageId: pkg,
                    }))
                  : [],
            };

            return this.tasksService.insertInstallTask$(params).pipe(
              mergeMap(() => this.saveInstallTaskEventLog$(params)),
              catchError((e: any) => {
                this.logger.info("Failed to register Install task of Deployment task");
                return throwError(ErrorCode.categorize(e));
              }),
            );
          }),
          switchMap(() => {
            const params: InsertDeploymentRelationParams = {
              downloadPackageId: downloadPackageTaskId,
              installId: installTaskId,
            };

            return this.tasksService.insertDeploymentRelation$(params).pipe(
              catchError((e: any) => {
                this.logger.info("Failed to relate DownloadPackage task to Install task");
                return throwError(ErrorCode.categorize(e));
              }),
            );
          }),
          tap(() => this.logger.info(`Succeeded to insert deployment task`)),
          mergeMap(() => this.immediateExecuteDownloadPackageTask$(downloadPackageTaskId)),
        );
      }),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public saveDownloadPackageTaskEventLog$(taskParams: InsertDownloadPackageTaskParams) {
    return this.packageService.getMany$(taskParams.packages.map((e) => e.packageId)).pipe(
      switchMap((packages) =>
        from(taskParams.assets).pipe(
          concatMap((asset) => {
            const params: EventListParams.CreateTaskParams & EventListParams.DownloadPackageTaskParams = {
              typeId: asset.typeId,
              assetId: asset.assetId,
              taskId: taskParams.taskId,
              packageName: packages.map((elm) => elm.name).join(","), // join names just in case
            };
            return this.eventListService.downloadPackageTask.insertCreate$(params);
          }),
        ),
      ),
      toArray(),
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for create DeploymentTask", e))),
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        this.logger.error(e.toString(), { error: e, params: taskParams });
        return of(null);
      }),
    );
  }

  public saveInstallTaskEventLog$(taskParams: InsertInstallTaskParams) {
    return this.packageService.getMany$(taskParams.packages.map((e) => e.packageId)).pipe(
      switchMap((packages) =>
        from(taskParams.assets).pipe(
          concatMap((asset) => {
            const params: EventListParams.CreateTaskParams & EventListParams.InstallTaskParams = {
              typeId: asset.typeId,
              assetId: asset.assetId,
              taskId: taskParams.taskId,
              packageName: packages.map((elm) => elm.name).join(","), // join names just in case
            };
            return this.eventListService.installTask.insertCreate$(params);
          }),
        ),
      ),
      toArray(),
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for create DeploymentTask", e))),
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        this.logger.error(e.toString(), { error: e, params: taskParams });
        return of(null);
      }),
    );
  }

  public immediateExecuteDownloadPackageTask$(taskId: string): Observable<null> {
    const port = this.configService.appConfig().port;
    const endPoint = `http://localhost:${port}/task-scheduler/schedules`;
    const data: PostSchedulesBody = {
      taskId,
      callbackUrl: `http://localhost:${port}/startDownloadPackage`,
    };
    const config = {};

    return this.httpClientService.post$(endPoint, data, config).pipe(
      tap(() => this.logger.info(`Succeeded to kick task ${taskId}`)),
      map(() => null),
      catchError((e) => {
        this.logger.warn(`Failure to kick task ${taskId}`, e);
        return of(null);
      }),
    );
  }

  @Post("logs")
  @HttpCode(201)
  public postLogTask(@Body() body: PostLogTaskBody, @Req() req: Request): Observable<any> {
    this.logger.info(`Enter POST /tasks/logs`);

    const accessToken = this.getTokenFromHeader(req);

    if (!accessToken) {
      return throwError(new UnauthorizedException("invalid bearer token"));
    }

    if (!this.guard.isPostLogTaskBody(body)) {
      return throwError(new BadRequestException(`Cannot find POST /tasks/logs, request-body error`));
    }

    const taskId = uuid();
    const insertLogTaskParams: InsertLogTaskParams = {
      taskId: `${taskId}`,
      status: ETaskStatus.Scheduled,
      logType: body.logType,
      createdBy: "",
      memo: body.memo ? body.memo : "",
      assets: body.assets.map((asset) => ({
        ...asset,
        status: ETaskAssetStatus.Scheduled,
      })),
    };

    return this.userAuthService.getUserInfo$(accessToken).pipe(
      map((userInfo: UserInfo) => {
        return {
          ...insertLogTaskParams,
          createdBy: userInfo.displayName,
        };
      }),
      mergeMap((params: InsertLogTaskParams) => this.tasksService.insertLogTask$(params)),
      tap(() => this.logger.info(`Succeeded to insert Log task ${taskId}`)),
      mergeMap(() => this.kickLogTask$(taskId)),
      mergeMap(() => this.saveRetrieveLogTaskEventLog$(insertLogTaskParams)),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public saveRetrieveLogTaskEventLog$(insertTaskParams: InsertLogTaskParams) {
    return from(insertTaskParams.assets).pipe(
      concatMap((asset) => {
        const params: EventListParams.CreateTaskParams & EventListParams.RetrieveLogTaskParams = {
          typeId: asset.typeId,
          assetId: asset.assetId,
          taskId: insertTaskParams.taskId,
          logType: insertTaskParams.logType,
        };
        return this.eventListService.retrieveLogTask.insertCreate$(params);
      }),
      toArray(),
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for create RetrieveLogTask", e))),
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        this.logger.error(e.toString(), { error: e, params: insertTaskParams });
        return of(null);
      }),
    );
  }

  @Post("reboots")
  @HttpCode(201)
  public postRebootTask(@Body() body: PostRebootSelfTestTaskBody, @Req() req: Request): Observable<any> {
    this.logger.info(`Enter POST ${req.path}`);

    const accessToken = this.getTokenFromHeader(req);

    if (!accessToken) {
      return throwError(new UnauthorizedException("invalid bearer token"));
    }

    if (!this.guard.isPostRebootSelfTestTaskBody(body)) {
      return throwError(new BadRequestException(`Cannot find POST ${req.path}, request-body error`));
    }

    const taskId = uuid();
    const insertRebootSelfTestTaskParams: InsertRebootSelfTestTaskParams = {
      taskId: `${taskId}`,
      status: ETaskStatus.Scheduled,
      createdBy: "",
      memo: body.memo ? body.memo : "",
      assets: body.assets.map((asset) => ({
        ...asset,
        status: ETaskAssetStatus.Scheduled,
      })),
    };

    return this.userAuthService.getUserInfo$(accessToken).pipe(
      map((userInfo: UserInfo) => {
        return {
          ...insertRebootSelfTestTaskParams,
          createdBy: userInfo.displayName,
        };
      }),
      mergeMap((params: InsertRebootSelfTestTaskParams) => this.tasksService.insertRebootSelfTestTask$(req, params)),
      tap(() => this.logger.info(`Succeeded to insert task ${taskId}`)),
      mergeMap(() => this.kickRebootTask$(taskId)),
      mergeMap(() => this.saveRebootTaskEventLog$(insertRebootSelfTestTaskParams)),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public saveRebootTaskEventLog$(insertTaskParams: InsertRebootSelfTestTaskParams) {
    return from(insertTaskParams.assets).pipe(
      concatMap((asset) => {
        const params: EventListParams.CreateTaskParams & EventListParams.RebootTaskParams = {
          typeId: asset.typeId,
          assetId: asset.assetId,
          taskId: insertTaskParams.taskId,
          memo: insertTaskParams.memo,
        };
        return this.eventListService.rebootTask.insertCreate$(params);
      }),
      toArray(),
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for create RebootTask", e))),
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        this.logger.error(e.toString(), { error: e, params: insertTaskParams });
        return of(null);
      }),
    );
  }

  @Post("selfTests")
  @HttpCode(201)
  public postSelfTestTask(@Body() body: PostRebootSelfTestTaskBody, @Req() req: Request): Observable<any> {
    this.logger.info(`Enter POST ${req.path}`);

    const accessToken = this.getTokenFromHeader(req);

    if (!accessToken) {
      return throwError(new UnauthorizedException("invalid bearer token"));
    }

    if (!this.guard.isPostRebootSelfTestTaskBody(body)) {
      return throwError(new BadRequestException(`Cannot find POST ${req.path}, request-body error`));
    }

    const taskId = uuid();
    const insertRebootSelfTestTaskParams: InsertRebootSelfTestTaskParams = {
      taskId: `${taskId}`,
      status: ETaskStatus.Scheduled,
      createdBy: "",
      memo: body.memo ? body.memo : "",
      assets: body.assets.map((asset) => ({
        ...asset,
        status: ETaskAssetStatus.Scheduled,
      })),
    };

    return this.userAuthService.getUserInfo$(accessToken).pipe(
      map((userInfo: UserInfo) => {
        return {
          ...insertRebootSelfTestTaskParams,
          createdBy: userInfo.displayName,
        };
      }),
      mergeMap((params: InsertRebootSelfTestTaskParams) => this.tasksService.insertRebootSelfTestTask$(req, params)),
      tap(() => this.logger.info(`Succeeded to insert task ${taskId}`)),
      mergeMap(() => this.kickSelfTestTask$(taskId)),
      mergeMap(() => this.saveSelfTestTaskEventLog$(insertRebootSelfTestTaskParams)),
      catchError((err: BridgeXServerError) => {
        return throwError(new HttpException({ statusCode: err.code, message: err.message, originalError: err }, err.code));
      }),
    );
  }

  public saveSelfTestTaskEventLog$(insertTaskParams: InsertRebootSelfTestTaskParams) {
    return from(insertTaskParams.assets).pipe(
      concatMap((asset) => {
        const params: EventListParams.CreateTaskParams & EventListParams.SelfTestTaskParams = {
          typeId: asset.typeId,
          assetId: asset.assetId,
          taskId: insertTaskParams.taskId,
          memo: insertTaskParams.memo,
        };
        return this.eventListService.selfTestTask.insertCreate$(params);
      }),
      toArray(),
      catchError((e) => throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Cannot write event log for create SelfTestTask", e))),
      catchError((e: BridgeXServerError) => {
        // event log should not affect main processing
        this.logger.error(e.toString(), { error: e, params: insertTaskParams });
        return of(null);
      }),
    );
  }

  public getTokenFromHeader(req: Request): string {
    const regexp = /^Bearer\s+/i;
    if (!req.headers.authorization || !regexp.test(req.headers.authorization)) {
      return "";
    }
    return req.headers.authorization.replace(/^Bearer\s+/i, "");
  }

  public kickLogTask$(taskId: string): Observable<null> {
    const port = this.configService.appConfig().port;
    const endPoint = `http://localhost:${port}/task-scheduler/schedules`;
    const data: PostSchedulesBody = {
      taskId,
      callbackUrl: `http://localhost:${port}/startRetrieveLog`,
    };
    const config = {};

    return this.httpClientService.post$(endPoint, data, config).pipe(
      tap(() => this.logger.info(`Succeeded to kick task ${taskId}`)),
      map(() => null),
      catchError((e) => {
        this.logger.warn(`Failure to kick task ${taskId}`, e);
        return of(null);
      }),
    );
  }

  public kickRebootTask$(taskId: string): Observable<null> {
    const port = this.configService.appConfig().port;
    const endPoint = `http://localhost:${port}/task-scheduler/schedules`;
    const data: PostSchedulesBody = {
      taskId,
      callbackUrl: `http://localhost:${port}/startReboot`,
    };
    const config = {};

    return this.httpClientService.post$(endPoint, data, config).pipe(
      tap(() => this.logger.info(`Succeeded to kick task ${taskId}`)),
      map(() => null),
      catchError((e) => {
        this.logger.warn(`Failure to kick task ${taskId}`, e);
        return of(null);
      }),
    );
  }

  public kickSelfTestTask$(taskId: string): Observable<null> {
    const port = this.configService.appConfig().port;
    const endPoint = `http://localhost:${port}/task-scheduler/schedules`;
    const data: PostSchedulesBody = {
      taskId,
      callbackUrl: `http://localhost:${port}/startSelfTest`,
    };
    const config = {};

    return this.httpClientService.post$(endPoint, data, config).pipe(
      tap(() => this.logger.info(`Succeeded to kick task ${taskId}`)),
      map(() => null),
      catchError((e) => {
        this.logger.warn(`Failure to kick task ${taskId}`, e);
        return of(null);
      }),
    );
  }

  public getFreeSearchKeywords(text: string): string {
    const arrKeyWords = text
      .replace(/　/g, " ")
      .replace(/ +/g, " ")
      .split(" ");
    arrKeyWords.forEach((value, index, array) => (array[index] = `%${value}%`));
    return arrKeyWords.join(" ");
  }
}
