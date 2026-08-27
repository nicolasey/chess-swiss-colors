import { expect, test } from "bun:test";
import {
  isColorCompatible,
  Color,
  ColorPreference,
  type PlayerColorState,
} from "../index";

const player = (
  playerId: number,
  colorPreference: Color,
  colorPreferenceLevel: ColorPreference,
): PlayerColorState => ({
  playerId,
  pairingNb: playerId,
  score: 3,
  colorPreference,
  colorPreferenceLevel,
  history: [],
});

test("when_compatible", () => {
  // Opposite preferences are always compatible, however strong they are.
  const playerOne = player(1, Color.WHITE, ColorPreference.ABSOLUTE);
  const playerTwo = player(2, Color.BLACK, ColorPreference.ABSOLUTE);

  expect(isColorCompatible(playerOne, playerTwo)).toBeTrue();
  expect(isColorCompatible(playerTwo, playerOne)).toBeTrue();
});

test("same_color_only_one_absolute", () => {
  for (const color of [Color.WHITE, Color.BLACK]) {
    const playerOne = player(1, color, ColorPreference.ABSOLUTE);
    const playerTwo = player(2, color, ColorPreference.HIGH);

    expect(isColorCompatible(playerOne, playerTwo)).toBeTrue();
    expect(isColorCompatible(playerTwo, playerOne)).toBeTrue();
  }
});

test("when_incompatible", () => {
  for (const color of [Color.WHITE, Color.BLACK]) {
    const playerOne = player(1, color, ColorPreference.ABSOLUTE);
    const playerTwo = player(2, color, ColorPreference.ABSOLUTE);

    expect(isColorCompatible(playerOne, playerTwo)).toBeFalse();
    expect(isColorCompatible(playerTwo, playerOne)).toBeFalse();
  }
});
