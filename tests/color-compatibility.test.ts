import { expect, test } from "bun:test";
import {
  isColorCompatible,
  Color,
  ColorPreference,
  type PlayerColorState,
} from "../index";
import { differenceFor } from "./fixtures";

const player = (
  playerId: number,
  colorPreference: Color,
  colorPreferenceLevel: ColorPreference,
  isFinalRoundTopscorer?: boolean,
): PlayerColorState => ({
  ...(isFinalRoundTopscorer === undefined ? {} : { isFinalRoundTopscorer }),
  playerId,
  pairingNb: playerId,
  score: 3,
  colorPreference,
  colorPreferenceLevel,
  colorDifference: differenceFor(colorPreference, colorPreferenceLevel),
  history: [],
});

test("PC-2: when_compatible", () => {
  // Opposite preferences are always compatible, however strong they are.
  const playerOne = player(1, Color.WHITE, ColorPreference.ABSOLUTE);
  const playerTwo = player(2, Color.BLACK, ColorPreference.ABSOLUTE);

  expect(isColorCompatible(playerOne, playerTwo)).toBeTrue();
  expect(isColorCompatible(playerTwo, playerOne)).toBeTrue();
});

test("PC-3: same_color_only_one_absolute", () => {
  for (const color of [Color.WHITE, Color.BLACK]) {
    const playerOne = player(1, color, ColorPreference.ABSOLUTE);
    const playerTwo = player(2, color, ColorPreference.HIGH);

    expect(isColorCompatible(playerOne, playerTwo)).toBeTrue();
    expect(isColorCompatible(playerTwo, playerOne)).toBeTrue();
  }
});

test("PC-1: when_incompatible", () => {
  for (const color of [Color.WHITE, Color.BLACK]) {
    const playerOne = player(1, color, ColorPreference.ABSOLUTE);
    const playerTwo = player(2, color, ColorPreference.ABSOLUTE);

    expect(isColorCompatible(playerOne, playerTwo)).toBeFalse();
    expect(isColorCompatible(playerTwo, playerOne)).toBeFalse();
  }
});

/**
 * PC-4 — FIDE C.04.3 art. 2.1.3 [C3]
 * The prohibition's subject is *non*-topscorers, so one topscorer in the pair
 * takes it outside the rule entirely. That is how a final round pairs its
 * leaders at all, and the pair it permits is the one art. 5.2.2's
 * wider-difference clause exists to resolve.
 */
test("PC-4: one_topscorer_lifts_the_prohibition", () => {
  for (const color of [Color.WHITE, Color.BLACK]) {
    const topscorer = player(1, color, ColorPreference.ABSOLUTE, true);
    const other = player(2, color, ColorPreference.ABSOLUTE);

    expect(isColorCompatible(topscorer, other)).toBeTrue();
    expect(isColorCompatible(other, topscorer)).toBeTrue();
  }
});

test("PC-4: two_topscorers_may_meet_as_well", () => {
  for (const color of [Color.WHITE, Color.BLACK]) {
    const one = player(1, color, ColorPreference.ABSOLUTE, true);
    const two = player(2, color, ColorPreference.ABSOLUTE, true);

    expect(isColorCompatible(one, two)).toBeTrue();
    expect(isColorCompatible(two, one)).toBeTrue();
  }
});

/**
 * The default has to keep the prohibition in force. A refused legal pairing is
 * recoverable — the engine builds another one; an illegal pairing produced in
 * silence is not.
 */
test("PC-4: the_flag_absent_behaves_exactly_as_false", () => {
  const absent = player(1, Color.WHITE, ColorPreference.ABSOLUTE);
  const explicit = player(2, Color.WHITE, ColorPreference.ABSOLUTE, false);

  expect(absent.isFinalRoundTopscorer).toBeUndefined();
  expect(isColorCompatible(absent, explicit)).toBeFalse();
  expect(isColorCompatible(explicit, absent)).toBeFalse();
});

/**
 * The exemption must not reach pairs that were never prohibited: it lifts [C3],
 * it does not blanket-approve.
 */
test("PC-4: the_flag_changes_nothing_for_a_pair_that_was_never_forbidden", () => {
  const topscorer = player(1, Color.WHITE, ColorPreference.ABSOLUTE, true);
  const opposite = player(2, Color.BLACK, ColorPreference.ABSOLUTE, true);
  const milder = player(3, Color.WHITE, ColorPreference.HIGH, true);

  expect(isColorCompatible(topscorer, opposite)).toBeTrue();
  expect(isColorCompatible(topscorer, milder)).toBeTrue();
});
