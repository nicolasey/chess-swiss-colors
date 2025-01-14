import { expect, test } from "bun:test";
import { Color, evaluateColorHistory, type ColorHistoryContract } from "../index";

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
