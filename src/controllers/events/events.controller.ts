import { Controller, UseGuards, Get, Query, Res, Param } from "@nestjs/common";
import { Response } from "express";

import { GuardEvents } from "./events.controller.guard";
import { LoggerService } from "../../service/logger";
import { BearerTokenGuard } from "../../guards/bearer-token/bearer-token.guard";
import { BridgeXServerError } from "../../service/utils";

import { EventListService, EEventSourceFilter, EventList } from "../../service/event-list";
import { EEventSource, GetEventsQuery } from "./events.controller.i";

@Controller("/types/:typeId/assets/:assetId/events")
@UseGuards(BearerTokenGuard)
export class EventsController {
  constructor(private eventListService: EventListService, private guard: GuardEvents, private logger: LoggerService) {}

  @Get()
  public getEvents(
    @Param("typeId") typeId: string,
    @Param("assetId") assetId: string,
    @Query() query: GetEventsQuery,
    @Res() res: Response,
  ) {
    const params = {
      typeId,
      assetId,
    };

    if (!this.guard.isGetEventsParams(params)) {
      return res
        .status(404)
        .json(`Cannot GET /types/${typeId}/assets/${assetId}/events`)
        .end();
    }

    if (!this.guard.isGetEventsQuery(query)) {
      return res
        .status(400)
        .json("Invalid Request Query")
        .end();
    }

    this.eventListService
      .getEventList$({
        typeId: params.typeId,
        assetId: params.assetId,
        filter: {
          text: this.getFreeSearchKeywords(query.text),
          eventSource: this.getEventSourceFilter(query.eventSource),
        },
        limit: query.limit ? query.limit : 20,
        offset: query.offset ? query.offset : 0,
      })
      .subscribe(
        (evnetList: EventList) => {
          res
            .status(200)
            .set({
              "Access-Control-Expose-Headers": "X-Total-Count",
              "X-Total-Count": `${evnetList.totalCount}`,
            })
            .json(evnetList.items);
        },
        (err: BridgeXServerError) => {
          this.logger.info(err.message);
          res.status(err.code).json({ code: err.code, message: err.message });
        },
      )
      .add(() => res.end());
  }

  public getFreeSearchKeywords(text: string | undefined): string {
    if (!text) {
      return "%";
    }

    const arrKeyWords = text
      .replace(/　/g, " ")
      .replace(/ +/g, " ")
      .split(" ");
    arrKeyWords.forEach((value, index, array) => (array[index] = `%${value}%`));
    return arrKeyWords.join(" ");
  }

  public getEventSourceFilter(src: EEventSource | undefined): EEventSourceFilter {
    if (!src) {
      return EEventSourceFilter.All;
    }

    switch (src) {
      case EEventSource.Asset:
        return EEventSourceFilter.Asset;
      case EEventSource.Bridge:
        return EEventSourceFilter.Bridge;
      default:
        return EEventSourceFilter.All;
    }
  }
}
