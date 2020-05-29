import { Test, TestingModule } from "@nestjs/testing";
import { of } from "rxjs";

import { BridgeEventListService } from ".";
import { EImportance, ETaskType, ETaskErrorResult } from "./event-list.service.i";
import { EventListService } from "./event-list.service";
import { LoggerService } from "../logger/logger.service";

describe("BridgeEventListService", () => {
  let service: BridgeEventListService;
  let eventListService: EventListService;

  class EventListServiceMock {
    public insertBridgeTask$ = jest.fn(() => of(null));
    public importanceMap = {
      task: {
        downloadPackage: {
          create: EImportance.Information,
          execute: EImportance.Information,
          success: EImportance.Information,
          fail: EImportance.Error,
        },
        install: {
          create: EImportance.Information,
          execute: EImportance.Information,
          success: EImportance.Information,
          fail: EImportance.Error,
        },
        logs: {
          create: EImportance.Information,
          execute: EImportance.Information,
          success: EImportance.Information,
          fail: EImportance.Error,
        },
        reboots: {
          create: EImportance.Information,
          execute: EImportance.Information,
          success: EImportance.Information,
          fail: EImportance.Error,
        },
        selftests: {
          create: EImportance.Information,
          execute: EImportance.Information,
          success: EImportance.Information,
          fail: EImportance.Error,
        },
      },
    };
    public subjectMap = {
      task: {
        downloadPackage: {
          create: "Create Task ( Download : ${packageName} )",
          execute: "Start Task ( Download : ${packageName} )",
          success: "Success Task ( Download : ${packageName} )",
          fail: "Fail Task ( Download : ${packageName} ) Error : ${errorResult}",
        },
        install: {
          create: "Create Task ( Download : ${packageName} )",
          execute: "Start Task ( Download : ${packageName} )",
          success: "Success Task ( Download : ${packageName} )",
          fail: "Fail Task ( Download : ${packageName} ) Error : ${errorResult}",
        },
        logs: {
          create: "Create Task ( Retrieve Log : ${logType} )",
          execute: "Start Task ( Retrieve Log : ${logType} )",
          success: "Success Task ( Retrieve Log : ${logType} )",
          fail: "Fail Task ( Retrieve Log : ${logType} ) Error : ${errorResult}",
        },
        reboots: {
          create: "Create Task ( Reboot )",
          execute: "Start Task ( Reboot )",
          success: "Success Task ( Reboot )",
          fail: "Fail Task ( Reboot ) Error : ${errorResult}",
        },
        selftests: {
          create: "Create Task ( Self Test )",
          execute: "Start Task ( Self Test )",
          success: "Success Task ( Self Test )",
          fail: "Fail Task ( Self Test ) Error : ${errorResult}",
        },
      },
    };
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  EventListServiceMock;
  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BridgeEventListService,
        { provide: EventListService, useClass: EventListServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    }).compile();

    service = module.get(BridgeEventListService);
    eventListService = module.get(EventListService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(eventListService).toBeDefined();
  });

  describe("downloadPakcage.insertCreate$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          packageName: "papa",
        },
      };

      const expected = {
        taskType: ETaskType.DownloadPackage,
        importance: eventListService.importanceMap.task.downloadPackage.create,
        subject: eventListService.subjectMap.task.downloadPackage.create,
        params: input.params,
      };
      // act
      return service.downloadPackageTask
        .insertCreate$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("downloadPackage.insertExecute$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          packageName: "papa",
        },
      };

      const expected = {
        taskType: ETaskType.DownloadPackage,
        importance: eventListService.importanceMap.task.downloadPackage.execute,
        subject: eventListService.subjectMap.task.downloadPackage.execute,
        params: input.params,
      };
      // act
      return service.downloadPackageTask
        .insertExecute$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("downloadPackage.insertSuccess$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          packageName: "papa",
        },
      };

      const expected = {
        taskType: ETaskType.DownloadPackage,
        importance: eventListService.importanceMap.task.downloadPackage.success,
        subject: eventListService.subjectMap.task.downloadPackage.success,
        params: input.params,
      };
      // act
      return service.downloadPackageTask
        .insertSuccess$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("downloadPackage.insertFail$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          packageName: "papa",
          errorResult: ETaskErrorResult.ConnectionError,
        },
      };

      const expected = {
        taskType: ETaskType.DownloadPackage,
        importance: eventListService.importanceMap.task.downloadPackage.fail,
        subject: eventListService.subjectMap.task.downloadPackage.fail,
        params: input.params,
      };
      // act
      return service.downloadPackageTask
        .insertFail$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("install.insertCreate$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          packageName: "papa",
        },
      };

      const expected = {
        taskType: ETaskType.Install,
        importance: eventListService.importanceMap.task.install.create,
        subject: eventListService.subjectMap.task.install.create,
        params: input.params,
      };
      // act
      return service.installTask
        .insertCreate$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("install.insertExecute$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          packageName: "papa",
        },
      };

      const expected = {
        taskType: ETaskType.Install,
        importance: eventListService.importanceMap.task.install.execute,
        subject: eventListService.subjectMap.task.install.execute,
        params: input.params,
      };
      // act
      return service.installTask
        .insertExecute$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("install.insertSuccess$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          packageName: "papa",
        },
      };

      const expected = {
        taskType: ETaskType.Install,
        importance: eventListService.importanceMap.task.install.success,
        subject: eventListService.subjectMap.task.install.success,
        params: input.params,
      };
      // act
      return service.installTask
        .insertSuccess$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("install.insertFail$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          packageName: "papa",
          errorResult: ETaskErrorResult.ConnectionError,
        },
      };

      const expected = {
        taskType: ETaskType.Install,
        importance: eventListService.importanceMap.task.install.fail,
        subject: eventListService.subjectMap.task.install.fail,
        params: input.params,
      };
      // act
      return service.installTask
        .insertFail$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("retrieveLogTask.insertCreate$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          logType: "lolo",
        },
      };

      const expected = {
        taskType: ETaskType.RetrieveLog,
        importance: eventListService.importanceMap.task.logs.create,
        subject: eventListService.subjectMap.task.logs.create,
        params: input.params,
      };
      // act
      return service.retrieveLogTask
        .insertCreate$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("retrieveLogTask.insertExecute$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          logType: "lolo",
        },
      };

      const expected = {
        taskType: ETaskType.RetrieveLog,
        importance: eventListService.importanceMap.task.logs.execute,
        subject: eventListService.subjectMap.task.logs.execute,
        params: input.params,
      };
      // act
      return service.retrieveLogTask
        .insertExecute$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("retrieveLogTask.insertSuccess$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          logType: "lolo",
        },
      };

      const expected = {
        taskType: ETaskType.RetrieveLog,
        importance: eventListService.importanceMap.task.logs.success,
        subject: eventListService.subjectMap.task.logs.success,
        params: input.params,
      };
      // act
      return service.retrieveLogTask
        .insertSuccess$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("retrieveLogTask.insertFail$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          logType: "lolo",
          errorResult: ETaskErrorResult.ConnectionError,
        },
      };

      const expected = {
        taskType: ETaskType.RetrieveLog,
        importance: eventListService.importanceMap.task.logs.fail,
        subject: eventListService.subjectMap.task.logs.fail,
        params: input.params,
      };
      // act
      return service.retrieveLogTask
        .insertFail$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("rebootTask.insertCreate$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          memo: "meme",
        },
      };

      const expected = {
        taskType: ETaskType.Reboot,
        importance: eventListService.importanceMap.task.reboots.create,
        subject: eventListService.subjectMap.task.reboots.create,
        params: input.params,
      };
      // act
      return service.rebootTask
        .insertCreate$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("rebootTask.insertExecute$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          memo: "meme",
        },
      };

      const expected = {
        taskType: ETaskType.Reboot,
        importance: eventListService.importanceMap.task.reboots.execute,
        subject: eventListService.subjectMap.task.reboots.execute,
        params: input.params,
      };
      // act
      return service.rebootTask
        .insertExecute$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("rebootTask.insertSuccess$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          memo: "meme",
        },
      };

      const expected = {
        taskType: ETaskType.Reboot,
        importance: eventListService.importanceMap.task.reboots.success,
        subject: eventListService.subjectMap.task.reboots.success,
        params: input.params,
      };
      // act
      return service.rebootTask
        .insertSuccess$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("rebootTask.insertFail$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          memo: "meme",
          errorResult: ETaskErrorResult.ConnectionError,
        },
      };

      const expected = {
        taskType: ETaskType.Reboot,
        importance: eventListService.importanceMap.task.reboots.fail,
        subject: eventListService.subjectMap.task.reboots.fail,
        params: input.params,
      };
      // act
      return service.rebootTask
        .insertFail$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("selfTestTask.insertCreate$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          memo: "meme",
        },
      };

      const expected = {
        taskType: ETaskType.SelfTest,
        importance: eventListService.importanceMap.task.selftests.create,
        subject: eventListService.subjectMap.task.selftests.create,
        params: input.params,
      };
      // act
      return service.selfTestTask
        .insertCreate$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("selfTestTask.insertExecute$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          memo: "meme",
        },
      };

      const expected = {
        taskType: ETaskType.SelfTest,
        importance: eventListService.importanceMap.task.selftests.execute,
        subject: eventListService.subjectMap.task.selftests.execute,
        params: input.params,
      };
      // act
      return service.selfTestTask
        .insertExecute$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("selfTestTask.insertSuccess$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          memo: "meme",
        },
      };

      const expected = {
        taskType: ETaskType.SelfTest,
        importance: eventListService.importanceMap.task.selftests.success,
        subject: eventListService.subjectMap.task.selftests.success,
        params: input.params,
      };
      // act
      return service.selfTestTask
        .insertSuccess$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });

  describe("selfTestTask.insertFail$", () => {
    it("should call insertBridgeTask$ with parameter", () => {
      // arrange
      const input = {
        params: {
          typeId: "tyty",
          assetId: "asas",
          taskId: "tata",
          memo: "meme",
          errorResult: ETaskErrorResult.ConnectionError,
        },
      };

      const expected = {
        taskType: ETaskType.SelfTest,
        importance: eventListService.importanceMap.task.selftests.fail,
        subject: eventListService.subjectMap.task.selftests.fail,
        params: input.params,
      };
      // act
      return service.selfTestTask
        .insertFail$(input.params)
        .toPromise()
        .then(() => {
          // assert
          expect(eventListService.insertBridgeTask$).toHaveBeenCalledWith(
            expected.importance,
            expected.subject,
            expected.params,
            expected.taskType,
          );
        })
        .catch((e) => fail(e));
    });
  });
});
