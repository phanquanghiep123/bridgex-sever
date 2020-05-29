import { Test, TestingModule } from "@nestjs/testing";

import { fakeSchedulers } from "rxjs-marbles/jest";

import * as o from "rxjs";

import { BadRequestException, InternalServerErrorException } from "@nestjs/common/exceptions";

import { LoggerService } from "../../../../service/logger";

import { HttpClientService } from "../../../../service/http-client";

import { BearerTokenGuard } from "../../../../guards/bearer-token";

import { TaskScheduleController } from "./task-schedule.controller";

import { GuardTaskSchedule } from "./task-schedule.controller.guard";

// -------------------------------------------------

describe(TaskScheduleController.name, () => {
  let controller: TaskScheduleController;
  let guard: GuardTaskSchedule;
  let loggerService: LoggerService;
  let httpClient: HttpClientService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class GuardTaskScheduleMock {
    public isPostSchedulesBody = jest.fn().mockReturnValue(true);
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class HttpClientServiceMock {
    public post$ = jest.fn().mockReturnValue(o.empty());
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskScheduleController],
      providers: [
        { provide: GuardTaskSchedule, useClass: GuardTaskScheduleMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(TaskScheduleController);
    guard = module.get(GuardTaskSchedule);
    loggerService = module.get(LoggerService);
    httpClient = module.get(HttpClientService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(guard).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(httpClient).toBeDefined();
  });

  describe(TaskScheduleController.prototype.post$.name, () => {
    it("should be BadRequestException if body is invalid format", () => {
      // arrage
      const requestBody = {
        taskId: "123",
        callbackUrl: "https://callback-to/someone",
      };

      ((guard.isPostSchedulesBody as any) as jest.Mock).mockReturnValue(false);
      jest.spyOn(controller, "callbackToCaller").mockImplementation(fail);

      // act
      return (
        controller
          .post$(requestBody)
          .toPromise()
          // assert
          .then(fail)
          .catch((e) => expect(e).toBeInstanceOf(BadRequestException))
      );
    });

    it("should be InternalServerErrorException if unexpected error occurs", () => {
      // arrage
      const requestBody = {
        taskId: "123",
        callbackUrl: "https://callback-to/someone",
      };

      jest.spyOn(controller, "callbackToCaller").mockImplementation(() => {
        throw new Error("error des");
      });

      // act
      return (
        controller
          .post$(requestBody)
          .toPromise()
          // assert
          .then(fail)
          .catch((e) => expect(e).toBeInstanceOf(InternalServerErrorException))
      );
    });

    it("should be success with null", () => {
      // arrage
      const requestBody = {
        taskId: "123",
        callbackUrl: "https://callback-to/someone",
      };

      jest.spyOn(controller, "callbackToCaller");

      // act
      return (
        controller
          .post$(requestBody)
          .toPromise()
          // assert
          .then((actual) => expect(actual).toBeNull())
          .catch(fail)
      );
    });
  });

  describe(TaskScheduleController.prototype.callbackToCaller.name, () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it(
      "should callback proper url after delay time",
      fakeSchedulers((tick) => {
        // arrage
        const callbackUrl = "https://callback-to/someone";
        const params = { taskId: "123" };

        // act
        controller.callbackToCaller(callbackUrl, params);

        // assert
        expect(httpClient.post$).not.toHaveBeenCalled();

        tick(controller.delayTimeForDebug - 1);
        expect(httpClient.post$).not.toHaveBeenCalled();

        tick(1);
        expect(httpClient.post$).toHaveBeenCalledWith(callbackUrl, params);
      }),
    );

    it(
      "should callback proper url after delay time",
      fakeSchedulers((tick) => {
        // arrage
        const callbackUrl = "https://callback-to/someone";
        const params = { taskId: "123" };

        httpClient.post$ = jest.fn(() => o.throwError({}));

        // act
        controller.callbackToCaller(callbackUrl, params);

        // assert

        tick(controller.delayTimeForDebug);
        expect(loggerService.warn).toHaveBeenCalled();
      }),
    );
  });
});
