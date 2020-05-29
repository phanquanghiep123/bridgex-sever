class MessageHandler {
  constructor(public id: number) {}
}

class ServerMqtt {
  public messageHandlers: Map<string, MessageHandler> = new Map<string, MessageHandler>();
  public getHandlers() {
    return this.messageHandlers;
  }
}

jest.mock("@nestjs/microservices/interfaces", () => ({ MessageHandler })).mock("@nestjs/microservices/server", () => ({ ServerMqtt }));

// ------------------------------------------------

import { cases } from "rxjs-marbles/jest";
import { CustomServerMqtt } from "./custom-server-mqtt";

describe(CustomServerMqtt.name, () => {
  cases(
    CustomServerMqtt.prototype.matchMqttPattern.name,
    (c, params) => {
      // arrange
      const server = new CustomServerMqtt(null);

      // act
      const actual = server.matchMqttPattern(params.pattern, params.topic__);

      // assert
      expect(actual).toBe(params.expected);
    },
    {
      "true if pattern equals topic": {
        pattern: "/this/is/match/pattern",
        topic__: "/this/is/match/pattern",
        expected: true,
      },
      "true if topic matches to pattern with #": {
        pattern: "/this/is/#",
        topic__: "/this/is/match/pattern",
        expected: true,
      },
      "true if topic matches to pattern with +": {
        pattern: "/this/+/+/pattern",
        topic__: "/this/is/match/pattern",
        expected: true,
      },
      "true if pattern is #": {
        // arrange
        pattern: "#",
        topic__: "/this/is/match/pattern",
        expected: true,
      },
      "false if pattern does not equal topic": {
        // arrange
        pattern: "/this/was/match/pattern",
        topic__: "/this/is/match/pattern",
        expected: false,
      },
      "false if pattern sections are more than topic": {
        // arrange
        pattern: "/this/is/match/pattern",
        topic__: "/this/is/match",
        expected: false,
      },
      "false if pattern sections are less than topic": {
        // arrange
        pattern: "/this/is/match",
        topic__: "/this/is/match/pattern",
        expected: false,
      },
    },
  );

  describe(CustomServerMqtt.prototype.getHandlerByPattern.name, () => {
    cases(
      "should return true if pattern matches to the key",
      (c, params) => {
        // arrange
        const server = new CustomServerMqtt(null);
        const handlers: Map<string, MessageHandler> = server.getHandlers() as any;
        params.entries.forEach((entry) => handlers.set(entry.pattern, entry.handler));

        // act
        const actual: MessageHandler = server.getHandlerByPattern(params.key) as any;

        // assert
        expect(actual && actual.id).toBe(params.expected);
      },
      {
        "match handler 1 if key equals pattern": {
          entries: [
            { pattern: "/this/is/not/match/pattern", handler: new MessageHandler(0) },
            { pattern: "/this/is/match/pattern", handler: new MessageHandler(1) },
            { pattern: "/this/was/+/match/pattern", handler: new MessageHandler(2) },
            { pattern: "/that/is/#", handler: new MessageHandler(3) },
          ],
          key: "/this/is/match/pattern",
          expected: 1,
        },
        "match handler 2 if key matches pattern with +": {
          entries: [
            { pattern: "/this/is/not/match/pattern", handler: new MessageHandler(0) },
            { pattern: "/this/is/match/pattern", handler: new MessageHandler(1) },
            { pattern: "/this/was/+/match/pattern", handler: new MessageHandler(2) },
            { pattern: "/that/is/#", handler: new MessageHandler(3) },
          ],
          key: "/this/was/a/match/pattern",
          expected: 2,
        },
        "match handler 3 if key matches pattern with #": {
          entries: [
            { pattern: "/this/is/not/match/pattern", handler: new MessageHandler(0) },
            { pattern: "/this/is/match/pattern", handler: new MessageHandler(1) },
            { pattern: "/this/was/+/match/pattern", handler: new MessageHandler(2) },
            { pattern: "/that/is/#", handler: new MessageHandler(3) },
          ],
          key: "/that/is/a/match/pattern/with/long/long/topic",
          expected: 3,
        },
        "return null if key does not match any patterns": {
          entries: [
            { pattern: "/this/is/not/match/pattern", handler: new MessageHandler(0) },
            { pattern: "/this/is/match/pattern", handler: new MessageHandler(1) },
            { pattern: "/this/was/+/match/pattern", handler: new MessageHandler(2) },
            { pattern: "/that/is/#", handler: new MessageHandler(3) },
          ],
          key: "/that/was/not/match/pattern",
          expected: null,
        },
      },
    );
  });
});
