import { TestingModule, Test } from "@nestjs/testing";

import { cases } from "rxjs-marbles/jest";

import { HttpService } from "@nestjs/common";

import { of, throwError, empty } from "rxjs";

import { BearerTokenGuard } from "./bearer-token.guard";

import { LoggerService } from "../../service/logger";

import { ConfigService } from "../../service/config";

// ----------------------------------------

describe("BearerTokenGuard", () => {
  let guard: BearerTokenGuard;
  let http: HttpService;
  let config: ConfigService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let logger: LoggerService;

  class LoggerServiceMock {
    public info = jest.fn();
    public error = jest.fn();
  }

  class HttpServiceMock {
    public post = jest.fn(() => of());
  }

  const userAuthBaseUrl = "https://userAuthBaseUrl:1234";

  class ConfigServiceMock {
    public appConfig = jest.fn().mockReturnValue({ production: true });
    public gConnectConfig = () => ({ userAuthBaseUrl });
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BearerTokenGuard,
        { provide: HttpService, useClass: HttpServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    guard = module.get(BearerTokenGuard);
    http = module.get(HttpService);
    config = module.get(ConfigService);
    logger = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("config: production switch", () => {
    it("should return true if production is false ", () => {
      // arrage
      (config.appConfig as jest.Mock).mockReturnValue({ production: false });

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            header: jest.fn().mockRejectedValue(new Error("error des")),
          }),
        }),
      } as any;

      const expected = true;

      // act
      try {
        return (
          guard
            .canActivate(context)
            .toPromise()
            // assert
            .then((actual) => expect(actual).toEqual(expected))
            .catch(fail)
        );
      } catch (e) {
        fail(e);
      }
    });

    cases(
      "checks authorization header",
      (ctx, testParams) => {
        // arrage
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              header: jest.fn().mockReturnValue(testParams.authorization),
            }),
          }),
        } as any;

        const { marbleString, values } = testParams.expected;

        (http.post as jest.Mock).mockReturnValue(empty());

        // act
        const actual = guard.canActivate(context);

        // assert
        ctx.expect(actual).toBeObservable(marbleString, values as any);
      },
      {
        "false if authorization header does not exist": {
          authorization: undefined,
          expected: {
            marbleString: "(a|)",
            values: { a: false },
          },
        },
        "false if header does not contain spaces": {
          authorization: "Bearerabcdefg",
          expected: {
            marbleString: "(a|)",
            values: { a: false },
          },
        },
        "false if header does not start with Bearer": {
          authorization: "aBearer abcdefg",
          expected: {
            marbleString: "(a|)",
            values: { a: false },
          },
        },
        "false if authorization header contains extra spaces": {
          authorization: "Bearer bbbbb cccc",
          expected: {
            marbleString: "(|)",
            values: {},
          },
        },
        "empty if authorization header format is correct": {
          authorization: "Bearer        bbbbb",
          expected: {
            marbleString: "|",
            values: {},
          },
        },
      },
    );

    cases(
      "validateToken",
      (ctx, testParams) => {
        // arrage
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              header: jest.fn().mockReturnValue("Bearer token-des"),
            }),
          }),
        } as any;

        const { marbleString, values } = testParams.expected;

        (http.post as jest.Mock).mockReturnValue(testParams.response);
        jest.spyOn(guard, "isValidateTokenResponse").mockReturnValue(testParams.validation);

        // act
        const actual = guard.canActivate(context);

        // assert
        expect(http.post as jest.Mock).toHaveBeenCalledWith(expect.stringMatching(/^\S+\/validateToken$/), { token: "token-des" });
        ctx.expect(actual).toBeObservable(marbleString, values);
      },
      {
        "false if error occurs": {
          response: throwError(new Error("error des")),
          validation: false,
          expected: {
            marbleString: "(a|)",
            values: { a: false },
          },
        },
        "false if isValidateTokenResponse returns false": {
          response: of({ data: { active: true } }),
          validation: false,
          expected: {
            marbleString: "(a|)",
            values: { a: false },
          },
        },
        "false if body.active is false": {
          response: of({ data: { active: false } }),
          validation: true,
          expected: {
            marbleString: "(a|)",
            values: { a: false },
          },
        },
        "true if body.active is true": {
          response: of({ data: { active: true } }),
          validation: true,
          expected: {
            marbleString: "(a|)",
            values: { a: true },
          },
        },
      },
    );
  });

  describe("isValidateTokenResponse", () => {
    cases(
      "should pass cases",
      (m, ctx) => {
        // arrage
        // act
        const actual = guard.isValidateTokenResponse(ctx.params);
        // assert
        expect(actual).toBe(ctx.expected);
      },
      {
        "false if params is undefined": {
          params: undefined,
          expected: false,
        },
        "false if params is not object": {
          params: "error ni naru",
          expected: false,
        },
        "false if params does not contain active": {
          params: { a: "hoge" },
          expected: false,
        },
        "false if params.active is not boolean": {
          params: { active: 1 },
          expected: false,
        },
        "false if params.active undefined": {
          params: { active: undefined },
          expected: false,
        },
        "true if params.active true": {
          params: { active: true },
          expected: true,
        },
        "true if params.active false": {
          params: { active: false },
          expected: true,
        },
      },
    );
  });
});
