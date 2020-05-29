import { TestingModule, Test } from "@nestjs/testing";

import { ShutdownService } from "./shutdown.service";
import { LoggerService } from "../logger/logger.service";
import { of, throwError } from "rxjs";

describe("PostgresService", () => {
  let module: TestingModule;
  let service: ShutdownService;

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    module = await Test.createTestingModule({
      providers: [ShutdownService, { provide: LoggerService, useClass: LoggerServiceMock }],
    }).compile();

    service = module.get<ShutdownService>(ShutdownService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("onApplicationShutdown", () => {
    it("should call callback function and process.exit only once when receiving SIGANL", () => {
      // arrange
      const func = jest.fn(() => of(null));
      process.exit = jest.fn() as any;

      // act
      service.configureGracefulShutdown(func);
      service.onApplicationShutdown("SIGTERM");
      service.onApplicationShutdown("SIGTERM");

      // assert
      expect(func).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it("should call callback function and process.exit only once when shutdown failed", () => {
      // arrange
      const func = jest.fn(() => throwError(null));
      process.exit = jest.fn() as any;

      // act
      service.configureGracefulShutdown(func);
      service.onApplicationShutdown("SIGTERM");
      service.onApplicationShutdown("SIGTERM");

      // assert
      expect(func).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("teardown", () => {
    it("should call app.close", async () => {
      // arrange
      const app = module.createNestApplication();
      jest.spyOn(app, "close");

      // act
      return service
        .teardown$(app)
        .toPromise()
        .then(() => {
          expect(app.close).toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });
  });
});
