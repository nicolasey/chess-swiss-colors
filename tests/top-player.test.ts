import { expect, test } from "bun:test";
import { Color, ColorPreference, isTopPlayer, type PlayerColorState } from "../index";
import { differenceFor } from "./fixtures";

const createPlayerSample = (
  score: number,
  rounds = 2,
): PlayerColorState => ({
  playerId: 1,
  pairingNb: 1,
  score,
  colorPreference: Color.WHITE,
  colorPreferenceLevel: ColorPreference.HIGH,
  colorDifference: differenceFor(Color.WHITE, ColorPreference.HIGH),
  history: Array.from({ length: rounds }, (_, index) => ({
    color: index % 2 === 0 ? Color.WHITE : Color.BLACK,
  })),
});

/**
 * TS-2 has no test: art. 1.8 only means anything when pairing the final round,
 * and this predicate is deliberately ungated — the caller owns that gate.
 */
test("TS-1: checks_if_top_player", () => {
  expect(isTopPlayer(createPlayerSample(2))).toBeTrue();
  expect(isTopPlayer(createPlayerSample(1))).toBeFalse();
});

test("TS-1: exactly_half_is_not_a_top_player", () => {
  // "More than half of possible points" is strict.
  expect(isTopPlayer(createPlayerSample(1.5, 3))).toBeFalse();
  expect(isTopPlayer(createPlayerSample(2, 3))).toBeTrue();
});

test("TS-1: no_rounds_played_is_not_a_top_player", () => {
  expect(isTopPlayer(createPlayerSample(0, 0))).toBeFalse();
});
