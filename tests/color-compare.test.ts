import { expect, test } from "bun:test";
import { Color, eliminateByesFromHistory, evaluateColorHistory, type ColorHistoryContract } from "../index";

test("compare_simple_history", () => {
  const oneHistory: ColorHistoryContract[] = [
    { color: Color.BLACK },
    { color: Color.WHITE },
    { color: Color.WHITE },
    { color: Color.BLACK },
    { color: Color.BLACK },
  ]

  const twoHistory: ColorHistoryContract[] = [
    { color: Color.BLACK },
    { color: Color.BLACK },
    { color: Color.WHITE },
    { color: Color.BLACK },
    { color: Color.BLACK },
  ]

  const result = evaluateColorHistory(oneHistory, twoHistory);

  console.log("Result = ", result);
  expect(result?.one).toEqual(Color.WHITE);
  expect(result?.two).toEqual(Color.BLACK);
  expect(result?.roundAgo).toEqual(3);
  expect(result?.roundNb).toEqual(2);
});

test("compare_same_history", () => {
  const oneHistory: ColorHistoryContract[] = [
    { color: Color.BLACK },
    { color: Color.WHITE },
    { color: Color.WHITE },
    { color: Color.BLACK },
    { color: Color.BLACK },
  ];

  const twoHistory: ColorHistoryContract[] = [
    { color: Color.BLACK },
    { color: Color.WHITE },
    { color: Color.WHITE },
    { color: Color.BLACK },
    { color: Color.BLACK },
  ];

  const result = evaluateColorHistory(oneHistory, twoHistory);
  expect(result).toBeNull();
});

test("compare_history_with_byes", () => {})

test("compare_no_history", () => {
  const oneHistory: ColorHistoryContract[] = [];
  const twoHistory: ColorHistoryContract[] = [];

  const result = evaluateColorHistory(oneHistory, twoHistory);
  expect(result).toBeNull();
});

test("eliminate_byes_from_history", () => {
  const oneHistory: ColorHistoryContract[] = [
    { color: Color.BLACK },
    { color: Color.WHITE },
    { color: Color.WHITE },
    { color: Color.BYE },
    { color: Color.BLACK },
    { color: Color.BLACK },
  ];

  const twoHistory: ColorHistoryContract[] = [
    { color: Color.BLACK },
    { color: Color.WHITE },
    { color: Color.WHITE },
    { color: Color.BLACK },
    { color: Color.BLACK },
    { color: Color.BYE },
  ];

  let oneColors: Color[] = [];
  oneHistory.forEach(h =>  oneColors.push(h.color));
  let twoColors: Color[] = [];
  twoHistory.forEach(h =>  twoColors.push(h.color));

  const one = eliminateByesFromHistory(oneColors);
  const two = eliminateByesFromHistory(twoColors);

  expect(one).toEqual([Color.BLACK, Color.WHITE, Color.WHITE, Color.BLACK, Color.BLACK]);
  expect(two).toEqual([Color.BLACK, Color.WHITE, Color.WHITE, Color.BLACK, Color.BLACK]);
});
