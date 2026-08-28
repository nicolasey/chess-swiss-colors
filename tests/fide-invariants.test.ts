import { expect, test } from "bun:test";
import {
  Color,
  assignColors,
  getColorPreference,
  isColorCompatible,
  type PlayerColorState,
} from "../index";

/**
 * Outcome invariants from FIDE C.04.1 (effective 1 February 2026), checked
 * exhaustively rather than by example. See docs/fide-colour-rules.md.
 *
 * These are properties of the assignment, not of any one function: they are
 * what the preference rules exist to guarantee, so a break here means some
 * upstream rule is mislabelling a player.
 */

const W = Color.WHITE;
const B = Color.BLACK;

const colorDifference = (history: Color[]): number =>
  history.reduce((d, c) => d + (c === W ? 1 : c === B ? -1 : 0), 0);

/** C.04.1 rule 7 — the same colour three rounds running, byes disregarded. */
const hasThreeInARow = (history: Color[]): boolean => {
  const played = history.filter((c) => c !== Color.BYE);
  return played.some(
    (c, i) => i >= 2 && c === played[i - 1] && c === played[i - 2],
  );
};

/** A history a legal tournament could actually have produced. */
const isLegalHistory = (history: Color[]): boolean => {
  for (let i = 1; i <= history.length; i++) {
    if (Math.abs(colorDifference(history.slice(0, i))) > 2) return false;
  }
  return !hasThreeInARow(history);
};

const legalHistories = (maxLength: number): Color[][] => {
  const all: Color[][] = [];
  for (let n = 0; n <= maxLength; n++) {
    for (let bits = 0; bits < 1 << n; bits++) {
      const history = Array.from({ length: n }, (_, i) =>
        (bits >> i) & 1 ? W : B,
      );
      if (isLegalHistory(history)) all.push(history);
    }
  }
  return all;
};

const asPlayer = (
  playerId: number,
  pairingNb: number,
  history: Color[],
): PlayerColorState => ({
  playerId,
  pairingNb,
  score: 1,
  history: history.map((color) => ({ color })),
  ...getColorPreference(history),
});

const show = (history: Color[]) => history.join("") || "(no games)";

/**
 * OUT-1 (C.04.1 rule 6) and OUT-2 (C.04.1 rule 7).
 *
 * For every pair of legal histories that the library itself calls compatible,
 * the colour it hands out must leave both players legal. Incompatible pairs are
 * skipped: refusing to build them is the pairing engine's job (PC-1).
 */
test("OUT-1/OUT-2: a compatible pair is never given an illegal colour", () => {
  const histories = legalHistories(5);
  const failures: string[] = [];
  let pairsChecked = 0;

  for (const oneHistory of histories) {
    for (const twoHistory of histories) {
      const one = asPlayer(1, 1, oneHistory);
      const two = asPlayer(2, 2, twoHistory);
      if (!isColorCompatible(one, two)) continue;

      pairsChecked++;
      const result = assignColors(one, two, W);

      for (const [player, history] of [
        [one, oneHistory],
        [two, twoHistory],
      ] as const) {
        const got = result.white === player.playerId ? W : B;
        const after = [...history, got];

        if (Math.abs(colorDifference(after)) > 2) {
          failures.push(`OUT-1 ${show(history)} was given ${got}`);
        }
        if (hasThreeInARow(after)) {
          failures.push(`OUT-2 ${show(history)} was given ${got}`);
        }
      }
    }
  }

  expect(pairsChecked).toBeGreaterThan(0);
  // Slice so a failure reports a readable sample rather than thousands of lines.
  expect(failures.slice(0, 8)).toEqual([]);
});

/**
 * The generator itself, so a bug in it cannot quietly empty the test above.
 */
test("the legal-history generator rejects what FIDE forbids", () => {
  expect(isLegalHistory([W, W, W])).toBeFalse();
  expect(isLegalHistory([B, B, B])).toBeFalse();
  expect(isLegalHistory([W, W, B, B])).toBeTrue();
  expect(isLegalHistory([W, W, B, W])).toBeTrue();
  expect(legalHistories(4).length).toBeGreaterThan(4);
  expect(legalHistories(4).every(isLegalHistory)).toBeTrue();
});

/**
 * Gaps that need a signature or type change before they can be asserted.
 * Kept as todos so docs/fide-colour-rules.md and the suite cannot drift apart.
 */

// CA-4 (art. 5.2.2): when both preferences are absolute and identical, the
// wider colour difference wins. ColorState stores only a capped level, so a
// difference of +3 and one of +2 are indistinguishable here.
test.todo("CA-4: both absolute and identical grants the wider colour difference");

// PC-4 (art. 2.1.3 [C3]): the prohibition covers non-topscorers only.
// isColorCompatible takes no topscorer flag, so it also refuses topscorer pairs
// that FIDE permits in the final round.
test.todo("PC-4: topscorers with the same absolute preference may meet");

// PC-5: assignColors never consults isColorCompatible, so it will answer for a
// pair FIDE forbids instead of refusing. Pending the decision on whether the
// library validates or only arbitrates.
test.todo("PC-5: assignColors refuses an incompatible pair");
