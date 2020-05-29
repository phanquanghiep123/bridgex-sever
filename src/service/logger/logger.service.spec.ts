// ------------------------------------------------
class BunyanMock {
  public trace = jest.fn();
  public debug = jest.fn();
  public info = jest.fn();
  public warn = jest.fn();
  public error = jest.fn();
  public fatal = jest.fn();
}

jest.mock("bunyan", () => ({
  createLogger: jest.fn(() => new BunyanMock()),
}));

// ------------------------------------------------

import { Test, TestingModule } from "@nestjs/testing";
import { marbles } from "rxjs-marbles/jest";

import { LoggerService } from "./logger.service";
import { EventEmitter } from "events";

// ------------------------------------------------

describe("LoggerService", () => {
  let service: LoggerService;
  let bunyanMock: BunyanMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    bunyanMock = service.writer as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("verbose", () => {
    it("should call writer.trace with expected params", () => {
      // arrange
      const message = "message";
      const param = { foo: "bar" };

      // act
      service.verbose(message, param);

      // assert
      expect(bunyanMock.trace).toHaveBeenCalledWith(param, message);
    });

    it("should call writer.trace call with default params", () => {
      // arrange
      const message = "message";
      const param = {};

      // act
      service.verbose(message);

      // assert
      expect(bunyanMock.trace).toHaveBeenCalledWith(param, message);
    });
  });

  describe("trace", () => {
    it("should call writer.trace with expected params", () => {
      // arrange
      const message = "message";
      const param = { foo: "bar" };

      // act
      service.trace(message, param);

      // assert
      expect(bunyanMock.trace).toHaveBeenCalledWith(param, message);
    });

    it("should call writer.trace call with default params", () => {
      // arrange
      const message = "message";
      const param = {};

      // act
      service.trace(message);

      // assert
      expect(bunyanMock.trace).toHaveBeenCalledWith(param, message);
    });
  });

  describe("debug", () => {
    it("should call writer.debug with expected params", () => {
      // arrange
      const message = "message";
      const param = { foo: "bar" };

      // act
      service.debug(message, param);

      // assert
      expect(bunyanMock.debug).toHaveBeenCalledWith(param, message);
    });

    it("should call writer.debug call with default params", () => {
      // arrange
      const message = "message";
      const param = {};

      // act
      service.debug(message);

      // assert
      expect(bunyanMock.debug).toHaveBeenCalledWith(param, message);
    });
  });

  describe("log", () => {
    it("should call writer.info with expected params", () => {
      // arrange
      const message = "message";
      const param = { foo: "bar" };

      // act
      service.log(message, param);

      // assert
      expect(bunyanMock.info).toHaveBeenCalledWith(param, message);
    });

    it("should call writer.info call with default params", () => {
      // arrange
      const message = "message";
      const param = {};

      // act
      service.log(message);

      // assert
      expect(bunyanMock.info).toHaveBeenCalledWith(param, message);
    });
  });

  describe("info", () => {
    it("should call writer.info with expected params", () => {
      // arrange
      const message = "message";
      const param = { foo: "bar" };

      // act
      service.info(message, param);

      // assert
      expect(bunyanMock.info).toHaveBeenCalledWith(param, message);
    });

    it("should call writer.info call with default params", () => {
      // arrange
      const message = "message";
      const param = {};

      // act
      service.info(message);

      // assert
      expect(bunyanMock.info).toHaveBeenCalledWith(param, message);
    });
  });

  describe("warn", () => {
    it("should call writer.warn with expected params", () => {
      // arrange
      const message = "message";
      const param = { foo: "bar" };

      // act
      service.warn(message, param);

      // assert
      expect(bunyanMock.warn).toHaveBeenCalledWith(param, message);
    });

    it("should call writer.warn call with default params", () => {
      // arrange
      const message = "message";
      const param = {};

      // act
      service.warn(message);

      // assert
      expect(bunyanMock.warn).toHaveBeenCalledWith(param, message);
    });
  });

  describe("error", () => {
    it("should call writer.error with expected params", () => {
      // arrange
      const message = "message";
      const param = { foo: "bar" };

      // act
      service.error(message, param);

      // assert
      expect(bunyanMock.error).toHaveBeenCalledWith(param, message);
    });

    it("should call writer.error call with default params", () => {
      // arrange
      const message = "message";
      const param = {};

      // act
      service.error(message);

      // assert
      expect(bunyanMock.error).toHaveBeenCalledWith(param, message);
    });
  });

  describe("fatal", () => {
    it("should call writer.fatal with expected params", () => {
      // arrange
      const message = "message";
      const param = { foo: "bar" };

      // act
      service.fatal(message, param);

      // assert
      expect(bunyanMock.fatal).toHaveBeenCalledWith(param, message);
    });

    it("should call writer.fatal call with default params", () => {
      // arrange
      const message = "message";
      const param = {};

      // act
      service.fatal(message);

      // assert
      expect(bunyanMock.fatal).toHaveBeenCalledWith(param, message);
    });
  });

  describe("createLoggingObserver()", () => {
    it(
      "should write logs for observable",
      marbles((m) => {
        // arrange
        const sourceMarbles = "-0-1-2-|";
        const source = {
          0: { foo: 0 },
          1: { foo: 1 },
          2: { foo: 2 },
        };

        const hot$ = m.hot(sourceMarbles, source);

        const expected = [
          [{ foo: 0 }, "test :next"],
          [{ foo: 1 }, "test :next"],
          [{ foo: 2 }, "test :next"],
          [undefined, "test :complete"],
        ];

        // act
        hot$.subscribe(service.createLoggingObserver("test"));

        // stream source data
        m.flush();

        // assert
        expect(bunyanMock.debug).toHaveBeenNthCalledWith(1, ...expected[0]);
        expect(bunyanMock.debug).toHaveBeenNthCalledWith(2, ...expected[1]);
        expect(bunyanMock.debug).toHaveBeenNthCalledWith(3, ...expected[2]);
      }),
    );

    it(
      "should write error logs for observable",
      marbles((m) => {
        // arrange

        const sourceMarbles = "-0-1-#";
        const source = {
          0: { foo: 0 },
          1: { foo: 1 },
        };
        const error = new Error("error des");

        const hot$ = m.hot(sourceMarbles, source, error);

        const expected = [
          [{ foo: 0 }, "test :next"],
          [{ foo: 1 }, "test :next"],
        ];
        const expectedError = [{ error }, "test :error"];

        // act
        hot$.subscribe(service.createLoggingObserver("test"));

        // stream source data
        m.flush();

        // assert
        expect(bunyanMock.debug).toHaveBeenNthCalledWith(1, ...expected[0]);
        expect(bunyanMock.debug).toHaveBeenNthCalledWith(2, ...expected[1]);
        expect(bunyanMock.error).toHaveBeenCalledWith(...expectedError);
      }),
    );
  });

  describe("requestLogger", () => {
    class RequestMock extends EventEmitter {
      constructor(public url = "https://hoge.svc/foo", public method = "GET", public query = {}, public params = {}, public headers = {}) {
        super();
      }
    }

    class ResponsetMock {
      constructor(public statusCode = 200, public statusMessage = "OK") {}

      public getHeaders = jest.fn().mockReturnValue({ foo: "bar" });
      public getHeader = jest.fn().mockReturnValue("123");
      public send = jest.fn().mockReturnThis();
      public end = jest.fn();
    }

    describe("isDebug === false", () => {
      it("should return handler", () => {
        // arrage
        // act
        const actual = service.requestLogger();

        // assert
        expect(actual).toBeInstanceOf(Function);
      });

      it("should call next at the end", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        // act
        handler(req as any, res as any, next);

        // assert
        expect(next).toHaveBeenCalled();
      });

      it("should call info twice", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();
        jest.spyOn(service, "info");

        // act
        handler(req as any, res as any, next);
        res.end();

        // assert
        expect(service.info).toHaveBeenCalledTimes(2);
      });

      it("should write different request number when handler calls several times", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();
        const spy = jest.spyOn(service, "info");

        // act
        handler(req as any, res as any, next);
        handler(req as any, res as any, next);

        // assert
        const matcher = /^Router\(\d+\) HTTP GET: https:\/\/hoge.svc\/foo - request$/;
        expect(spy.mock.calls[0][0]).toMatch(matcher);
        expect(spy.mock.calls[1][0]).toMatch(matcher);
        expect(spy.mock.calls[0][0]).not.toEqual(spy.mock.calls[1][0]);
      });

      it("should make request number to 0 when handler was called 10000 times", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();
        const spy = jest.spyOn(service, "info");

        // act
        for (let index = 0; index < 10001; index++) {
          handler(req as any, res as any, next);
        }

        const firstRes = spy.mock.calls.shift()[0];
        const lastRes = spy.mock.calls.pop()[0];

        // assert
        expect(firstRes).toEqual(lastRes);
      });

      it("should start request number from the same number if handler instance is different", () => {
        // arrage
        const handler1 = service.requestLogger();
        const handler2 = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();
        const spy = jest.spyOn(service, "info");

        // act
        handler1(req as any, res as any, next);
        handler2(req as any, res as any, next);

        const firstRes = spy.mock.calls.shift()[0];
        const lastRes = spy.mock.calls.pop()[0];

        // assert
        expect(firstRes).toEqual(lastRes);
      });

      it("should write different request number when handler calls several times", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();
        const spy = jest.spyOn(service, "info");

        // act
        handler(req as any, res as any, next);
        handler(req as any, res as any, next);

        // assert
        const matcher = /^Router\(\d+\) HTTP GET: https:\/\/hoge.svc\/foo - request$/;
        expect(spy.mock.calls[0][0]).toMatch(matcher);
        expect(spy.mock.calls[1][0]).toMatch(matcher);
        expect(spy.mock.calls[0][0]).not.toEqual(spy.mock.calls[1][0]);
      });

      it("should call info warn if statusCode is 400 (400 <= statusCode < 500)", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        // act
        res.statusCode = 400;
        handler(req as any, res as any, next);
        jest.spyOn(service, "warn");
        res.end();

        // assert
        expect(service.warn).toHaveBeenCalledTimes(1);
      });

      it("should call info warn if statusCode is 499 (400 <= statusCode < 500)", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        // act
        res.statusCode = 499;
        handler(req as any, res as any, next);
        jest.spyOn(service, "warn");
        res.end();

        // assert
        expect(service.warn).toHaveBeenCalledTimes(1);
      });

      it("should call info error if statusCode is 500 (statusCode < 200, 500 <= statusCode)", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        // act
        res.statusCode = 500;
        handler(req as any, res as any, next);
        jest.spyOn(service, "error");
        res.end();

        // assert
        expect(service.error).toHaveBeenCalledTimes(1);
      });

      it("should call info error if statusCode is 199 (400 <= statusCode < 500)", () => {
        // arrage
        const handler = service.requestLogger();
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        // act
        res.statusCode = 199;
        handler(req as any, res as any, next);
        jest.spyOn(service, "error");
        res.end();

        // assert
        expect(service.error).toHaveBeenCalledTimes(1);
      });
    });

    describe("isDebug === true", () => {
      it("should create request body from event emitter", () => {
        // arrage
        const handler = service.requestLogger(true);
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        const expected = { body: { foo: 1, bar: "2", hoge: { bazz: "hoo" } } };
        const params = [`{ "foo": 1, "bar": "2", "ho`, `ge": { "bazz": "hoo" } }`];

        // act
        handler(req as any, res as any, next);
        jest.spyOn(service, "info");

        params.forEach((data) => req.emit("data", data));
        req.emit("end");

        // assert
        expect(service.info).toHaveBeenCalledWith(expect.any(String), expected);
      });

      it("should create response body from send(object)", () => {
        // arrage
        const handler = service.requestLogger(true);
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        const expected = {
          headers: res.getHeaders(),
          request: { url: req.url, method: req.method },
          body: { foo: 1, bar: "2", hoge: { bazz: "hoo" } },
        };

        // act
        handler(req as any, res as any, next);
        jest.spyOn(service, "info");

        res.send(expected.body).end();

        // assert
        expect(service.info).toHaveBeenCalledWith(expect.any(String), expected);
      });

      it("should create response body from send(string)", () => {
        // arrage
        const handler = service.requestLogger(true);
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        const expected = {
          headers: res.getHeaders(),
          request: { url: req.url, method: req.method },
          body: "some thing like a string body",
        };

        // act
        handler(req as any, res as any, next);
        jest.spyOn(service, "info");

        res.send(expected.body).end();

        // assert
        expect(service.info).toHaveBeenCalledWith(expect.any(String), expected);
      });

      it("should create response body from send(Buffer)", () => {
        // arrage
        const handler = service.requestLogger(true);
        const req = new RequestMock();
        const res = new ResponsetMock();
        const next = jest.fn();

        const expected = {
          headers: res.getHeaders(),
          request: { url: req.url, method: req.method },
          body: { foo: 1, bar: "2", hoge: { bazz: "hoo" } },
        };

        // act
        handler(req as any, res as any, next);
        jest.spyOn(service, "info");

        res.send(Buffer.from(JSON.stringify(expected.body))).end();

        // assert
        expect(service.info).toHaveBeenCalledWith(expect.any(String), expected);
      });
    });
  });
});
