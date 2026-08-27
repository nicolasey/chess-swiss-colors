import { expect, test } from "bun:test";
import {
  Color,
  ColorPreference,
  getColorPreference,
  getLastPlayedColor,
  getLastTwoColors,
  getOppositeColor,
} from "../index";

test("when_nothing_happened", () => {
  const result = getColorPreference([]);

  expect(result.colorPreference).toBe(Color.BYE);
  expect(result.colorPreferenceLevel).toBe(ColorPreference.LOW);
});

test("after_round_one", () => {
  for (const color of [Color.WHITE, Color.BLACK]) {
    const result = getColorPreference([color]);

    expect(result.colorPreference).toBe(getOppositeColor(color));
    expect(result.colorPreferenceLevel).toBe(ColorPreference.HIGH);
  }
});

test("when_balanced", () => {
  const result = getColorPreference([Color.BLACK, Color.WHITE]);

  expect(result.colorPreference).toBe(Color.BLACK);
  expect(result.colorPreferenceLevel).toBe(ColorPreference.LOW);
});

test("when_high", () => {
  const result = getColorPreference([Color.BLACK, Color.WHITE, Color.BLACK]);

  expect(result.colorPreference).toBe(Color.WHITE);
  expect(result.colorPreferenceLevel).toBe(ColorPreference.HIGH);
});

test("when_two_in_a_row", () => {
  const result = getColorPreference([Color.WHITE, Color.BLACK, Color.BLACK]);

  expect(result.colorPreference).toBe(Color.WHITE);
  expect(result.colorPreferenceLevel).toBe(ColorPreference.ABSOLUTE);
});

test("it_should_ignore_byes", () => {
  let result = getColorPreference([Color.WHITE, Color.BYE, Color.WHITE]);

  expect(result.colorPreference).toBe(Color.BLACK);
  expect(result.colorPreferenceLevel).toBe(ColorPreference.ABSOLUTE);

  result = getColorPreference([Color.WHITE, Color.BYE, Color.BLACK]);

  expect(result.colorPreference).toBe(Color.WHITE);
  expect(result.colorPreferenceLevel).toBe(ColorPreference.LOW);
});

test("it_should_not_mutate_the_history_it_is_given", () => {
  const history = [Color.WHITE, Color.BLACK, Color.BLACK];

  getColorPreference(history);

  expect(history).toEqual([Color.WHITE, Color.BLACK, Color.BLACK]);
});

test("it_should_return_the_same_answer_when_called_twice", () => {
  const history = [Color.WHITE, Color.BLACK, Color.BLACK];

  expect(getColorPreference(history)).toEqual(getColorPreference(history));
});

test("it_should_never_return_a_level_outside_the_enum", () => {
  // 5 whites vs 1 black, and the two most recent games differ so the
  // three-in-a-row override does not fire. Raw diff is 4.
  const lopsided = [
    Color.WHITE,
    Color.WHITE,
    Color.WHITE,
    Color.WHITE,
    Color.WHITE,
    Color.BLACK,
    Color.WHITE,
  ];

  const result = getColorPreference(lopsided);

  expect(result.colorPreference).toBe(Color.BLACK);
  expect(result.colorPreferenceLevel).toBe(ColorPreference.ABSOLUTE);
});

test("get_last_played_color", () => {
  expect(getLastPlayedColor([])).toBe(Color.BYE);
  expect(getLastPlayedColor([Color.BYE, Color.BYE])).toBe(Color.BYE);
  expect(getLastPlayedColor([Color.WHITE, Color.BLACK])).toBe(Color.BLACK);
  expect(getLastPlayedColor([Color.WHITE, Color.BLACK, Color.BYE])).toBe(
    Color.BLACK,
  );
});

test("get_last_played_color_should_not_mutate", () => {
  const history = [Color.WHITE, Color.BLACK, Color.BYE];

  getLastPlayedColor(history);

  expect(history).toEqual([Color.WHITE, Color.BLACK, Color.BYE]);
});

test("get_last_two_colors_reads_the_two_most_recent_games", () => {
  // Oldest first in, most recent first out.
  expect(getLastTwoColors([Color.WHITE, Color.BLACK, Color.BLACK])).toEqual([
    Color.BLACK,
    Color.BLACK,
  ]);
  expect(getLastTwoColors([Color.BLACK, Color.BLACK, Color.WHITE])).toEqual([
    Color.WHITE,
    Color.BLACK,
  ]);
});

test("get_last_two_colors_skips_byes", () => {
  expect(
    getLastTwoColors([Color.WHITE, Color.BLACK, Color.BYE, Color.BYE]),
  ).toEqual([Color.BLACK, Color.WHITE]);
});

test("get_last_two_colors_returns_null_below_two_games", () => {
  expect(getLastTwoColors([Color.WHITE])).toBeNull();
  expect(getLastTwoColors([Color.WHITE, Color.BYE])).toBeNull();
});

test("get_last_two_colors_should_not_mutate", () => {
  const history = [Color.WHITE, Color.BLACK, Color.BYE];

  getLastTwoColors(history);

  expect(history).toEqual([Color.WHITE, Color.BLACK, Color.BYE]);
});
