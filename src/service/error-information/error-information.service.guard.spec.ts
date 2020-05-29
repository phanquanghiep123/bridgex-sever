import { TestingModule, Test } from "@nestjs/testing";

import { GuardErrorInformationMap } from "./error-information.service.guard";

describe("GuardErrorInformationMap", () => {
  let guard: GuardErrorInformationMap;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardErrorInformationMap],
    }).compile();

    guard = module.get(GuardErrorInformationMap);
  });

  describe("isReadErrorMap", () => {
    const er = { code: "coco", message: "meme" };

    describe("should return true", () => {
      [
        { title: "errors is 0 items", input: { typeId: "tyty", errors: [] } },
        { title: "errors is 1 items", input: { typeId: "tyty", errors: [er] } },
        { title: "errors is 2 items", input: { typeId: "tyty", errors: [er, er] } },
        { title: "errors is 3 items", input: { typeId: "tyty", errors: [er, er, er] } },
        { title: "errors.message is empty", input: { typeId: "tyty", errors: [{ code: "coco", message: "" }] } },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isReadErrorMap(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is undefined", input: undefined },
        { title: "data is null", input: null },
        { title: "data is not object(boolean)", input: true },
        { title: "data is not object(number)", input: 123 },
        { title: "data is not object(string)", input: "data" },
        { title: "data is not object(array)", input: [{}, {}] },
        { title: "data have a additional property", input: { typeId: "tyty", errors: [{ code: "coco", message: "" }], hoge: 123 } },

        { title: "type is nothing", input: { errors: [{ code: "coco", message: "" }] } },
        { title: "type is undefined", input: { typeId: undefined, errors: [{ code: "coco", message: "" }] } },
        { title: "type is null", input: { typeId: null, errors: [{ code: "coco", message: "" }] } },
        { title: "type is empty", input: { typeId: "", errors: [{ code: "coco", message: "" }] } },
        { title: "type is not string(boolean)", input: { typeId: true, errors: [{ code: "coco", message: "" }] } },
        { title: "type is not string(number)", input: { typeId: 123, errors: [{ code: "coco", message: "" }] } },
        { title: "type is not string(object)", input: { typeId: {}, errors: [{ code: "coco", message: "" }] } },
        { title: "type is not string(array)", input: { typeId: [], errors: [{ code: "coco", message: "" }] } },

        { title: "errors is nothing", input: { typeId: "tyty" } },
        { title: "errors is undefined", input: { typeId: "tyty", errors: undefined } },
        { title: "errors is null", input: { typeId: "tyty", errors: null } },
        { title: "errors is not array(boolean)", input: { typeId: "tyty", errors: true } },
        { title: "errors is not array(number)", input: { typeId: "tyty", errors: 123 } },
        { title: "errors is not array(string)", input: { typeId: "tyty", errors: "" } },
        { title: "errors is not array(object)", input: { typeId: "tyty", errors: {} } },
        { title: "errors have a additional property", input: { typeId: "tyty", errors: [{ code: "coco", message: "", hoge: 123 }] } },

        { title: "errors.code is nothing", input: { typeId: "tyty", errors: [{ message: "" }] } },
        { title: "errors.code is undefined", input: { typeId: "tyty", errors: [{ code: undefined, message: "" }] } },
        { title: "errors.code is null", input: { typeId: "tyty", errors: [{ code: null, message: "" }] } },
        { title: "errors.code is empty", input: { typeId: "tyty", errors: [{ code: "", message: "" }] } },
        { title: "errors.code is not array(boolean)", input: { typeId: "tyty", errors: [{ code: true, message: "" }] } },
        { title: "errors.code is not array(number)", input: { typeId: "tyty", errors: [{ code: 123, message: "" }] } },
        { title: "errors.code is not array(object)", input: { typeId: "tyty", errors: [{ code: {}, message: "" }] } },
        { title: "errors.code is not array(array)", input: { typeId: "tyty", errors: [{ code: [], message: "" }] } },

        { title: "errors.message is nothing", input: { typeId: "tyty", errors: [{ code: "coco" }] } },
        { title: "errors.message is undefined", input: { typeId: "tyty", errors: [{ code: "coco", message: undefined }] } },
        { title: "errors.message is null", input: { typeId: "tyty", errors: [{ code: "coco", message: null }] } },
        { title: "errors.message is not array(boolean)", input: { typeId: "tyty", errors: [{ code: "coco", message: true }] } },
        { title: "errors.message is not array(number)", input: { typeId: "tyty", errors: [{ code: "coco", message: 123 }] } },
        { title: "errors.message is not array(object)", input: { typeId: "tyty", errors: [{ code: "coco", message: {} }] } },
        { title: "errors.message is not array(array)", input: { typeId: "tyty", errors: [{ code: "coco", message: [] }] } },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isReadErrorMap(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
