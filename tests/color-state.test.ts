import { expect, test } from "bun:test";
import { Color, ColorPreference, getColorPreference, getOppositeColor } from "../index";

test("when_nothing_happened", () => {
  const result = getColorPreference([]);

  expect(result.colorPreference).toBe(null)
  expect(result.colorPreferenceLevel).toBe(ColorPreference.LOW)
});

test("after_round_one", () => {
  const color = Math.random() < 0.5 ? Color.BLACK : Color.WHITE;
  const result = getColorPreference([color]);

  expect(result.colorPreference).toBe(getOppositeColor(color as Color))
  expect(result.colorPreferenceLevel).toBe(ColorPreference.HIGH)
});

test("when_balanced", () => {
  const result = getColorPreference([Color.BLACK, Color.WHITE]);

  expect(result.colorPreference).toBe(Color.BLACK)
  expect(result.colorPreferenceLevel).toBe(ColorPreference.LOW)
});

test("when_high", () => {
  const result = getColorPreference([Color.BLACK, Color.WHITE, Color.BLACK]);

  expect(result.colorPreference).toBe(Color.WHITE)
  expect(result.colorPreferenceLevel).toBe(ColorPreference.HIGH)
});

test("when_two_in_a_row", () => {
  const result = getColorPreference([Color.WHITE, Color.BLACK, Color.BLACK]);

  expect(result.colorPreference).toBe(Color.WHITE)
  expect(result.colorPreferenceLevel).toBe(ColorPreference.ABSOLUTE)
});

test("it_should_ignore_byes", () => {
  let result = getColorPreference([Color.WHITE, Color.BYE, Color.WHITE]);

  expect(result.colorPreference).toBe(Color.BLACK)
  expect(result.colorPreferenceLevel).toBe(ColorPreference.ABSOLUTE)

  result = getColorPreference([Color.WHITE, Color.BYE, Color.BLACK]);

  expect(result.colorPreference).toBe(Color.WHITE)
  expect(result.colorPreferenceLevel).toBe(ColorPreference.LOW)
});
