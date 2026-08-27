import { expect, test } from "bun:test";
import { Color, ColorPreference, isTopPlayer, type PlayerColorState } from "../index";

const createPlayerSample = (
  score: number,
  rounds = 2,
): PlayerColorState => ({
  playerId: 1,
  pairingNb: 1,
  score,
  colorPreference: Color.WHITE,
  colorPreferenceLevel: ColorPreference.HIGH,
  history: Array.from({ length: rounds }, (_, index) => ({
    color: index % 2 === 0 ? Color.WHITE : Color.BLACK,
  })),
});

test("checks_if_top_player", () => {
  expect(isTopPlayer(createPlayerSample(2))).toBeTrue();
  expect(isTopPlayer(createPlayerSample(1))).toBeFalse();
});

test("exactly_half_is_not_a_top_player", () => {
  // "More than half of possible points" is strict.
  expect(isTopPlayer(createPlayerSample(1.5, 3))).toBeFalse();
  expect(isTopPlayer(createPlayerSample(2, 3))).toBeTrue();
});

test("no_rounds_played_is_not_a_top_player", () => {
  expect(isTopPlayer(createPlayerSample(0, 0))).toBeFalse();
});
