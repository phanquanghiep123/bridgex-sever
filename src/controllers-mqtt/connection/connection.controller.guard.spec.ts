import { GuardConnectionEvent } from "./connection.controller.guard";
import { EConnection } from "./connection.controller.i";

describe("GuardConnectedEvent", () => {
  const target: GuardConnectionEvent = new GuardConnectionEvent();

  describe("isConnectedEvent", () => {
    [
      // ipAddress
      {
        title: "should return true when ipAddress is string",
        input: { ipAddress: "192.168.0.1", connection: EConnection.Connected },
        expected: true,
      },
      { title: "should return false when ipAddress doesn't exist", input: { connection: EConnection.Connected }, expected: true },
      {
        title: "should return false when ipAddress is not string",
        input: { ipAddress: 1, connection: EConnection.Connected },
        expected: false,
      },

      // connection
      { title: 'should return true when connection is "Connected"', input: { connection: EConnection.Connected }, expected: true },
      { title: 'should return true when connection is "Disconnected"', input: { connection: EConnection.Disconnected }, expected: true },
      { title: "should return false when connection is not in enumeration", input: { connection: "invalid" }, expected: false },
      { title: "should return false when connection is not string", input: { connection: 1 }, expected: false },
      { title: "should return false when connection doesn't exist", input: {}, expected: false },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = target.isConnectionEvent(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
