import { expect, test } from "bun:test";
import {
  Color,
  eliminateByesFromHistory,
  evaluateColorHistory,
  type ColorHistoryContract,
} from "../index";

const asHistory = (...colors: Color[]): ColorHistoryContract[] =>
  colors.map((color) => ({ color }));

test("compare_simple_history", () => {
  const oneHistory = asHistory(
    Color.BLACK,
    Color.WHITE,
    Color.WHITE,
    Color.BLACK,
    Color.BLACK,
  );
  const twoHistory = asHistory(
    Color.BLACK,
    Color.BLACK,
    Color.WHITE,
    Color.BLACK,
    Color.BLACK,
  );

  const result = evaluateColorHistory(oneHistory, twoHistory);

  expect(result?.one).toEqual(Color.WHITE);
  expect(result?.two).toEqual(Color.BLACK);
  expect(result?.roundAgo).toEqual(3);
});

test("compare_same_history", () => {
  const oneHistory = asHistory(
    Color.BLACK,
    Color.WHITE,
    Color.WHITE,
    Color.BLACK,
    Color.BLACK,
  );
  const twoHistory = asHistory(
    Color.BLACK,
    Color.WHITE,
    Color.WHITE,
    Color.BLACK,
    Color.BLACK,
  );

  const result = evaluateColorHistory(oneHistory, twoHistory);

  expect(result).toBeNull();
});

test("compare_history_with_byes", () => {
  // Player one's most recent round was a bye. FIDE does not say how to align
  // histories across unplayed rounds (art. 5.2.3 says "the most recent time",
  // not round). This library strips byes per player and compares by games
  // played; the assertion below pins that interpretation, not a handbook rule.
  // See docs/fide-colour-rules.md, CA-5.
  const oneHistory = asHistory(Color.BLACK, Color.WHITE, Color.BYE);
  const twoHistory = asHistory(Color.BLACK, Color.WHITE, Color.WHITE);

  const result = evaluateColorHistory(oneHistory, twoHistory);

  expect(result?.one).toEqual(Color.BLACK);
  expect(result?.two).toEqual(Color.WHITE);
  expect(result?.roundAgo).toEqual(1);
});

test("compare_no_history", () => {
  const result = evaluateColorHistory([], []);

  expect(result).toBeNull();
});

test("compare_histories_of_unequal_length", () => {
  // Only the overlap is compared; the longer player's extra games are ignored.
  // Also this library's choice, not a stated rule. See CA-5.
  const oneHistory = asHistory(Color.WHITE);
  const twoHistory = asHistory(Color.BLACK, Color.BLACK, Color.WHITE);

  expect(evaluateColorHistory(oneHistory, twoHistory)).toBeNull();
});

test("compare_should_not_mutate_the_histories_it_is_given", () => {
  const oneHistory = asHistory(Color.BLACK, Color.WHITE, Color.WHITE);
  const twoHistory = asHistory(Color.WHITE, Color.BLACK, Color.BLACK);

  evaluateColorHistory(oneHistory, twoHistory);

  expect(oneHistory).toEqual(
    asHistory(Color.BLACK, Color.WHITE, Color.WHITE),
  );
  expect(twoHistory).toEqual(
    asHistory(Color.WHITE, Color.BLACK, Color.BLACK),
  );
});

test("eliminate_byes_from_history", () => {
  const one = eliminateByesFromHistory([
    Color.BLACK,
    Color.WHITE,
    Color.WHITE,
    Color.BYE,
    Color.BLACK,
    Color.BLACK,
  ]);
  const two = eliminateByesFromHistory([
    Color.BLACK,
    Color.WHITE,
    Color.WHITE,
    Color.BLACK,
    Color.BLACK,
    Color.BYE,
  ]);

  const expected = [
    Color.BLACK,
    Color.WHITE,
    Color.WHITE,
    Color.BLACK,
    Color.BLACK,
  ];
  expect(one).toEqual(expected);
  expect(two).toEqual(expected);
});
