import {
  Controller,
  Param,
  HttpCode,
  // UseGuards,
  Post,
  Delete,
  BadRequestException,
  Body,
  NotFoundException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from "@nestjs/common";

import { Observable, throwError, zip } from "rxjs";

import { catchError, map, switchMap } from "rxjs/operators";

import { LoggerService } from "../../../../service/logger";

// import {
//   BearerTokenGuard,
// } from "../../../../guards/bearer-token";

import { MqttPublishService } from "../../../../service/mqtt-publish";

import { GuardMqttSession } from "./mqtt-session.controller.guard";

import { PostSessionsBody, PostSessionsResponse } from "./mqtt-session.controller.i";

import { MqttSessionService, CreateSessionParams, CloseSessionParams } from "../../services/mqtt-session";

// -------------------------------------------------

@Controller("/session-manager")
// @UseGuards(BearerTokenGuard)
export class MqttSessionController {
  constructor(
    private guard: GuardMqttSession,
    private logger: LoggerService,
    private sessionService: MqttSessionService,
    private publisher: MqttPublishService,
  ) {}

  @Post("/sessions")
  @HttpCode(201)
  public post$(@Body() body: PostSessionsBody): Observable<PostSessionsResponse> {
    this.logger.info(`Enter POST /sessions`);

    if (!this.guard.isPostSessionsBody(body)) {
      return throwError(new BadRequestException("Invalid body format"));
    }

    const params: CreateSessionParams = {
      assetId: body.assetId,
      typeId: body.typeId,
    };

    return this.sessionService.createSession$(params).pipe(
      switchMap((data) => {
        const session = {
          typeId: data.typeId,
          assetId: data.assetId,
          sessionId: data.sessionId,
          topicPrefix: data.topicPrefix,
        };

        return zip(
          this.publisher.createSessionAction$(session),
          this.publisher.createSessionEvent$(session), // @deprecated
        ).pipe(map(() => session));
      }),
      catchError((e) => {
        this.logger.warn(e.toString());

        const err: HttpException = e instanceof HttpException ? e : new InternalServerErrorException(e.toString());

        switch (err.getStatus()) {
          case HttpStatus.BAD_REQUEST:
            return throwError(new BadRequestException(err.message.message));
          case HttpStatus.NOT_FOUND:
            return throwError(new NotFoundException(err.message.message));
        }

        return throwError(new InternalServerErrorException(err.message.message));
      }),
    );
  }

  @Delete("/sessions/:sessionId")
  @HttpCode(204)
  public delete$(@Param("sessionId") sessionId: string): Observable<null> {
    this.logger.info(`Enter DELETE /sessions/${sessionId}`);

    if (!this.guard.isDeleteSessionParams(sessionId)) {
      return throwError(new NotFoundException("Invalid sessionId format"));
    }

    const params: CloseSessionParams = {
      sessionId,
    };

    return this.sessionService.closeSession$(params).pipe(
      switchMap((data) => {
        const session = {
          typeId: data.typeId,
          assetId: data.assetId,
          sessionId: data.sessionId,
          sessionTopic: data.topicPrefix,
          messageId: data.sessionId,
          topicPrefix: data.topicPrefix,
        };

        return zip(
          this.publisher.closeSessionAction$(session),
          this.publisher.closeSessionCommand$(session), // @deprecated
        );
      }),
      map(() => null),
      catchError((e) => {
        this.logger.warn(e.toString());

        const err: HttpException = e instanceof HttpException ? e : new InternalServerErrorException(e.toString());

        switch (err.getStatus()) {
          case HttpStatus.BAD_REQUEST:
          case HttpStatus.NOT_FOUND:
            return throwError(new NotFoundException(err.message.message));
        }

        return throwError(new InternalServerErrorException(err.message.message));
      }),
    );
  }
}
