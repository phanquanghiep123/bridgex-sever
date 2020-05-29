import { NestFactory } from "@nestjs/core";

import { App } from "./bootstrap";

import { Test } from "@nestjs/testing";

class ShutdownServiceMock {
  public configureGracefulShutdown = jest.fn((func) => func());
  public teardown$ = jest.fn();
}

class NestMicroserviceMock {
  public useGlobalPipes = jest.fn();
}

class NestApplicationMock {
  public connectMicroservice = jest.fn(() => new NestMicroserviceMock());
  public useGlobalPipes = jest.fn();
  public startAllMicroservicesAsync = jest.fn();
  public enableShutdownHooks = jest.fn();
  public shutdownServiceMock = new ShutdownServiceMock();
  public get = jest.fn(() => this.shutdownServiceMock);
  public listen = jest.fn();
  public useLogger = jest.fn();
  public use = jest.fn().mockReturnThis();
}

describe(App.name, () => {
  let app;
  let module;

  beforeEach(async () => {
    jest.restoreAllMocks();
    app = new NestApplicationMock();
    module = await Test.createTestingModule({}); // TestModule
  });

  describe(App.start.name, () => {
    it("should call NestFactory.create with AppModule", () => {
      // arrange
      jest.spyOn(NestFactory, "create").mockImplementation(() => new Promise((resolve) => resolve(app)));
      jest.spyOn(App, "setup").mockImplementation(
        () =>
          new Promise((resolve) => {
            resolve();
          }),
      );

      // act
      return App.start(module)
        .then(() => {
          expect(NestFactory.create).toHaveBeenCalledWith(module);
          expect(App.setup).toHaveBeenCalled();
        })
        .catch((e) => fail(e));
    });
  });

  describe(App.setup.name, () => {
    it("should call functions about this app", () => {
      // arrange

      // act
      return App.setup(app)
        .then(() => {
          expect(app.enableShutdownHooks).toHaveBeenCalled();
          expect(app.listen).toHaveBeenCalled();
          expect(app.shutdownServiceMock.configureGracefulShutdown).toHaveBeenCalled();
          expect(app.shutdownServiceMock.teardown$).toHaveBeenCalledWith(app);
        })
        .catch((e) => fail(e));
    });
  });
});
