import { expect, test } from "bun:test";
import {
  isColorCompatible,
  Color,
  ColorPreference,
  type PlayerColorState,
} from "../index";

test("when_compatible", () => {});

test("same_color_only_one_absolute", () => {
  const color = Math.random() < 0.5 ? Color.BLACK : Color.WHITE;
  const playerOne: PlayerColorState = {
    playerId: 1,
    pairingNb: 1,
    score: 3,
    colorPreference: color,
    colorPreferenceLevel: ColorPreference.ABSOLUTE,
    history: [],
  };
  const playerTwo: PlayerColorState = {
    playerId: 2,
    pairingNb: 2,
    score: 3,
    colorPreference: color,
    colorPreferenceLevel: ColorPreference.HIGH,
    history: [],
  };

  const result = isColorCompatible(playerOne, playerTwo);

  expect(result).toBeTrue();
});

test("when_incompatible", () => {
  const color = Math.random() < 0.5 ? Color.BLACK : Color.WHITE;
  const playerOne: PlayerColorState = {
    playerId: 1,
    pairingNb: 1,
    score: 3,
    colorPreference: color,
    colorPreferenceLevel: ColorPreference.ABSOLUTE,
    history: [],
  };
  const playerTwo: PlayerColorState = {
    playerId: 2,
    pairingNb: 2,
    score: 3,
    colorPreference: color,
    colorPreferenceLevel: ColorPreference.ABSOLUTE,
    history: [],
  };

  const result = isColorCompatible(playerOne, playerTwo);

  expect(result).toBeFalse();
});
