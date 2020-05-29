import { Test, TestingModule } from "@nestjs/testing";

import { HttpClientService } from "./http-client.service";
import { LoggerService } from "../logger";
import { HttpService } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { AxiosRequestConfig, AxiosResponse } from "axios";

describe("HttpClientService", () => {
  let service: HttpClientService;
  let http: HttpService;
  let logger: LoggerService;

  class LoggerServiceMock {
    public info = jest.fn();
    public error = jest.fn();
  }

  class HttpServiceMock {
    public get = jest.fn(() => of());
    public post = jest.fn(() => of());
    public delete = jest.fn(() => of());
  }

  beforeEach(async () => {
    jest.restoreAllMocks();
    HttpClientService.requestCount = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpClientService,
        { provide: HttpService, useClass: HttpServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(HttpClientService);
    http = module.get(HttpService);
    logger = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(logger).toBeDefined();
  });

  describe("requestCount", () => {
    it("should be 0 at first", () => {
      // arrange
      const expected = 0;

      // act
      expect(HttpClientService.requestCount).toBe(expected);
    });

    it("should increase by one when calling method", () => {
      // arrange
      const expected = 1;

      // act
      return service
        .get$("path")
        .toPromise()
        .then(() => expect(HttpClientService.requestCount).toBe(expected))
        .catch(() => fail("test error"));
    });

    it("should increase by two when calling two methods", () => {
      // arrange
      const expected = 2;

      // act
      return service
        .get$("path")
        .toPromise()
        .then(() => service.post$("path"))
        .then(() => expect(HttpClientService.requestCount).toBe(expected))
        .catch(() => fail("test error"));
    });
  });

  describe("get$", () => {
    it("should leave log about executing http request", () => {
      // arrange
      const path = "";

      // act
      return service
        .get$(path)
        .toPromise()
        .then(() => {
          const count = HttpClientService.requestCount;
          const expected = `(${count}) GET ${path}`;
          expect(logger.info).toHaveBeenCalledWith(expected);
        })
        .catch(() => fail("test error"));
    });

    it("should call HttpService.get of Nestjs service with path and config", () => {
      // arrange
      const path = "/path";
      const config: AxiosRequestConfig = { timeout: 5000 };
      jest.spyOn(http, "get").mockReturnValueOnce(of());

      // act
      return service
        .get$(path, config)
        .toPromise()
        .then(() => expect(http.get).toHaveBeenCalledWith(path, config))
        .catch(() => fail("test error"));
    });

    it("should call logger.info with requestCount when succeeding request", () => {
      const path = "/path";
      const res = { status: 200 } as AxiosResponse;
      jest.spyOn(http, "get").mockReturnValueOnce(of(res));

      // act
      return service
        .get$(path)
        .toPromise()
        .then(() => {
          const expected = `(${HttpClientService.requestCount}) success GET ${path}`;
          expect(logger.info).toHaveBeenCalledWith(expected);
        })
        .catch(() => fail("test error"));
    });

    it("should return normal response when succeeding request", () => {
      const path = "/path";
      const res = { status: 200 } as AxiosResponse;
      jest.spyOn(http, "get").mockReturnValueOnce(of(res));

      // act
      return service
        .get$(path)
        .toPromise()
        .then((r) => expect(r).toEqual(res))
        .catch(() => fail("test error"));
    });

    it("should call logger.error with requestCount when failing request", () => {
      const path = "/path";
      const res = { status: 500 } as AxiosResponse;
      jest.spyOn(http, "get").mockReturnValueOnce(throwError(res));

      // act
      return service
        .get$(path)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          const expected = `(${HttpClientService.requestCount}) failure GET ${path}`;
          expect(logger.error).toHaveBeenCalledWith(expected);
        });
    });

    it("should return error response when failing request", () => {
      const path = "/path";
      const res = { status: 500 } as AxiosResponse;
      jest.spyOn(http, "get").mockReturnValueOnce(throwError(res));

      // act
      return service
        .get$(path)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e) => expect(e).toEqual(res));
    });
  });

  describe("post$", () => {
    it("should leave log about executing http request", () => {
      // arrange
      const path = "";

      // act
      return service
        .post$(path)
        .toPromise()
        .then(() => {
          const count = HttpClientService.requestCount;
          const expected = `(${count}) POST ${path}`;
          expect(logger.info).toHaveBeenCalledWith(expected);
        })
        .catch(() => fail("test error"));
    });

    it("should call HttpService.post of Nestjs service with path and config", () => {
      // arrange
      const path = "/path";
      const data = {};
      const config: AxiosRequestConfig = { timeout: 5000 };
      jest.spyOn(http, "post").mockReturnValueOnce(of());

      // act
      return service
        .post$(path, data, config)
        .toPromise()
        .then(() => expect(http.post).toHaveBeenCalledWith(path, data, config))
        .catch(() => fail("test error"));
    });

    it("should call logger.info with requestCount when succeeding request", () => {
      const path = "/path";
      const res = { status: 200 } as AxiosResponse;
      jest.spyOn(http, "post").mockReturnValueOnce(of(res));

      // act
      return service
        .post$(path)
        .toPromise()
        .then(() => {
          const expected = `(${HttpClientService.requestCount}) success POST ${path}`;
          expect(logger.info).toHaveBeenCalledWith(expected);
        })
        .catch(() => fail("test error"));
    });

    it("should return normal response when succeeding request", () => {
      const path = "/path";
      const res = { status: 201 } as AxiosResponse;
      jest.spyOn(http, "post").mockReturnValueOnce(of(res));

      // act
      return service
        .post$(path)
        .toPromise()
        .then((r) => expect(r).toEqual(res))
        .catch(() => fail("test error"));
    });

    it("should call logger.error with requestCount when failing request", () => {
      const path = "/path";
      const res = { status: 500 } as AxiosResponse;
      jest.spyOn(http, "post").mockReturnValueOnce(throwError(res));

      // act
      return service
        .post$(path)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          const expected = `(${HttpClientService.requestCount}) failure POST ${path}`;
          expect(logger.error).toHaveBeenCalledWith(expected);
        });
    });

    it("should return normal response when succeeding request", () => {
      const path = "/path";
      const res = { status: 500 } as AxiosResponse;
      jest.spyOn(http, "post").mockReturnValueOnce(throwError(res));

      // act
      return service
        .post$(path)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e) => expect(e).toEqual(res));
    });
  });

  describe("delete$", () => {
    it("should leave log about executing http request", () => {
      // arrange
      const path = "";

      // act
      return service
        .delete$(path)
        .toPromise()
        .then(() => {
          const count = HttpClientService.requestCount;
          const expected = `(${count}) DELETE ${path}`;
          expect(logger.info).toHaveBeenCalledWith(expected);
        })
        .catch(() => fail("test error"));
    });

    it("should call HttpService.delete of Nestjs service with path and config", () => {
      // arrange
      const path = "/path";
      const config: AxiosRequestConfig = { timeout: 5000 };
      jest.spyOn(http, "delete").mockReturnValueOnce(of());

      // act
      return service
        .delete$(path, config)
        .toPromise()
        .then(() => expect(http.delete).toHaveBeenCalledWith(path, config))
        .catch(() => fail("test error"));
    });

    it("should call logger.info with requestCount when succeeding request", () => {
      const path = "/path";
      const res = { status: 200 } as AxiosResponse;
      jest.spyOn(http, "delete").mockReturnValueOnce(of(res));

      // act
      return service
        .delete$(path)
        .toPromise()
        .then(() => {
          const expected = `(${HttpClientService.requestCount}) success DELETE ${path}`;
          expect(logger.info).toHaveBeenCalledWith(expected);
        })
        .catch(() => fail("test error"));
    });

    it("should return normal response when succeeding request", () => {
      const path = "/path";
      const res = { status: 201 } as AxiosResponse;
      jest.spyOn(http, "delete").mockReturnValueOnce(of(res));

      // act
      return service
        .delete$(path)
        .toPromise()
        .then((r) => expect(r).toEqual(res))
        .catch(() => fail("test error"));
    });

    it("should call logger.error with requestCount when failing request", () => {
      const path = "/delete";
      const res = { status: 500 } as AxiosResponse;
      jest.spyOn(http, "delete").mockReturnValueOnce(throwError(res));

      // act
      return service
        .delete$(path)
        .toPromise()
        .then(() => fail("test error"))
        .catch(() => {
          const expected = `(${HttpClientService.requestCount}) failure DELETE ${path}`;
          expect(logger.error).toHaveBeenCalledWith(expected);
        });
    });

    it("should return normal response when succeeding request", () => {
      const path = "/path";
      const res = { status: 500 } as AxiosResponse;
      jest.spyOn(http, "delete").mockReturnValueOnce(throwError(res));

      // act
      return service
        .delete$(path)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e) => expect(e).toEqual(res));
    });
  });
});
