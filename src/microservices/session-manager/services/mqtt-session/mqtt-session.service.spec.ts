import { Test, TestingModule } from "@nestjs/testing";

import { marbles } from "rxjs-marbles/jest";

import * as o from "rxjs";

import { MqttSessionServiceModule } from "./mqtt-session.service.module";

import { MqttSessionService } from "./mqtt-session.service";

// -------------------------------------------------

describe("MqttSessionService", () => {
  let service: MqttSessionService;
  const regexpUuuid = "[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MqttSessionServiceModule],
    }).compile();

    service = module.get<MqttSessionService>(MqttSessionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    MqttSessionService.sessions = {};
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(MqttSessionService.prototype.createSession$.name, () => {
    it(
      "should create expected session",
      marbles((ctx) => {
        // arrange
        const params = {
          typeId: "someTypeId",
          assetId: "someAssetId",
        };

        const expected = {
          typeId: "someTypeId",
          assetId: "someAssetId",
          sessionId: expect.stringMatching(new RegExp(`^${regexpUuuid}$`)),
          topicPrefix: expect.stringMatching(new RegExp(`^${MqttSessionService.topicBase}/${regexpUuuid}$`)),
        };

        // act
        const actual$ = service.createSession$(params);

        // assert
        ctx.expect(actual$).toBeObservable("(a|)", { a: expected });
      }),
    );

    it("should generate different uuid for each request", () => {
      // arrange
      const params = {
        typeId: "someTypeId",
        assetId: "someAssetId",
      };

      // act
      return (
        o
          .zip(service.createSession$(params), service.createSession$(params))
          .toPromise()
          // assert
          .then(([res1, res2]) => {
            expect(res1.assetId).toEqual(res2.assetId);
            expect(res1.typeId).toEqual(res2.typeId);
            expect(res1.sessionId).not.toEqual(res2.sessionId);
            expect(res1.topicPrefix).not.toEqual(res2.topicPrefix);
          })
          .catch(fail)
      );
    });
  });

  describe(MqttSessionService.prototype.closeSession$.name, () => {
    it(
      "should return deleted session",
      marbles((ctx) => {
        // arrange
        const params = {
          sessionId: "session id desu",
        };

        const notExpected = {
          typeId: "someTypeId",
          assetId: "someAssetId",
          sessionId: "kore ja naiyo",
          topicPrefix: "toriaezu/nandemo/iiyo",
        };

        const expected = {
          typeId: "someTypeId",
          assetId: "someAssetId",
          sessionId: params.sessionId,
          topicPrefix: "toriaezu/nandemo/iiyo",
        };

        MqttSessionService.sessions[expected.sessionId] = { ...expected };
        MqttSessionService.sessions[notExpected.sessionId] = { ...notExpected };

        // act
        const actual$ = service.closeSession$(params);

        // assert
        ctx.expect(actual$).toBeObservable("(a|)", { a: expected });
      }),
    );

    it("should delete expected session", () => {
      // arrange
      const params = {
        sessionId: "session id desu",
      };

      const notExpected = {
        typeId: "someTypeId",
        assetId: "someAssetId",
        sessionId: "notExpected",
        topicPrefix: "toriaezu/nandemo/iiyo",
      };

      const expected = {
        typeId: "someTypeId",
        assetId: "someAssetId",
        sessionId: params.sessionId,
        topicPrefix: "toriaezu/nandemo/iiyo",
      };

      MqttSessionService.sessions[expected.sessionId] = { ...expected };
      MqttSessionService.sessions[notExpected.sessionId] = { ...notExpected };
      const expectedSessions = { notExpected };

      // act
      return (
        service
          .closeSession$(params)
          .toPromise()
          // assert
          .then(() => expect(MqttSessionService.sessions).toEqual(expectedSessions))
          .catch(fail)
      );
    });
  });
});
