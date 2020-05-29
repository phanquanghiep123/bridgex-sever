import { TestingModule, Test } from "@nestjs/testing";

import { GuardZipLogService } from "./zip-log.service.guard";

describe("GuardZipLogService", () => {
  let guard: GuardZipLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardZipLogService],
    }).compile();

    guard = module.get(GuardZipLogService);
  });

  describe("isZipLogParams", () => {
    const data = {
      dstDir: "dstDir",
      dstFileName: "dstFileName",
      asset: {
        typeId: "tyty",
        assetId: "asas",
      },
      retrieveLogInfo: [
        {
          typeId: "tyty-01",
          assetId: "asas-01",
          status: "Succeed",
          filePath: "filePath-01",
        },
        {
          typeId: "tyty-02",
          assetId: "asas-02",
          status: "Error",
          filePath: "filePath-02",
        },
      ],
    };

    describe("should return true", () => {
      [{ title: "data is correct", input: data }].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isZipLogParams(tc.input);

          // assert
          expect(actual).toEqual(true);
        });
      });
    });

    describe("should return false", () => {
      [
        { title: "data is undefined", input: undefined },
        { title: "data is null", input: null },
        { title: "data is not object", input: 123 },

        { title: "dstDir is empty", input: { ...data, dstDir: "" } },
        { title: "dstDir is undefined", input: { ...data, dstDir: undefined } },
        { title: "dstDir is null", input: { ...data, dstDir: null } },
        { title: "dstDir is not string", input: { ...data, dstDir: 123 } },

        { title: "dstFileName is empty", input: { ...data, dstFileName: "" } },
        { title: "dstFileName is undefined", input: { ...data, dstFileName: undefined } },
        { title: "dstFileName is null", input: { ...data, dstFileName: null } },
        { title: "dstFileName is not string", input: { ...data, dstFileName: 123 } },

        { title: "asset is undefined", input: { ...data, asset: undefined } },
        { title: "asset is null", input: { ...data, asset: null } },
        { title: "asset is not object", input: { ...data, asset: 123 } },

        { title: "asset.typeId is empty", input: { ...data, asset: { ...data.asset, typeId: "" } } },
        { title: "asset.typeId is undefined", input: { ...data, asset: { ...data.asset, typeId: undefined } } },
        { title: "asset.typeId is null", input: { ...data, asset: { ...data.asset, typeId: null } } },
        { title: "asset.typeId is not string", input: { ...data, asset: { ...data.asset, typeId: 123 } } },

        { title: "asset.assetId is empty", input: { ...data, asset: { ...data.asset, assetId: "" } } },
        { title: "asset.assetId is undefined", input: { ...data, asset: { ...data.asset, assetId: undefined } } },
        { title: "asset.assetId is null", input: { ...data, asset: { ...data.asset, assetId: null } } },
        { title: "asset.assetId is not string", input: { ...data, asset: { ...data.asset, assetId: 123 } } },

        { title: "retrieveLogInfo is empty", input: { ...data, retrieveLogInfo: [] } },
        { title: "retrieveLogInfo is undefined", input: { ...data, retrieveLogInfo: undefined } },
        { title: "retrieveLogInfo is null", input: { ...data, retrieveLogInfo: null } },
        { title: "retrieveLogInfo is not array", input: { ...data, retrieveLogInfo: "[]" } },

        { title: "retrieveLogInfo.typeId is empty", input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], typeId: "" }] } },
        {
          title: "retrieveLogInfo.typeId is undefined",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], typeId: undefined }] },
        },
        { title: "retrieveLogInfo.typeId is null", input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], typeId: null }] } },
        {
          title: "retrieveLogInfo.typeId is not object",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], typeId: 123 }] },
        },

        { title: "retrieveLogInfo.assetId is empty", input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], assetId: "" }] } },
        {
          title: "retrieveLogInfo.assetId is undefined",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], assetId: undefined }] },
        },
        { title: "retrieveLogInfo.assetId is null", input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], assetId: null }] } },
        {
          title: "retrieveLogInfo.assetId is not object",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], assetId: 123 }] },
        },

        { title: "retrieveLogInfo.status is empty", input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], status: "" }] } },
        {
          title: "retrieveLogInfo.status is undefined",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], status: undefined }] },
        },
        { title: "retrieveLogInfo.status is null", input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], status: null }] } },
        {
          title: "retrieveLogInfo.status is not object",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], status: 123 }] },
        },

        { title: "retrieveLogInfo.filePath is empty", input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], filePath: "" }] } },
        {
          title: "retrieveLogInfo.filePath is undefined",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], filePath: undefined }] },
        },
        {
          title: "retrieveLogInfo.filePath is null",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], filePath: null }] },
        },
        {
          title: "retrieveLogInfo.filePath is not object",
          input: { ...data, retrieveLogInfo: [{ ...data.retrieveLogInfo[0], filePath: 123 }] },
        },
      ].forEach((tc) => {
        it(tc.title, () => {
          // arrange

          // act
          const actual = guard.isZipLogParams(tc.input);

          // assert
          expect(actual).toEqual(false);
        });
      });
    });
  });
});
