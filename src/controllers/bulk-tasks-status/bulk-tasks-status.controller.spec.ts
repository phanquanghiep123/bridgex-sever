import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";

import { of, throwError } from "rxjs";

import { BulkTasksStatusController } from "./bulk-tasks-status.controller";
import { GuardBulkTasksStatus } from "./bulk-tasks-status.controller.guard";
import { TaskStatus } from "./bulk-tasks-status.controller.i";

import { TasksService } from "../../service/tasks/tasks.service";
import { TaskStatus as TaskStatusData, ETaskType, ETaskStatus, ETaskAssetStatus } from "../../service/tasks";

import { LoggerService } from "../../service/logger";
import { ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

describe("BulkTasksStatusController", () => {
  let controller: BulkTasksStatusController;
  let tasksService: TasksService;
  let guardBulkBulkTasksStatus: GuardBulkTasksStatus;
  let loggerService: LoggerService;
  let req: Request;
  let res: Response;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class TasksServiceMock {
    public getClient$ = jest.fn();
    public controlTransaction$ = jest.fn();
    public getTasksStatus$ = jest.fn();
    public getAssets$ = jest.fn();
    public convertToAssetStatus = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkTasksStatusController],
      providers: [{ provide: TasksService, useClass: TasksServiceMock }, GuardBulkTasksStatus, LoggerService],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get<BulkTasksStatusController>(BulkTasksStatusController);
    tasksService = module.get<TasksService>(TasksService);
    guardBulkBulkTasksStatus = module.get(GuardBulkTasksStatus);
    loggerService = module.get(LoggerService);

    req = {} as any;
    res = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    } as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(tasksService).toBeDefined();
    expect(loggerService).toBeDefined();
    expect(guardBulkBulkTasksStatus).toBeDefined();
  });

  describe("getBulkTasksStatus", () => {
    describe("case that req.body is invalid", () => {
      it("should return 400 when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkBulkTasksStatus, "isGetBulkTasksStatusBody").mockReturnValue(false);

        const expected = 400;

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected);
      });

      it("should return specified message when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkBulkTasksStatus, "isGetBulkTasksStatusBody").mockReturnValue(false);

        const expected = "Invalid Request Body";

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should call res.end() when request body is invalid form", () => {
        // arrange
        req.body = [];
        jest.spyOn(guardBulkBulkTasksStatus, "isGetBulkTasksStatusBody").mockReturnValue(false);

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });

    describe("case that req.body is valid", () => {
      beforeEach(() => {
        jest.spyOn(guardBulkBulkTasksStatus, "isGetBulkTasksStatusBody").mockReturnValue(true);
      });

      it("should call getTasksStatus$ with req.body", () => {
        // arrange
        req.body = [];
        jest.spyOn(tasksService, "getTasksStatus$").mockReturnValue(of([]));

        const expected = req.body;

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(tasksService.getTasksStatus$).toHaveBeenCalledWith(expected);
      });

      it("should respond tasks status when getTasksStatus$ succeeded", () => {
        // arrange
        const reqStatus: TaskStatus[] = [{ taskId: "taskId1" }, { taskId: "taskId2" }];
        const expected: TaskStatusData[] = [
          {
            taskId: "taskId1",
            taskType: ETaskType.DownloadPackage,
            status: ETaskStatus.Complete,
            taskAssets: [
              {
                typeId: "tyty",
                assetId: "asas",
                status: ETaskAssetStatus.Complete,
              },
            ],
          },
          {
            taskId: "taskId2",
            taskType: ETaskType.Log,
            status: ETaskStatus.Complete,
            taskAssets: [
              {
                typeId: "tyty",
                assetId: "asas",
                status: ETaskAssetStatus.Complete,
              },
            ],
          },
        ];
        req.body = reqStatus;
        jest.spyOn(tasksService, "getTasksStatus$").mockReturnValue(of(expected));

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected);
      });

      it("should call res.end() when process finish normally", () => {
        // arrange
        req.body = [];
        jest.spyOn(tasksService, "getTasksStatus$").mockReturnValue(of([]));

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });

      it("should call ErrorCode.categorize when lower layer emit error", () => {
        // arrange
        req.body = [];
        const error = Error("error");
        jest.spyOn(tasksService, "getTasksStatus$").mockReturnValue(throwError(error));
        jest.spyOn(ErrorCode, "categorize");

        const expected = error;

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(ErrorCode.categorize).toHaveBeenCalledWith(expected);
      });

      it("should respond error when lower layer emit error", () => {
        // arrange
        req.body = [];
        const error = Error("error");
        jest.spyOn(tasksService, "getTasksStatus$").mockReturnValue(throwError(error));

        const expected = ErrorCode.categorize(error);

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(res.status).toHaveBeenCalledWith(expected.code);
        expect(res.json).toHaveBeenCalledWith({ code: expected.code, message: expected.message });
      });

      it("should call res.end() when error occured", () => {
        // arrange
        req.body = [];
        jest.spyOn(tasksService, "getTasksStatus$").mockReturnValue(throwError(""));

        // act
        controller.getBulkTasksStatus(req, res);

        // assert
        expect(res.end).toHaveBeenCalled();
      });
    });
  });
});
