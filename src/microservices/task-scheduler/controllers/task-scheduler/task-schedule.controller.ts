import {
  Controller,
  // UseGuards,
  Post,
  BadRequestException,
  Body,
  InternalServerErrorException,
  HttpCode,
} from "@nestjs/common";

import { Observable, throwError, of } from "rxjs";

import { catchError, map, tap, delay, switchMap } from "rxjs/operators";

import { LoggerService } from "../../../../service/logger";

import { HttpClientService } from "../../../../service/http-client";

// import {
//   BearerTokenGuard,
// } from "../../../../guards/bearer-token";

import { GuardTaskSchedule } from "./task-schedule.controller.guard";

import { PostSchedulesBody, ScheduleNotification } from "./task-schedule.controller.i";

// -------------------------------------------------

@Controller("/task-scheduler")
// @UseGuards(BearerTokenGuard)
export class TaskScheduleController {
  public delayTimeForDebug = 1000;

  constructor(private guard: GuardTaskSchedule, private logger: LoggerService, private httpClient: HttpClientService) {}

  @Post("/schedules")
  @HttpCode(201)
  public post$(@Body() body: PostSchedulesBody): Observable<null> {
    this.logger.trace(`POST /schedules start`, body);

    if (!this.guard.isPostSchedulesBody(body)) {
      return throwError(new BadRequestException("Invalid body format"));
    }

    return of(body).pipe(
      tap(({ taskId, callbackUrl }) => this.callbackToCaller(callbackUrl, { taskId })),
      map(() => null),
      catchError((e) => {
        this.logger.warn("POST /schedules failure: ", e);
        return throwError(new InternalServerErrorException(e.toString()));
      }),
    );
  }

  public callbackToCaller(callbackUrl: string, params: ScheduleNotification) {
    return of(null)
      .pipe(
        delay(this.delayTimeForDebug), // to execute after response back
        switchMap(() => this.httpClient.post$(callbackUrl, params)),
      )
      .subscribe({
        error: (e) => this.logger.warn("POST /schedules cannot callback", { callbackUrl, error: e.toString() }),
      });
  }
}
