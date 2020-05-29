import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";
import { cases } from "rxjs-marbles/jest";

import { EventsController } from "./events.controller";
import {
  EventListService,
  EventList,
  EEventSource as EEventSourceOfService,
  EImportance,
  GetEventListParams,
  EEventSourceFilter,
} from "../../service/event-list";
import { GuardEvents } from "./events.controller.guard";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { GetEventsQuery, EEventSource } from "./events.controller.i";
import { BridgeXServerError } from "../../service/utils";

describe(EventsController.name, () => {
  let controller: EventsController;
  let eventListService: EventListService;
  let guardEvents: GuardEvents;
  let loggerService: LoggerService;

  class BearerTokenGuardMock {
    public canActivate = jest.fn().mockReturnValue(true);
  }

  class EventListServiceMock {
    public getEventList$ = jest.fn();
  }

  class GuardEventsMock {
    public isGetEventsParams = jest.fn(() => true);
    public isGetEventsQuery = jest.fn(() => true);
  }

  class LoggerServiceMock {
    public trace = jest.fn();
    public debug = jest.fn();
    public info = jest.fn();
    public warn = jest.fn();
    public error = jest.fn();
    public fatal = jest.fn();
  }

  class ResponseMock {
    public status = jest.fn().mockReturnThis();
    public set = jest.fn().mockReturnThis();
    public json = jest.fn().mockReturnThis();
    public end = jest.fn().mockReturnThis();
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventListService, useClass: EventListServiceMock },
        { provide: GuardEvents, useClass: GuardEventsMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
      ],
    })
      .overrideGuard(BearerTokenGuard)
      .useClass(BearerTokenGuardMock)
      .compile();

    controller = module.get(EventsController);
    eventListService = module.get(EventListService);
    guardEvents = module.get(GuardEvents);
    loggerService = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(eventListService).toBeDefined();
    expect(guardEvents).toBeDefined();
    expect(loggerService).toBeDefined();
  });

  describe(EventsController.prototype.getEvents.name, () => {
    cases(
      "normal pattern",
      (_, c) => {
        // arrange
        const eventList: EventList = {
          totalCount: 3,
          items: [
            {
              date: new Date("2010/04/14 12:34:56:123"),
              eventSource: EEventSourceOfService.Asset,
              subject: "su-01",
              importance: EImportance.Information,
            },
            {
              date: new Date("2010/04/14 12:34:56:456"),
              eventSource: EEventSourceOfService.Bridge,
              subject: "su-02",
              importance: EImportance.Information,
            },
            {
              date: new Date("2010/04/14 12:34:56:789"),
              eventSource: EEventSourceOfService.Asset,
              subject: "su-03",
              importance: EImportance.Error,
            },
          ],
        };
        jest.spyOn(guardEvents, "isGetEventsParams").mockReturnValue(true);
        jest.spyOn(guardEvents, "isGetEventsQuery").mockReturnValue(true);
        jest.spyOn(controller, "getFreeSearchKeywords").mockReturnValue("search kyeword");
        jest.spyOn(controller, "getEventSourceFilter").mockReturnValue(EEventSourceFilter.Asset);
        jest.spyOn(eventListService, "getEventList$").mockReturnValue(of(eventList));
        // act
        const res: any = new ResponseMock();
        const query = { limit: 123, offset: 456, text: "tete", eventSource: "Asset" } as GetEventsQuery;
        controller.getEvents("tyty", "asas", query, res);
        return c.assert(res);
      },
      {
        "should call getFreeSearchKeywords": {
          assert: () => {
            const expected = "tete";
            expect(controller.getFreeSearchKeywords).toHaveBeenCalledWith(expected);
          },
        },
        "should call getEventSourceFilter": {
          assert: () => {
            const expected = EEventSource.Asset;
            return expect(controller.getEventSourceFilter).toHaveBeenCalledWith(expected);
          },
        },
        "should call getAssetAvailabilitiy": {
          assert: () => {
            const expected: GetEventListParams = {
              typeId: "tyty",
              assetId: "asas",
              filter: {
                text: "search kyeword",
                eventSource: EEventSourceFilter.Asset,
              },
              limit: 123,
              offset: 456,
            };
            return expect(eventListService.getEventList$).toHaveBeenCalledWith(expected);
          },
        },
        "should return response data": {
          assert: (res: any) => {
            const expected = {
              header: {
                "Access-Control-Expose-Headers": "X-Total-Count",
                "X-Total-Count": "3",
              },
              data: [
                {
                  date: new Date("2010/04/14 12:34:56:123"),
                  eventSource: EEventSourceOfService.Asset,
                  subject: "su-01",
                  importance: EImportance.Information,
                },
                {
                  date: new Date("2010/04/14 12:34:56:456"),
                  eventSource: EEventSourceOfService.Bridge,
                  subject: "su-02",
                  importance: EImportance.Information,
                },
                {
                  date: new Date("2010/04/14 12:34:56:789"),
                  eventSource: EEventSourceOfService.Asset,
                  subject: "su-03",
                  importance: EImportance.Error,
                },
              ],
            };
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.set).toHaveBeenCalledWith(expected.header);
            expect(res.json).toHaveBeenCalledWith(expected.data);
            expect(res.end).toHaveBeenCalled();
          },
        },
      },
    );

    cases(
      "when pathParams error",
      (_, c) => {
        // arrange
        jest.spyOn(guardEvents, "isGetEventsParams").mockReturnValue(false);
        // act
        const res: any = new ResponseMock();
        const query = {} as GetEventsQuery;
        controller.getEvents("tyty", "asas", query, res);
        return c.assert(res);
      },
      {
        "should return 404": {
          assert: (res: any) => {
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(`Cannot GET /types/tyty/assets/asas/events`);
            expect(res.end).toHaveBeenCalled();
          },
        },
      },
    );

    cases(
      "when query error",
      (_, c) => {
        // arrange
        jest.spyOn(guardEvents, "isGetEventsParams").mockReturnValue(true);
        jest.spyOn(guardEvents, "isGetEventsQuery").mockReturnValue(false);
        // act
        const res: any = new ResponseMock();
        const query = {} as GetEventsQuery;
        controller.getEvents("tyty", "asas", query, res);
        return c.assert(res);
      },
      {
        "should return 400": {
          assert: (res: any) => {
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith("Invalid Request Query");
            expect(res.end).toHaveBeenCalled();
          },
        },
      },
    );

    cases(
      "when happening error",
      (_, c) => {
        // arrange
        jest.spyOn(guardEvents, "isGetEventsParams").mockReturnValue(true);
        jest.spyOn(guardEvents, "isGetEventsQuery").mockReturnValue(true);
        jest.spyOn(controller, "getFreeSearchKeywords").mockReturnValue("search kyeword");
        jest.spyOn(controller, "getEventSourceFilter").mockReturnValue(EEventSourceFilter.Asset);
        const error = new BridgeXServerError(123, "test error");
        jest.spyOn(eventListService, "getEventList$").mockReturnValue(throwError(error));
        // act
        const res: any = new ResponseMock();
        const query = {} as GetEventsQuery;
        controller.getEvents("tyty", "asas", query, res);
        return c.assert(res);
      },
      {
        "should return 404": {
          assert: (res: any) => {
            expect(res.status).toHaveBeenCalledWith(123);
            expect(res.json).toHaveBeenCalledWith({ code: 123, message: "test error" });
            expect(res.end).toHaveBeenCalled();
          },
        },
      },
    );
  });

  describe("getFreeSearchKeywords", () => {
    it("Wildcard (%) should be given to free words", () => {
      // arrange
      const input = "typeId customerId";
      const expected = "%typeId% %customerId%";

      // act
      const output = controller.getFreeSearchKeywords(input);

      // assert
      expect(output).toEqual(expected);
    });

    it("double-byte spaces should be converted to single-byte spaces", () => {
      // arrange
      const input = "typeId　customerId";
      const expected = "%typeId% %customerId%";

      // act
      const output = controller.getFreeSearchKeywords(input);

      // assert
      expect(output).toEqual(expected);
    });

    it("duplicate spaces should be converted to one", () => {
      // arrange
      const input = "typeId   　    　   customerId";
      const expected = "%typeId% %customerId%";

      // act
      const output = controller.getFreeSearchKeywords(input);

      // assert
      expect(output).toEqual(expected);
    });

    it("should return % when undefined", () => {
      // arrange
      const input = undefined;
      const expected = "%";

      // act
      const output = controller.getFreeSearchKeywords(input);

      // assert
      expect(output).toEqual(expected);
    });
  });

  describe("getEventSourceFilter", () => {
    it("should return All when undefined", () => {
      // arrange
      // act
      const output = controller.getEventSourceFilter(undefined);
      // assert
      expect(output).toEqual(EEventSourceFilter.All);
    });

    it("should return Asset when Asset", () => {
      // arrange
      // act
      const output = controller.getEventSourceFilter(EEventSource.Asset);
      // assert
      expect(output).toEqual(EEventSourceFilter.Asset);
    });

    it("should return Bridge when Bridge", () => {
      // arrange
      // act
      const output = controller.getEventSourceFilter(EEventSource.Bridge);
      // assert
      expect(output).toEqual(EEventSourceFilter.Bridge);
    });

    it("should return All when illegal value", () => {
      // arrange
      // act
      const output = controller.getEventSourceFilter("hoge" as EEventSource);
      // assert
      expect(output).toEqual(EEventSourceFilter.All);
    });
  });
});
