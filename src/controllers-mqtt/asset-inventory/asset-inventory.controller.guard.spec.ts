import { TestingModule, Test } from "@nestjs/testing";

import { GuardAssetInventory } from "./asset-inventory.controller.guard";

describe(GuardAssetInventory.name, () => {
  let guard: GuardAssetInventory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardAssetInventory],
    }).compile();

    guard = module.get(GuardAssetInventory);
  });

  describe(GuardAssetInventory.prototype.isAssetInventoryEvent, () => {
    [
      // cashUnits
      {
        title: "should return true when cashUnits is an array",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "0.25", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return false when cashUnits is not an array",
        input: {
          cashUnits: {
            unit: "casset A",
            status: "Full",
            nearFull: 550,
            nearEmpty: 10,
            capacity: 600,
            denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
          },
        },
        expected: false,
      },
      { title: "should return false when cashUnits is not as an input", input: { units: "aaa" }, expected: false },
      // unit
      {
        title: "should return false when unit has no value",
        input: {
          cashUnits: [
            {
              unit: "",
              status: "Full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when unit is not exists",
        input: {
          cashUnits: [
            {
              status: "Full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when unit has number value",
        input: {
          cashUnits: [
            {
              unit: 111111,
              status: "Full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      // status
      {
        title: "should return false when status has no value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when status is not exists",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when status has number value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: 1111,
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      // nearFull
      {
        title: "should return true when nearFull is not exists",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return true when nearFull has numeric value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return false when nearFull has null value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: null,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when nearFull has string value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: "550",
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      // nearEmpty
      {
        title: "should return true when nearEmpty is not exists",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return true when nearEmpty has numeric value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 10,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return false when nearEmpty has null value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: null,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when nearEmpty has string value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: "10",
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      // capacity
      {
        title: "should return false when capacity has null value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: null,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when capacity is not exists",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 10,
              nearEmpty: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when capacity has string value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: "600",
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      // denominations
      {
        title: "should return false when denominations has null value",
        input: { cashUnits: [{ unit: "casset A", status: "Full", nearFull: 100, nearEmpty: 10, capacity: 100, denominations: null }] },
        expected: false,
      },
      {
        title: "should return false when denominations has string value",
        input: { cashUnits: [{ unit: "casset A", status: "Full", nearFull: 100, nearEmpty: 10, capacity: 100, denominations: "fooo" }] },
        expected: false,
      },
      {
        title: "should return false when denominations is not an array",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: { currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 },
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when denominations is not exists",
        input: { cashUnits: [{ unit: "casset A", status: "Full", nearFull: 10, nearEmpty: 600, capacity: 100 }] },
        expected: false,
      },
      {
        title: "should return false when denominations has no currencyCode",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when denominations has no faceValue",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when denominations has non-numeric faceValue",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20K", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return true when denominations has numeric faceValue",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20.50", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return false when denominations has no count",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return true when denominations has no revision",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0 }],
            },
          ],
        },
        expected: true,
      },
      // currencyCode
      {
        title: "should return false when currencyCode is not exists",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: [{ faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when currencyCode has null value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: [{ currencyCode: null, faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when currencyCode has no value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 10,
              nearEmpty: 600,
              capacity: 100,
              denominations: [{ currencyCode: "", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when currencyCode has number value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: 0, faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      // faceValue
      {
        title: "should return false when faceValue is not exists",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: [{ currencyCode: "EUR", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when faceValue has null value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: [{ currencyCode: "EUR", faceValue: null, count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when faceValue has no value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 10,
              nearEmpty: 600,
              capacity: 100,
              denominations: [{ currencyCode: "EUR", faceValue: "", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when faceValue has number value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: 20, count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when faceValue has no numeric or float value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20YEN", count: 0, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return true when faceValue has float value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "0.25", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return true when faceValue has number value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "25", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      // count
      {
        title: "should return true when count has numeric value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return false when count is not exists",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: [{ currencyCode: "EUR", faceValue: "20", revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when count has null value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: null, revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when count has no value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 10,
              nearEmpty: 600,
              capacity: 100,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: "", revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when count has string value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: "0", revision: 0 }],
            },
          ],
        },
        expected: false,
      },
      // revision
      {
        title: "should return true when revision is not exists",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return true when revision has numeric value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: 0 }],
            },
          ],
        },
        expected: true,
      },
      {
        title: "should return false when revision has null value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "Full",
              nearFull: 100,
              nearEmpty: 10,
              capacity: 100,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: null }],
            },
          ],
        },
        expected: false,
      },
      {
        title: "should return false when revision has string value",
        input: {
          cashUnits: [
            {
              unit: "casset A",
              status: "full",
              nearFull: 550,
              nearEmpty: 10,
              capacity: 600,
              denominations: [{ currencyCode: "EUR", faceValue: "20", count: 0, revision: "0" }],
            },
          ],
        },
        expected: false,
      },
    ].forEach((tc) => {
      it(tc.title, () => {
        // arrange

        // act
        const actual = guard.isAssetInventoryEvent(tc.input);

        // assert
        expect(actual).toEqual(tc.expected);
      });
    });
  });
});
