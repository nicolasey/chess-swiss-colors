import { expect, test } from "bun:test";
import { Color, evaluateColorHistory } from "../index";

test("compare_simple_history", () => {
  const oneHistory: Color[] = [Color.BLACK, Color.WHITE, Color.WHITE, Color.BLACK, Color.BLACK];
  const twoHistory: Color[] = [Color.BLACK, Color.BLACK, Color.WHITE, Color.BLACK, Color.BLACK];

  const result = evaluateColorHistory(oneHistory, twoHistory);

  expect(result?.one).toEqual(Color.WHITE);
  expect(result?.two).toEqual(Color.BLACK);
  expect(result?.roundAgo).toEqual(3);
  expect(result?.roundNb).toEqual(2);
});

test("compare_same_history", () => {
  const oneHistory: Color[] = [Color.BLACK, Color.WHITE, Color.WHITE, Color.BLACK, Color.BLACK];
  const twoHistory: Color[] = [Color.BLACK, Color.WHITE, Color.WHITE, Color.BLACK, Color.BLACK];

  const result = evaluateColorHistory(oneHistory, twoHistory);
  expect(result).toBeNull();
});

test("compare_history_with_byes", () => {})

test("compare_no_history", () => {
  const oneHistory: Color[] = [];
  const twoHistory: Color[] = [];

  const result = evaluateColorHistory(oneHistory, twoHistory);
  expect(result).toBeNull();
});
