import { Controller, Req, Res, Post, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";

import { GuardBulkTasksStatus } from "./bulk-tasks-status.controller.guard";
import { TaskStatus } from "./bulk-tasks-status.controller.i";

import { TasksService, TaskStatus as TaskStatusData } from "../../service/tasks";
import { LoggerService } from "../../service/logger";
import { ErrorCode } from "../../service/utils";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";

@Controller("/bulk/tasks/")
@UseGuards(BearerTokenGuard)
export class BulkTasksStatusController {
  constructor(private tasksService: TasksService, private guard: GuardBulkTasksStatus, private logger: LoggerService) {}

  @Post("status")
  public getBulkTasksStatus(@Req() req: Request, @Res() res: Response) {
    this.logger.info("Enter POST /bulk/tasks/status");

    if (!this.guard.isGetBulkTasksStatusBody(req.body)) {
      return res
        .status(400)
        .json("Invalid Request Body")
        .end();
    }

    const params: TaskStatus[] = req.body;

    this.tasksService
      .getTasksStatus$(params)
      .subscribe(
        (data: TaskStatusData[]) => {
          this.logger.info("Succeeded to get task status list");
          res.status(200).json(data);
        },
        (e) => {
          const err = ErrorCode.categorize(e);
          this.logger.info(err.message);
          res.status(err.code).json({ code: err.code, message: err.message });
        },
      )
      .add(() => res.end());
  }
}
