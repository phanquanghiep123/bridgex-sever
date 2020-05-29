import { TestingModule, Test } from "@nestjs/testing";

import { GuardMqttMessage } from "./mqtt-message.guard";
import { EMessageType, EMessageName } from "./mqtt-message.i";

describe(GuardMqttMessage, () => {
  let guard: GuardMqttMessage;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardMqttMessage],
    }).compile();

    guard = module.get(GuardMqttMessage);
  });

  describe(GuardMqttMessage.prototype.isMqttMessagePayload.name, () => {
    [
      // type
      {
        title: 'should return true when type is "Event"',
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: 'should return true when type is "Command"',
        input: {
          type: EMessageType.Command,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: 'should return true when type is "Response"',
        input: {
          type: EMessageType.Response,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: "should return false when type is not in enumeration",
        input: {
          type: "invalid",
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when type is not string",
        input: {
          type: 1,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when type doesn't exist",
        input: {
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },

      // name
      {
        title: 'should return true when name is "Connection"',
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: 'should return true when name is "AssetStatusUpdated"',
        input: {
          type: EMessageType.Event,
          name: EMessageName.AssetStatusUpdated,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: 'should return true when name is "Established"',
        input: {
          type: EMessageType.Event,
          name: EMessageName.Established,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: "should return false when name is not in enumeration",
        input: {
          type: EMessageType.Event,
          name: "invalid",
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when name is not string",
        input: {
          type: EMessageType.Event,
          name: 1,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when name doesn't exist",
        input: {
          type: EMessageType.Event,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },

      // version
      {
        title: "should return true when version is integer",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: "should return false when version is not integer",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: "1",
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when version doesn't exist",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },

      // sender
      {
        title: "should return true when sender is string",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: "should return true when sender doesn't exist",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: "should return false when sender is not string",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: 1,
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },

      // assetMetaData
      {
        title: "should return true when assetMetaData has typeId and assetId in format of string",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: "should return false when assetMetaData doesn't exist",
        input: { type: EMessageType.Event, name: EMessageName.Connection, version: 1, sender: "ISP-K05", detail: {} },
        expected: false,
      },
      {
        title: "should return false when assetMetaData is not object",
        input: { type: EMessageType.Event, name: EMessageName.Connection, version: 1, sender: "ISP-K05", assetMetaData: [], detail: {} },
        expected: false,
      },
      {
        title: "should return false when assetMetaData doesn't have anything",
        input: { type: EMessageType.Event, name: EMessageName.Connection, version: 1, sender: "ISP-K05", assetMetaData: {}, detail: {} },
        expected: false,
      },
      {
        title: "should return false when assetMetaData doesn't have typeId",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { assetId: "000001" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when typeId is not string in assetMetaData",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: "ISP-K05",
          sender: "sender",
          assetMetaData: { typeId: 1, assetId: "000001" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when typeId is empty string in assetMetaData",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "", assetId: "000001" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when assetid is not string in assetMetaData",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: 1 },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when assetid is empty string in assetMetaData",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "" },
          detail: {},
        },
        expected: false,
      },
      {
        title: "should return false when assetMetaData doesn't have assetId",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10" },
          detail: {},
        },
        expected: false,
      },

      // detail
      {
        title: "should return true when detail is object",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: {},
        },
        expected: true,
      },
      {
        title: "should return false when detail is not object",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
          detail: [],
        },
        expected: false,
      },
      {
        title: "should return true when detail doesn't exist",
        input: {
          type: EMessageType.Event,
          name: EMessageName.Connection,
          version: 1,
          sender: "ISP-K05",
          assetMetaData: { typeId: "CI-10", assetId: "000001" },
        },
        expected: true,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isMqttMessagePayload(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });

  describe(GuardMqttMessage.prototype.isMqttResponsePayload.name, () => {
    describe("should return true", () => {
      [
        {
          title: "when data is correct",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        // assetMetaData
        // result
        {
          title: "when result is Succeed",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is Accepted",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Accepted", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is Error",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Error", errorCode: "coco", errorMsg: "msms" },
        },
        // errorCode
        {
          title: "when errorCode is empty",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "", errorMsg: "msms" },
        },
        {
          title: "when errorCode is nothing",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorMsg: "msms" },
        },
        {
          title: "when errorCode is undefined",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: undefined, errorMsg: "msms" },
        },
        // errorMsg
        {
          title: "when errorMsg is empty",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "" },
        },
        {
          title: "when errorMsg is nothing",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco" },
        },
        {
          title: "when errorMsg is undefined",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: undefined },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange
          // act
          const actual = guard.isMqttResponsePayload(tc.input);
          // assert
          expect(actual).toEqual(true);
        });
      });
    });
    describe("should return false", () => {
      [
        { title: "when data undefined", input: undefined },
        { title: "when data null", input: null },
        { title: "when data boolean", input: true },
        { title: "when data number", input: 123 },
        { title: "when data string", input: "abc" },
        { title: "when data array", input: [{}] },
        // assetMetaData
        { title: "when assetMetaData is nothing", input: { result: "Succeed", errorCode: "coco", errorMsg: "msms" } },
        {
          title: "when assetMetaData is undefined",
          input: { assetMetaData: undefined, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        { title: "when assetMetaData is null", input: { assetMetaData: null, result: "Succeed", errorCode: "coco", errorMsg: "msms" } },
        { title: "when assetMetaData is boolean", input: { assetMetaData: true, result: "Succeed", errorCode: "coco", errorMsg: "msms" } },
        { title: "when assetMetaData is number", input: { assetMetaData: 123, result: "Succeed", errorCode: "coco", errorMsg: "msms" } },
        { title: "when assetMetaData is string", input: { assetMetaData: "asas", result: "Succeed", errorCode: "coco", errorMsg: "msms" } },
        { title: "when assetMetaData is array", input: { assetMetaData: [], result: "Succeed", errorCode: "coco", errorMsg: "msms" } },
        // assetMetaData.sessionId
        {
          title: "when assetMetaData.sessionId is empty",
          input: { assetMetaData: { sessionId: "", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.sessionId is nothing",
          input: { assetMetaData: { messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.sessionId is undefined",
          input: { assetMetaData: { sessionId: undefined, messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.sessionId is null",
          input: { assetMetaData: { sessionId: null, messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.sessionId is boolean",
          input: { assetMetaData: { sessionId: true, messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.sessionId is number",
          input: { assetMetaData: { sessionId: 123, messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.sessionId is object",
          input: { assetMetaData: { sessionId: {}, messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.messageId is array",
          input: { assetMetaData: { sessionId: [], messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        // assetMetaData.messageId
        {
          title: "when assetMetaData.messageId is empty",
          input: { assetMetaData: { sessionId: "sese", messageId: "" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.messageId is nothing",
          input: { assetMetaData: { sessionId: "sese" }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.messageId is undefined",
          input: { assetMetaData: { sessionId: "sese", messageId: undefined }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.sessionId is null",
          input: { assetMetaData: { sessionId: "sese", messageId: null }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.messageId is boolean",
          input: { assetMetaData: { sessionId: "sese", messageId: true }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.messageId is number",
          input: { assetMetaData: { sessionId: "sese", messageId: 123 }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.sessionId is object",
          input: { assetMetaData: { sessionId: "sese", messageId: {} }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when assetMetaData.messageId is array",
          input: { assetMetaData: { sessionId: "sese", messageId: [] }, result: "Succeed", errorCode: "coco", errorMsg: "msms" },
        },
        // result
        {
          title: "when result is empty",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is not enum value",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "hoge", errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is nothing",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is undefined",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: undefined, errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is null",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: null, errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is boolean",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: true, errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is number",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: 123, errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is object",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: {}, errorCode: "coco", errorMsg: "msms" },
        },
        {
          title: "when result is array",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: [], errorCode: "coco", errorMsg: "msms" },
        },
        // errorCode
        {
          title: "when errorCode is null",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: null, errorMsg: "msms" },
        },
        {
          title: "when errorCode is boolean",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: true, errorMsg: "msms" },
        },
        {
          title: "when errorCode is number",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: 123, errorMsg: "msms" },
        },
        {
          title: "when errorCode is object",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: {}, errorMsg: "msms" },
        },
        {
          title: "when errorCode is array",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: [], errorMsg: "msms" },
        },
        // errorMsg
        {
          title: "when errorMsg is null",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: null },
        },
        {
          title: "when errorMsg is boolean",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: true },
        },
        {
          title: "when errorMsg is number",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: 123 },
        },
        {
          title: "when errorMsg is object",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: {} },
        },
        {
          title: "when errorMsg is array",
          input: { assetMetaData: { sessionId: "sese", messageId: "meme" }, result: "Succeed", errorCode: "coco", errorMsg: [] },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange
          // act
          const actual = guard.isMqttResponsePayload(tc.input);
          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
