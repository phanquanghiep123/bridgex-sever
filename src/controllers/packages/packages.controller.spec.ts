import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common/exceptions";
import { of, throwError } from "rxjs";
import express, { Request } from "express";

import { PackagesController } from "./packages.controller";
import { PostBody, Package } from "./packages.controller.i";
import { IbmCosService } from "../../service/ibm-cos";
import { UserAuthService } from "../../service/user-auth";
import { GuardPackages } from "./packages.controller.guard";
import {
  PackagesService,
  EPackageStatus,
  GetPackageParams,
  PackageRecord,
  UpdatePackageParams,
  Package as PackageOfSvc,
} from "../../service/packages";
import { ConfigService } from "../../service/config";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { ErrorCode, BridgeXServerError } from "../../service/utils";
import { FtpClientService } from "../../service/ftp-client/ftp-client.service";

describe(PackagesController.name, () => {
  let controller: PackagesController;
  let packagesService: PackagesService;
  let ibmCosService: IbmCosService;
  let ftpClientService: FtpClientService;
  let userAuthService: UserAuthService;
  let configService: ConfigService;
  let guardPackages: GuardPackages;
  let loggerService: LoggerService;
  let res: express.Response;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class PackagesServiceMock {
    public get$ = jest.fn();
    public upsertNote$ = jest.fn();
    public getPackageWithoutElements$ = jest.fn();
    public deletePackage$ = jest.fn();
  }

  class IbmCosServiceMock {
    public deleteObject$ = jest.fn();
  }

  class UserAuthServiceMock {}

  class ConfigServiceMock {
    public objectStorageConfig = jest.fn(() => ({ bucket: "", pathPrefix: "" }));
  }

  class GuardPackagesMock {
    public isPostBody = jest.fn(() => false);
    public isGetPackageParams = jest.fn(() => false);
    public isDeletePath = jest.fn(() => false);
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class FtpClientServiceMock {
    public putObject$ = jest.fn().mockReturnValue(of(null));
    public deleteObject$ = jest.fn().mockReturnValue(of(null));
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackagesController],
      providers: [
        { provide: PackagesService, useClass: PackagesServiceMock },
        { provide: IbmCosService, useClass: IbmCosServiceMock },
        { provide: UserAuthService, useClass: UserAuthServiceMock },
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: GuardPackages, useClass: GuardPackagesMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: FtpClientService, useClass: FtpClientServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(PackagesController);
    packagesService = module.get(PackagesService);
    ibmCosService = module.get(IbmCosService);
    userAuthService = module.get(UserAuthService);
    configService = module.get(ConfigService);
    guardPackages = module.get(GuardPackages);
    loggerService = module.get(LoggerService);
    ftpClientService = module.get(FtpClientService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(packagesService).toBeDefined();
    expect(ibmCosService).toBeDefined();
    expect(userAuthService).toBeDefined();
    expect(configService).toBeDefined();
    expect(guardPackages).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(PackagesController.prototype.postPackage.name, () => {
    let arg;

    beforeEach(() => {
      arg = {
        body: {
          name: "",
        } as PostBody,
        req: {},
      };

      guardPackages.isPostBody = jest.fn(() => false);
      controller.getTokenFromHeader = jest.fn(() => "");
      configService.objectStorageConfig().bucket = "bucket";
      userAuthService.getUserInfo$ = jest.fn(() => of());
      packagesService.insertPackage$ = jest.fn(() => of());
      ibmCosService.putObjectUrl$ = jest.fn(() => of());
    });

    it("should return 401 when request bearer token is invalid", () => {
      // arrange
      controller.getTokenFromHeader = jest.fn(() => "");

      const expected = { code: 401 };

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should return 404 when request params are invalid", () => {
      // arrange
      guardPackages.isPostBody = jest.fn(() => false);
      controller.getTokenFromHeader = jest.fn(() => "token");

      const expected = { code: 400 };

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call userAuthService.getUserInfo$ with token", () => {
      // arrange
      guardPackages.isPostBody = jest.fn(() => true);
      const token = "token";
      controller.getTokenFromHeader = jest.fn(() => token);

      const expected = { token };

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(userAuthService.getUserInfo$).toHaveBeenCalledWith(expected.token);
        })
        .catch((e) => fail(e));
    });

    it("should call packagesService.insertPackage$", () => {
      // arrange
      guardPackages.isPostBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      const userName = "didi";
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: userName }) as any);

      const expected = {
        packageId: expect.any(String),
        name: arg.body.name,
        status: EPackageStatus.Uploading,
        comment: "",
        uploadBy: userName,
        summary: "",
        description: "",
        model: "",
        memo: "",
        bucketName: configService.objectStorageConfig().bucket,
        objectName: expect.any(String),
      };

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(packagesService.insertPackage$).toHaveBeenCalledWith(expect.objectContaining(expected));
        })
        .catch((e) => fail(e));
    });

    it("should call ibmCosService.putObjectUrl$", () => {
      // arrange
      guardPackages.isPostBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      packagesService.insertPackage$ = jest.fn(() => of(null));

      const expected = expect.any(String);

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then(() => {
          expect(ibmCosService.putObjectUrl$).toHaveBeenCalledWith(expected);
        })
        .catch((e) => fail(e));
    });

    it("should return object including packageId and uploadUrl", () => {
      // arrange
      guardPackages.isPostBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      packagesService.insertPackage$ = jest.fn(() => of(null));
      const uploadUrl = "uploadUrl";
      ibmCosService.putObjectUrl$ = jest.fn(() => of(uploadUrl));

      const expected = {
        packageId: expect.any(String),
        uploadUrl,
      };

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then((d) => {
          expect(d).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it("should return error when getUserInfo$ failed (e.g. 404)", () => {
      // arrange
      guardPackages.isPostBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      userAuthService.getUserInfo$ = jest.fn(() => throwError({ code: 404, message: "" }));
      // packagesService.insertPackage$ = jest.fn(() => of(null));
      // ibmCosService.putObjectUrl$ = jest.fn(() => of(uploadUrl));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should return error when insertPackage$ failed (e.g. 404)", () => {
      // arrange
      guardPackages.isPostBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      packagesService.insertPackage$ = jest.fn(() => throwError({ code: 404, message: "" }));
      // ibmCosService.putObjectUrl$ = jest.fn(() => of("uploadUrl"));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should return error when putObjectUrl$ failed (e.g. 404)", () => {
      // arrange
      guardPackages.isPostBody = jest.fn(() => true);
      controller.getTokenFromHeader = jest.fn(() => "token");
      userAuthService.getUserInfo$ = jest.fn(() => of({ displayName: "didi" }) as any);
      packagesService.insertPackage$ = jest.fn(() => of(null));
      ibmCosService.putObjectUrl$ = jest.fn(() => throwError({ code: 404, message: "" }));

      const expected = {
        code: 404,
      };

      // act
      return controller
        .postPackage(arg.body, arg.req)
        .toPromise()
        .then((d) => fail(d))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });
  });

  describe(PackagesController.prototype.getPackages.name, () => {
    let params: GetPackageParams = {
      limit: "20",
      offset: "0",
      text: "model",
      status: EPackageStatus.Complete,
      sortName: "name",
      sort: "desc",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    } as any;
    describe("case that req.body is invalid", () => {
      it("should throw error when query param is invalid form", () => {
        // arrange
        guardPackages.isGetPackageParams = jest.fn(() => false);

        const expected = { code: 400 };

        // act
        return controller
          .getPackages(params, res)
          .toPromise()
          .then(() => fail("test error"))
          .catch((e: HttpException) => {
            expect(e.getStatus()).toEqual(expected.code);
          });
      });
    });

    describe("case that req.body is valid", () => {
      beforeEach(() => {
        jest.spyOn(guardPackages, "isGetPackageParams").mockReturnValue(true);
      });

      it("should call get$ with params", () => {
        // arrange
        jest.spyOn(packagesService, "get$").mockReturnValue(of([]));
        const expected = {
          limit: "20",
          offset: "0",
          text: "%model%",
          status: EPackageStatus.Complete,
          sortName: "name",
          sort: "desc",
        };

        // act
        controller.getPackages(params, res);

        // assert
        expect(packagesService.get$).toHaveBeenCalledWith(expected);
      });

      it("should call get$ with default", () => {
        // arrange
        params = {
          limit: undefined,
          offset: undefined,
          text: undefined,
          sortName: undefined,
          sort: undefined,
        };
        jest.spyOn(packagesService, "get$").mockReturnValue(of([]));
        const expected = {
          limit: "20",
          offset: "0",
          text: "%",
          sortName: "date",
          sort: "desc",
        };

        // act
        controller.getPackages(params, res);

        // assert
        expect(packagesService.get$).toHaveBeenCalledWith(expected);
      });

      it("should respond package list (1 record) when get$ succeeded", () => {
        // arrange
        const date = new Date("2020/01/01");
        const expected: Package[] = [
          {
            packageId: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            date: date.toISOString(),
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            uploadBy: "someone",
            elements: [{ name: "keykey", version: "valuevalue" }],
          },
        ];
        const ret: PackageRecord[] = [
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "keykey",
            value: "valuevalue",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
        ];
        jest.spyOn(packagesService, "get$").mockReturnValue(of(ret));

        // act
        controller.getPackages(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should respond package list (2 records) when get$ succeeded", () => {
        // arrange
        const date = new Date("2020/01/01");
        const expected: Package[] = [
          {
            packageId: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            date: date.toISOString(),
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            uploadBy: "someone",
            elements: [
              { name: "keykey", version: "valuevalue" },
              { name: "keykey2", version: "valuevalue2" },
            ],
          },
        ];
        const ret: PackageRecord[] = [
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "keykey",
            value: "valuevalue",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "keykey2",
            value: "valuevalue2",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
        ];
        jest.spyOn(packagesService, "get$").mockReturnValue(of(ret));

        // act
        controller.getPackages(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });
      it("should respond package list (multi records) when get$ succeeded", () => {
        // arrange
        const date = new Date("2020/01/01");
        const expected: Package[] = [
          {
            packageId: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            date: date.toISOString(),
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            uploadBy: "someone",
            elements: [
              { name: "keykey", version: "valuevalue" },
              { name: "keykey2", version: "valuevalue2" },
            ],
          },
          {
            packageId: "yyy-yyy-yyy-yyy",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            date: date.toISOString(),
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            uploadBy: "someone",
            elements: [{ name: "keykey3", version: "valuevalue3" }],
          },
        ];
        const ret: PackageRecord[] = [
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "keykey",
            value: "valuevalue",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "keykey2",
            value: "valuevalue2",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
          {
            id: "yyy-yyy-yyy-yyy",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "keykey3",
            value: "valuevalue3",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
        ];
        jest.spyOn(packagesService, "get$").mockReturnValue(of(ret));

        // act
        controller.getPackages(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });
      it("should respond package list (irregular records) when get$ succeeded", () => {
        // arrange
        const date = new Date("2020/01/01");
        const expected: Package[] = [
          {
            packageId: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            date: date.toISOString(),
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            uploadBy: "someone",
            elements: [{ name: "keykey2", version: "valuevalue2" }],
          },
          {
            packageId: "yyy-yyy-yyy-yyy",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            date: date.toISOString(),
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            uploadBy: "someone",
            elements: [{ name: "keykey3", version: "valuevalue3" }],
          },
        ];
        const ret: PackageRecord[] = [
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "",
            value: "",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "keykey2",
            value: "valuevalue2",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
          {
            id: "yyy-yyy-yyy-yyy",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "1",
            key: "keykey3",
            value: "valuevalue3",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
        ];
        jest.spyOn(packagesService, "get$").mockReturnValue(of(ret));

        // act
        controller.getPackages(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should be set X-Total-Count", () => {
        // arrange
        const date = new Date("2020/01/01");
        const ret: PackageRecord[] = [
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "2",
            key: "keykey",
            value: "valuevalue",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
          {
            id: "xxx-xxx-xxx-xxx",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "2",
            key: "keykey2",
            value: "valuevalue2",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
          {
            id: "yyy-yyy-yyy-yyy",
            name: "000001",
            status: EPackageStatus.Uploading,
            summary: "no no",
            updateUtc: date,
            model: "CI-10",
            memo: "memomemo",
            description: "descdesc",
            updateBy: "someone",
            totalCount: "2",
            key: "keykey3",
            value: "valuevalue3",
            comment: "commentcomment",
            bucketName: "yyy",
            objectName: "zzz",
            ftpFilePath: "xxx",
          },
        ];
        jest.spyOn(packagesService, "get$").mockReturnValue(of(ret));
        const expected = {
          "Access-Control-Expose-Headers": "X-Total-Count",
          "X-Total-Count": "2",
        };

        // act
        controller.getPackages(params, res);

        // assert
        expect(res.set).toHaveBeenCalledWith(expected);
      });

      it("should respond error when lower layer emit error", () => {
        // arrange
        const error = new BridgeXServerError(500, "error");
        jest.spyOn(packagesService, "get$").mockReturnValue(throwError(error));

        const expected = ErrorCode.categorize(error);

        // act
        controller.getPackages(params, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected.code);
        expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
      });

      it("should call res.end() when error occured", () => {
        // arrange
        const error = Error("error");
        jest.spyOn(packagesService, "get$").mockReturnValue(throwError(error));

        // act
        controller.getPackages(params, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });
  });

  describe(PackagesController.prototype.getTokenFromHeader.name, () => {
    let req: Request;

    beforeEach(() => {
      req = {
        headers: {
          authorization: "",
        },
      } as Request;
    });

    describe("should return token when authorization header has correct Bearer token", () => {
      it('should include "Bearer "', () => {
        // arrange
        const token = "token";
        req = {
          headers: {
            authorization: "Bearer " + token,
          },
        } as Request;

        const expected = token;

        // act
        const actual = controller.getTokenFromHeader(req);

        // assert
        expect(actual).toEqual(expected);
      });

      it('should include "bEaReR "', () => {
        // arrange
        const token = "token";
        req = {
          headers: {
            authorization: "bEaReR " + token,
          },
        } as Request;

        const expected = token;

        // act
        const actual = controller.getTokenFromHeader(req);

        // assert
        expect(actual).toEqual(expected);
      });
    });

    describe("should return empty string when authorization header has incorrect Bearer token", () => {
      it("authorization doesn't exist", () => {
        // arrange
        req = { headers: {} } as Request;

        const expected = "";

        // act
        const actual = controller.getTokenFromHeader(req);

        // assert
        expect(actual).toEqual(expected);
      });

      it('initial "Bearer " doesn\'t exist in authorization header', () => {
        // arrange
        req = {
          headers: {
            authorization: "token",
          },
        } as Request;

        const expected = "";

        // act
        const actual = controller.getTokenFromHeader(req);

        // assert
        expect(actual).toEqual(expected);
      });
    });
  });

  describe(PackagesController.prototype.updatePackage.name, () => {
    let arg;

    beforeEach(() => {
      arg = {
        packageId: "packageId",
        body: {
          memo: "memo",
        },
      };

      guardPackages.isPutPath = jest.fn(() => false);
      guardPackages.isPutBody = jest.fn(() => false);
      packagesService.updatePackage$ = jest.fn(() => of());
    });

    it("should return 404 when request path params are invalid", () => {
      // arrange
      const expected = { code: 404 };

      guardPackages.isPutPath = jest.fn(() => false);

      // act
      return controller
        .updatePackage(arg.packageId, arg.body)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should return 400 when request body is invalid", () => {
      // arrange
      const expected = { code: 400 };

      guardPackages.isPutPath = jest.fn(() => true);
      guardPackages.isPutBody = jest.fn(() => false);

      // act
      return controller
        .updatePackage(arg.packageId, arg.body)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call packageService.updatePackage$ with defineded params", () => {
      // arrange
      const expected: UpdatePackageParams = {
        packageId: arg.packageId,
        memo: "memo",
      };

      guardPackages.isPutPath = jest.fn(() => true);
      guardPackages.isPutBody = jest.fn(() => true);
      packagesService.updatePackage$ = jest.fn(() => of());

      // act
      return controller
        .updatePackage(arg.packageId, arg.body)
        .toPromise()
        .then(() => {
          expect(packagesService.updatePackage$).toHaveBeenCalledWith(expected);
        })
        .catch((e) => fail(e));
    });

    it("should return null when service succeded", () => {
      // arrange
      const expected = null;

      guardPackages.isPutPath = jest.fn(() => true);
      guardPackages.isPutBody = jest.fn(() => true);
      packagesService.updatePackage$ = jest.fn(() => of(null));

      // act
      return controller
        .updatePackage(arg.packageId, arg.body)
        .toPromise()
        .then((d) => {
          expect(loggerService.info).toHaveBeenCalled();
          expect(d).toEqual(expected);
        })
        .catch((e) => fail(e));
    });

    it("should return error code given by service when service failed", () => {
      // arrange
      const expected = { code: 405 };

      guardPackages.isPutPath = jest.fn(() => true);
      guardPackages.isPutBody = jest.fn(() => true);
      packagesService.updatePackage$ = jest.fn(() => throwError(new BridgeXServerError(405, "")));

      // act
      return controller
        .updatePackage(arg.packageId, arg.body)
        .toPromise()
        .then(() => fail("test error"))
        .catch((e: HttpException) => {
          expect(e.getStatus()).toEqual(expected.code);
        });
    });
  });

  describe(PackagesController.prototype.deletePackage.name, () => {
    it("should return 404 when request path params are invalid", () => {
      // arrange
      const arg = "idid";
      const expected = {
        isDeletePath: { packageId: "idid" },
        code: 404,
      };

      jest.spyOn(guardPackages, "isDeletePath").mockReturnValue(false);

      // act
      return controller
        .deletePackage(arg)
        .toPromise()
        .then(fail)
        .catch((e: HttpException) => {
          expect(guardPackages.isDeletePath).toHaveBeenCalledWith(expected.isDeletePath);
          expect(e.getStatus()).toEqual(expected.code);
        });
    });

    it("should call packageService.deletePackage$ with packageId", () => {
      // arrange
      const arg = "idid";
      const input = {
        getPackage: { objectName: "nana" } as PackageOfSvc,
      };
      const expected = {
        isDeletePath: { packageId: "idid" },
        getPackageWithoutElements: "idid",
        deletePackage: "idid",
        deleteObject: "nana",
      };

      jest.spyOn(guardPackages, "isDeletePath").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(input.getPackage));
      jest.spyOn(packagesService, "deletePackage$").mockReturnValue(of(null));
      jest.spyOn(ibmCosService, "deleteObject$").mockReturnValue(of(null));
      jest.spyOn(ftpClientService, "deleteObject$").mockReturnValue(of(null));

      // act
      return controller
        .deletePackage(arg)
        .toPromise()
        .then(() => {
          expect(guardPackages.isDeletePath).toHaveBeenCalledWith(expected.isDeletePath);
          expect(packagesService.getPackageWithoutElements$).toHaveBeenCalledWith(expected.getPackageWithoutElements);
          expect(packagesService.deletePackage$).toHaveBeenCalledWith(expected.deletePackage);
          expect(ibmCosService.deleteObject$).toHaveBeenCalledWith(expected.deleteObject);
        })
        .catch(fail);
    });

    it("should return error when returned service error", () => {
      // arrange
      const arg = "idid";
      const error = new BridgeXServerError(123, "test error");
      const expected = {
        code: 123,
      };

      jest.spyOn(guardPackages, "isDeletePath").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(throwError(error));

      // act
      return controller
        .deletePackage(arg)
        .toPromise()
        .then(fail)
        .catch((err) => {
          expect(err.status).toEqual(expected.code);
        });
    });

    it("should call ibmCosService.deleteObject$ with expected params", () => {
      // arrange
      const arg = "idid";
      const returnParams = {
        getPackageWithoutElements$: {
          objectName: "object/name",
          ftpFilePath: "ftp/file/path",
        } as PackageOfSvc,
      };
      const expected = returnParams.getPackageWithoutElements$.objectName;

      jest.spyOn(guardPackages, "isDeletePath").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(returnParams.getPackageWithoutElements$));
      jest.spyOn(packagesService, "deletePackage$").mockReturnValue(of(null));
      jest.spyOn(ibmCosService, "deleteObject$").mockReturnValue(of(null));
      jest.spyOn(ftpClientService, "deleteObject$").mockReturnValue(of(null));

      // act
      return controller
        .deletePackage(arg)
        .toPromise()
        .then(() => expect(ibmCosService.deleteObject$).toHaveBeenCalledWith(expected))
        .catch(fail);
    });

    it("should call ftpClientService.deleteObject$ with expected params", () => {
      // arrange
      const arg = "idid";
      const returnParams = {
        getPackageWithoutElements$: {
          objectName: "object/name",
          ftpFilePath: "ftp/file/path",
        } as PackageOfSvc,
      };
      const expected = returnParams.getPackageWithoutElements$.ftpFilePath;

      jest.spyOn(guardPackages, "isDeletePath").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(returnParams.getPackageWithoutElements$));
      jest.spyOn(packagesService, "deletePackage$").mockReturnValue(of(null));
      jest.spyOn(ibmCosService, "deleteObject$").mockReturnValue(of(null));
      jest.spyOn(ftpClientService, "deleteObject$").mockReturnValue(of(null));

      // act
      return controller
        .deletePackage(arg)
        .toPromise()
        .then(() => expect(ftpClientService.deleteObject$).toHaveBeenCalledWith(expected))
        .catch(fail);
    });

    it("should complete even if cannot remove file from Object Storage", () => {
      // arrange
      const arg = "idid";
      const returnParams = {
        getPackageWithoutElements$: { objectName: "nana" } as PackageOfSvc,
      };
      const expected = null;

      jest.spyOn(guardPackages, "isDeletePath").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(returnParams.getPackageWithoutElements$));
      jest.spyOn(packagesService, "deletePackage$").mockReturnValue(of(null));
      jest.spyOn(ibmCosService, "deleteObject$").mockReturnValue(throwError(new Error("error des")));
      jest.spyOn(ftpClientService, "deleteObject$").mockReturnValue(of(null));

      // act
      return controller
        .deletePackage(arg)
        .toPromise()
        .then((actual) => expect(actual).toEqual(expected))
        .then(() => expect(ftpClientService.deleteObject$).toHaveBeenCalled())
        .then(() =>
          expect(loggerService.warn).toHaveBeenCalledWith(
            expect.stringMatching(/^Failure to remove file from Object Storage/i),
            expect.anything(),
          ),
        )
        .catch(fail);
    });

    it("should complete even if cannot remove file from FTP Server", () => {
      // arrange
      const arg = "idid";
      const returnParams = {
        getPackageWithoutElements$: { objectName: "nana" } as PackageOfSvc,
      };
      const expected = null;

      jest.spyOn(guardPackages, "isDeletePath").mockReturnValue(true);
      jest.spyOn(packagesService, "getPackageWithoutElements$").mockReturnValue(of(returnParams.getPackageWithoutElements$));
      jest.spyOn(packagesService, "deletePackage$").mockReturnValue(of(null));
      jest.spyOn(ibmCosService, "deleteObject$").mockReturnValue(of(null));
      jest.spyOn(ftpClientService, "deleteObject$").mockReturnValue(throwError(new Error("error des")));

      // act
      return controller
        .deletePackage(arg)
        .toPromise()
        .then((actual) => expect(actual).toEqual(expected))
        .then(() => expect(ibmCosService.deleteObject$).toHaveBeenCalled())
        .then(() =>
          expect(loggerService.warn).toHaveBeenCalledWith(
            expect.stringMatching(/^Failure to remove file from FTP Server/i),
            expect.anything(),
          ),
        )
        .catch((err) => fail(JSON.stringify(err)));
    });
  });
});
