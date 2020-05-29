import { TestingModule, Test } from "@nestjs/testing";
import { cases } from "rxjs-marbles/jest";

import { PackageValidationServiceGuard } from "./package-validation.service.guard";

class TestData {
  public static getPackageMetadataYaml() {
    return {
      name: "example-firmware v2.2.2",
      files: ["example-xxx.zip"],
      summary: "example-12/24 Emergency patch for RBW-1000",
      description: "example-to fix some problem ...",
      model: "RBW-100",
      elements: {
        bridgeFirmware: "PRS_03.0",
        lowerUnit: "P001M (0)",
        upperUnit: "B002G (0)",
      },
      createdBy: "example-user",
    };
  }
}

describe("PackageValidationServiceGuard", () => {
  let guard: PackageValidationServiceGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PackageValidationServiceGuard],
    }).compile();

    guard = module.get(PackageValidationServiceGuard);
  });

  cases(
    "isPackageMetadataYaml",
    (_, { params, expected }) => {
      // arrange

      // act
      const actual = guard.isPackageMetadataYaml(params);

      // assert
      expect(actual).toEqual(expected);
    },
    {
      "true if expected data": { expected: true, params: { ...TestData.getPackageMetadataYaml() } },

      "false if name is not string": { expected: false, params: { ...TestData.getPackageMetadataYaml(), name: 1 } },

      "false if name is undefined": { expected: false, params: { ...TestData.getPackageMetadataYaml(), name: undefined } },

      "false if files contains undefined": {
        expected: false,
        params: { ...TestData.getPackageMetadataYaml(), files: ["string data", undefined] },
      },

      "false if files contains number": { expected: false, params: { ...TestData.getPackageMetadataYaml(), files: ["string data", 123] } },

      "false if files is undefined": { expected: false, params: { ...TestData.getPackageMetadataYaml(), files: undefined } },

      "false if summary is not string": { expected: false, params: { ...TestData.getPackageMetadataYaml(), summary: 1 } },

      "false if summary is undefined": { expected: false, params: { ...TestData.getPackageMetadataYaml(), summary: undefined } },

      "false if description is not string": { expected: false, params: { ...TestData.getPackageMetadataYaml(), description: 1 } },

      "false if description is undefined": { expected: false, params: { ...TestData.getPackageMetadataYaml(), description: undefined } },

      "false if model is not string": { expected: false, params: { ...TestData.getPackageMetadataYaml(), model: 1 } },

      "false if model is undefined": { expected: false, params: { ...TestData.getPackageMetadataYaml(), model: undefined } },

      "false if createdBy is not string": { expected: false, params: { ...TestData.getPackageMetadataYaml(), createdBy: 1 } },

      "false if createdBy is undefined": { expected: false, params: { ...TestData.getPackageMetadataYaml(), createdBy: undefined } },

      "false if elements contains number": {
        expected: false,
        params: { ...TestData.getPackageMetadataYaml(), elements: { lowerUnit: "P001M (0)", foobarUnit: 1 } },
      },

      "false if elements contains undefined": {
        expected: false,
        params: { ...TestData.getPackageMetadataYaml(), elements: { lowerUnit: "P001M (0)", foobarUnit: undefined } },
      },

      "false if elements is undefined": { expected: false, params: { ...TestData.getPackageMetadataYaml(), elements: undefined } },
    },
  );
});
