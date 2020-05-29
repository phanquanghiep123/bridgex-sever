import { Test, TestingModule } from "@nestjs/testing";

import { UserAuthService } from "./user-auth.service";
import { GuardUserAuthService } from "./user-auth.service.guard";
import { HttpClientService } from "../http-client";
import { LoggerService } from "../logger";
import { ConfigService } from "../config";
import { of, throwError } from "rxjs";
import { BridgeXServerError, ErrorCode } from "../utils";

describe("UserAuthService", () => {
  let service: UserAuthService;
  let guardUserAuthService: GuardUserAuthService;
  let httpClientService: HttpClientService;
  let configService: ConfigService;

  class GuardUserAuthServiceMock {
    public isGetUserInfoResponse = jest.fn();
  }

  class HttpClientServiceMock {}

  class ConfigServiceMock {
    public gConnectConfig = jest.fn();
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthService,
        { provide: GuardUserAuthService, useClass: GuardUserAuthServiceMock },
        { provide: HttpClientService, useClass: HttpClientServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get<UserAuthService>(UserAuthService);
    guardUserAuthService = module.get<GuardUserAuthService>(GuardUserAuthService);
    httpClientService = module.get<HttpClientService>(HttpClientService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(guardUserAuthService).toBeDefined();
    expect(httpClientService).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe(UserAuthService.prototype.getUserInfo$.name, () => {
    let arg;

    beforeEach(() => {
      arg = "token";

      configService.gConnectConfig = jest.fn(() => ({ userAuthBaseUrl: "" } as any));
      httpClientService.get$ = jest.fn(() => of());
      jest.spyOn(guardUserAuthService, "isGetUserInfoResponse").mockReturnValue(false);
    });

    it("should call httpClient.get$ with correct path and header", () => {
      // arrange
      httpClientService.get$ = jest.fn(() => of());

      const expected = {
        path: `${service.config.gConnectConfig().userAuthBaseUrl}/userinfo`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + arg,
        },
      };

      // act
      return service
        .getUserInfo$(arg)
        .toPromise()
        .then(() => {
          expect(httpClientService.get$).toHaveBeenCalledWith(expected.path, { headers: expected.headers });
        })
        .catch((e) => fail(e));
    });

    it("should return 500 when return value of get$ is invalid", () => {
      // arrange
      httpClientService.get$ = jest.fn(() => of({ data: {} } as any));
      jest.spyOn(guardUserAuthService, "isGetUserInfoResponse").mockReturnValue(false);

      const expected = {
        code: 500,
      };

      // act
      return service
        .getUserInfo$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: BridgeXServerError) => {
          expect(e.code).toEqual(expected.code);
        });
    });

    it("should return same data given by get$", () => {
      // arrange
      const data = { hoge: "" };
      httpClientService.get$ = jest.fn(() => of({ data } as any));
      jest.spyOn(guardUserAuthService, "isGetUserInfoResponse").mockReturnValue(true);

      const expected = {
        data,
      };

      // act
      return service
        .getUserInfo$(arg)
        .toPromise()
        .then((d) => {
          expect(d).toEqual(expected.data);
        })
        .catch((e) => fail(e));
    });

    it("should return same data given by get$ when return value of get$ is valid", () => {
      // arrange
      const data = { hoge: "" };
      httpClientService.get$ = jest.fn(() => of({ data } as any));
      jest.spyOn(guardUserAuthService, "isGetUserInfoResponse").mockReturnValue(true);

      const expected = {
        data,
      };

      // act
      return service
        .getUserInfo$(arg)
        .toPromise()
        .then((d) => {
          expect(d).toEqual(expected.data);
        })
        .catch((e) => fail(e));
    });

    it("should return error when get$ failed", () => {
      // arrange
      httpClientService.get$ = jest.fn(() => throwError({}));
      jest.spyOn(guardUserAuthService, "isGetUserInfoResponse").mockReturnValue(true);

      const expected = {
        error: new BridgeXServerError(ErrorCode.INTERNAL, ""),
      };

      // act
      return service
        .getUserInfo$(arg)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: BridgeXServerError) => {
          expect(e.code).toEqual(expected.error.code);
        });
    });
  });
});
