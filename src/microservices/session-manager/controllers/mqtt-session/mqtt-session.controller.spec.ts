import { Test, TestingModule } from "@nestjs/testing";

import { marbles, cases } from "rxjs-marbles/jest";

import * as o from "rxjs";

import { HttpException, BadRequestException, NotFoundException, InternalServerErrorException } from "@nestjs/common/exceptions";

import { MqttPublishService } from "../../../../service/mqtt-publish";

import { LoggerService } from "../../../../service/logger";

import { BearerTokenGuard } from "../../../../guards/bearer-token";

import { MqttSessionController } from "./mqtt-session.controller";

import { GuardMqttSession } from "./mqtt-session.controller.guard";

import { MqttSessionService } from "../../services/mqtt-session";

// -------------------------------------------------

describe(MqttSessionController.name, () => {
  let controller: MqttSessionController;
  let guard: GuardMqttSession;
  let loggerService: LoggerService;
  let sessionService: MqttSessionService;
  let publisher: MqttPublishService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class GuardMqttSessionMock {
    public isPostSessionsBody = jest.fn().mockReturnValue(true);
    public isDeleteSessionParams = jest.fn().mockReturnValue(true);
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class MqttSessionServiceMock {
    public createSession$ = jest.fn().mockReturnValue(o.empty());
    public closeSession$ = jest.fn().mockReturnValue(o.empty());
  }

  class MqttPublishServiceMock {
    public createSessionEvent$ = jest.fn().mockReturnValue(o.empty());
    public closeSessionCommand$ = jest.fn().mockReturnValue(o.empty());
    public createSessionAction$ = jest.fn().mockReturnValue(o.empty());
    public closeSessionAction$ = jest.fn().mockReturnValue(o.empty());
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MqttSessionController],
      providers: [
        { provide: GuardMqttSession, useClass: GuardMqttSessionMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: MqttSessionService, useClass: MqttSessionServiceMock },
        { provide: MqttPublishService, useClass: MqttPublishServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(MqttSessionController);
    guard = module.get(GuardMqttSession);
    loggerService = module.get(LoggerService);
    sessionService = module.get(MqttSessionService);
    publisher = module.get(MqttPublishService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(guard).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(sessionService).toBeDefined();
  });

  describe(MqttSessionController.prototype.post$.name, () => {
    it(
      "should throw BadRequestException if body is invalid format",
      marbles((ctx) => {
        // arrage
        ((guard.isPostSessionsBody as any) as jest.Mock).mockReturnValue(false);

        const expected = {
          marbles: "#",
          values: {},
          error: new BadRequestException("Invalid body format"),
        };
        const body = { assetId: "someAssetId", typeId: "someTypeId" };

        // act
        const actual$ = controller.post$(body);

        // assert
        ctx.expect(actual$).toBeObservable(expected.marbles, expected.values, expected.error);
      }),
    );

    it("should call sessionService.createSession() with expected params", () => {
      // arrage
      const body = { assetId: "someAssetId", typeId: "someTypeId" };
      const expected = { assetId: body.assetId, typeId: body.typeId };

      // act
      controller.post$(body);

      // assert
      expect(sessionService.createSession$).toHaveBeenCalledWith(expected);
    });

    cases(
      "createSession handling",
      (ctx, c) => {
        // arrange
        const src = c.dataSource;
        const src$ = ctx.cold(src.marbles, src.values, src.error);
        (sessionService.createSession$ as jest.Mock).mockReturnValue(src$);
        (publisher.createSessionEvent$ as jest.Mock).mockReturnValue(o.of(null));
        (publisher.createSessionAction$ as jest.Mock).mockReturnValue(o.of(null));

        const expected = c.expected;
        const expected$ = ctx.cold(expected.marbles, expected.values, expected.error);

        const body = { assetId: "someAssetId", typeId: "someTypeId" };

        // act
        const actual$ = controller.post$(body);

        // assert
        ctx.expect(actual$).toBeObservable(expected$);
      },
      {
        "should return expected response": {
          dataSource: {
            marbles: "a|",
            values: {
              a: {
                typeId: "someTypeId",
                assetId: "someAssetId",
                sessionId: "someSessionId",
                topicPrefix: "someTopicPrefix",
                additional: "property should not be contained in result",
              },
            },
            error: undefined,
          },
          expected: {
            marbles: "a|",
            values: {
              a: {
                typeId: "someTypeId",
                assetId: "someAssetId",
                sessionId: "someSessionId",
                topicPrefix: "someTopicPrefix",
              },
            },
            error: undefined,
          },
        },
        "should throw BadRequestException if service throws BAD_REQUEST": {
          dataSource: {
            marbles: "#",
            values: {},
            error: new HttpException({ message: "error des" }, 400),
          },
          expected: {
            marbles: "#",
            values: {},
            error: new BadRequestException("error des"),
          },
        },
        "should throw NotFoundException if service throws NOT_FOUND": {
          dataSource: {
            marbles: "#",
            values: {},
            error: new HttpException({ message: "error des" }, 404),
          },
          expected: {
            marbles: "#",
            values: {},
            error: new NotFoundException("error des"),
          },
        },
        "should throw InternalServerErrorException if service throws NOT_FOUND": {
          dataSource: {
            marbles: "#",
            values: {},
            error: new HttpException({ message: "error des" }, 409),
          },
          expected: {
            marbles: "#",
            values: {},
            error: new InternalServerErrorException("error des"),
          },
        },
        "should throw InternalServerErrorException if service throws other exception than HttpException": {
          dataSource: {
            marbles: "#",
            values: {},
            // error: { toString: () => "error des" },
            error: { toString: () => "error des" },
          },
          expected: {
            marbles: "#",
            values: {},
            error: new InternalServerErrorException("error des"),
          },
        },
      },
    );
  });

  describe(MqttSessionController.prototype.delete$.name, () => {
    it(
      "should throw NotFoundException if sessionId is invalid format",
      marbles((ctx) => {
        // arrage
        ((guard.isDeleteSessionParams as any) as jest.Mock).mockReturnValue(false);

        const expected = {
          marbles: "#",
          values: {},
          error: new NotFoundException("Invalid sessionId format"),
        };
        const sessionId = "someSessionId";

        // act
        const actual$ = controller.delete$(sessionId);

        // assert
        ctx.expect(actual$).toBeObservable(expected.marbles, expected.values, expected.error);
      }),
    );

    it("should call sessionService.closeSession() with expected params", () => {
      // arrage
      const sessionId = "someSessionId";
      const expected = { sessionId };

      // act
      controller.delete$(sessionId);

      // assert
      expect(sessionService.closeSession$).toHaveBeenCalledWith(expected);
    });

    cases(
      "closeSession handling",
      (ctx, c) => {
        // arrange
        const src = c.dataSource;
        const src$ = ctx.cold(src.marbles, src.values, src.error);
        (sessionService.closeSession$ as jest.Mock).mockReturnValue(src$);
        (publisher.closeSessionCommand$ as jest.Mock).mockReturnValue(o.of(null));
        (publisher.closeSessionAction$ as jest.Mock).mockReturnValue(o.of(null));

        const expected = c.expected;
        const expected$ = ctx.cold(expected.marbles, expected.values, expected.error);

        const sessionId = "someSessionId";

        // act
        const actual$ = controller.delete$(sessionId);

        // assert
        ctx.expect(actual$).toBeObservable(expected$);
      },
      {
        "should return expected response": {
          dataSource: {
            marbles: "a|",
            values: {
              a: {
                typeId: "someTypeId",
                assetId: "someAssetId",
                sessionId: "someSessionId",
                topicPrefix: "someTopicPrefix",
                additional: "property should not be contained in result",
              },
            },
            error: undefined,
          },
          expected: {
            marbles: "a|",
            values: {
              a: null,
            },
            error: undefined,
          },
        },
        "should throw NotFoundException if service throws BAD_REQUEST": {
          dataSource: {
            marbles: "#",
            values: {},
            error: new HttpException({ message: "error des" }, 400),
          },
          expected: {
            marbles: "#",
            values: {},
            error: new NotFoundException("error des"),
          },
        },
        "should throw NotFoundException if service throws NOT_FOUND": {
          dataSource: {
            marbles: "#",
            values: {},
            error: new HttpException({ message: "error des" }, 404),
          },
          expected: {
            marbles: "#",
            values: {},
            error: new NotFoundException("error des"),
          },
        },
        "should throw InternalServerErrorException if service throws NOT_FOUND": {
          dataSource: {
            marbles: "#",
            values: {},
            error: new HttpException({ message: "error des" }, 409),
          },
          expected: {
            marbles: "#",
            values: {},
            error: new InternalServerErrorException("error des"),
          },
        },
        "should throw InternalServerErrorException if service throws other exception than HttpException": {
          dataSource: {
            marbles: "#",
            values: {},
            error: { toString: () => "error des" },
          },
          expected: {
            marbles: "#",
            values: {},
            error: new InternalServerErrorException("error des"),
          },
        },
      },
    );
  });
});
