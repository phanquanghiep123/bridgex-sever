import { TestingModule, Test } from "@nestjs/testing";

import { GuardUserAuthService } from "./user-auth.service.guard";

describe("GuardUserAuthService", () => {
  let guard: GuardUserAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardUserAuthService],
    }).compile();

    guard = module.get(GuardUserAuthService);
  });

  describe("isGetUserInfoResponse", () => {
    describe("should return true", () => {
      [{ title: "data is correct", input: { userId: "usus", email: "emem", displayName: "didi" } }].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isGetUserInfoResponse(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is undefined", input: undefined },
        { title: "data is null", input: null },
        { title: "data is boolean", input: true },
        { title: "data is number", input: 1 },
        { title: "data is string", input: "" },
        { title: "data is array", input: [] },

        { title: "userId is nothing", input: { email: "emem", displyaName: "didi" }, expected: false },
        { title: "userId is undefined", input: { userId: undefined, email: "emem", displyaName: "didi" }, expected: false },
        { title: "userId is null", input: { userId: null, email: "emem", displyaName: "didi" }, expected: false },
        { title: "userId is boolean", input: { userId: true, email: "emem", displyaName: "didi" }, expected: false },
        { title: "userId is number", input: { userId: 1, email: "emem", displyaName: "didi" }, expected: false },
        { title: "userId is object", input: { userId: {}, email: "emem", displyaName: "didi" }, expected: false },
        { title: "userId is array", input: { userId: [], email: "emem", displyaName: "didi" }, expected: false },

        { title: "email is nothing", input: { userId: "usus", displyaName: "didi" }, expected: false },
        { title: "email is undefined", input: { userId: "usus", email: undefined, displyaName: "didi" }, expected: false },
        { title: "email is null", input: { userId: "usus", email: null, displyaName: "didi" }, expected: false },
        { title: "email is boolean", input: { userId: "usus", email: true, displyaName: "didi" }, expected: false },
        { title: "email is number", input: { userId: "usus", email: 1, displyaName: "didi" }, expected: false },
        { title: "email is object", input: { userId: "usus", email: {}, displyaName: "didi" }, expected: false },
        { title: "email is array", input: { userId: "usus", email: [], displyaName: "didi" }, expected: false },

        { title: "displyaName is nothing", input: { userId: "usus", email: "emem" }, expected: false },
        { title: "displyaName is undefined", input: { userId: "usus", email: "emem", displyaName: undefined }, expected: false },
        { title: "displyaName is null", input: { userId: "usus", email: "emem", displyaName: null }, expected: false },
        { title: "displyaName is boolean", input: { userId: "usus", email: "emem", displyaName: true }, expected: false },
        { title: "displyaName is number", input: { userId: "usus", email: "emem", displyaName: 1 }, expected: false },
        { title: "displyaName is object", input: { userId: "usus", email: "emem", displyaName: {} }, expected: false },
        { title: "displyaName is array", input: { userId: "usus", email: "emem", displyaName: [] }, expected: false },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isGetUserInfoResponse(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
