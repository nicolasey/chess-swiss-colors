import { readFileSync, readdirSync } from "node:fs";
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

/**
 * Every legal history up to `maxLength` rounds, over `alphabet`. Including
 * Color.BYE is what makes two players' rounds fall out of step, which is the
 * only situation in which 5.2.3's alignment choice can change an answer.
 */
const legalHistories = (
  maxLength: number,
  alphabet: Color[] = [W, B],
): Color[][] => {
  const all: Color[][] = [];
  const build = (history: Color[]) => {
    if (isLegalHistory(history)) all.push(history);
    if (history.length === maxLength) return;
    for (const color of alphabet) build([...history, color]);
  };
  build([]);
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
const checkEveryCompatiblePair = (histories: Color[][]) => {
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

  return { failures, pairsChecked };
};

/**
 * Nine rounds of ordinary play: every legal colour history a player could hold,
 * against every other, wherever the library itself calls the pair compatible.
 */
test("OUT-1/OUT-2: a compatible pair is never given an illegal colour", () => {
  const { failures, pairsChecked } = checkEveryCompatiblePair(
    legalHistories(9),
  );

  expect(pairsChecked).toBeGreaterThan(50_000);
  // Slice so a failure reports a readable sample rather than thousands of lines.
  expect(failures.slice(0, 8)).toEqual([]);
});

/**
 * The same sweep with unplayed rounds in play, so the two players' games fall
 * out of step and 5.2.3 has to align them. Shallower, because the alphabet is
 * three wide.
 */
test("OUT-1/OUT-2: byes in either history change nothing", () => {
  const { failures, pairsChecked } = checkEveryCompatiblePair(
    legalHistories(6, [W, B, Color.BYE]),
  );

  expect(pairsChecked).toBeGreaterThan(50_000);
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
  expect(isLegalHistory([W, Color.BYE, W, Color.BYE, W])).toBeFalse();
  expect(legalHistories(4).length).toBeGreaterThan(4);
  expect(legalHistories(4).every(isLegalHistory)).toBeTrue();
  expect(legalHistories(4, [W, B, Color.BYE]).every(isLegalHistory)).toBeTrue();
});

/**
 * Gaps that need a signature or type change before they can be asserted.
 * Kept as todos so docs/fide-colour-rules.md and the suite cannot drift apart.
 */

// PC-4 (art. 2.1.3 [C3]): the prohibition covers non-topscorers only.
// isColorCompatible takes no topscorer flag, so it also refuses topscorer pairs
// that FIDE permits in the final round.
test.todo("PC-4: topscorers with the same absolute preference may meet");

/**
 * PC-5 — a decision, not a gap. This package recommends colours for a Swiss
 * engine that owns the pairing, and legality is that engine's call: only it can
 * act on an incompatibility, by building a different pair. So assignColors
 * answers for any pair it is given, including one art. 2.1.3 [C3] forbids, and
 * never refuses on rule grounds. Callers screen with isColorCompatible first.
 *
 * Malformed input is a separate matter — a missing pairing number still throws,
 * because that is not a forbidden pairing, it is an unanswerable question.
 */
test("PC-5: recommends_a_colour_even_for_a_pair_FIDE_forbids", () => {
  // Two absolute White preferences: [C3] says these two shall not meet.
  const one = asPlayer(1, 1, [B, B]);
  const two = asPlayer(2, 2, [B, B]);

  expect(isColorCompatible(one, two)).toBeFalse();

  const result = assignColors(one, two, W);

  expect(result.white).not.toBe(result.black);
  expect([result.white, result.black].sort()).toEqual([1, 2]);
  expect(assignColors(two, one, W)).toEqual(result);
});

test("PC-5: still_refuses_to_answer_an_unanswerable_question", () => {
  const noPairingNumber = asPlayer(1, 0, []);
  const two = asPlayer(2, 2, []);

  expect(() => assignColors(noPairingNumber, two, W)).toThrow(
    "Pairing numbers required !",
  );
});

/**
 * The doc's Test column is hand-written and would otherwise rot silently. This
 * makes it mechanical: every rule ID in docs/fide-colour-rules.md must be cited
 * somewhere under tests/ — as a test name, a todo, or a comment explaining why
 * no test is possible.
 */
test("every rule in docs/fide-colour-rules.md is cited by a test", () => {
  const doc = readFileSync("docs/fide-colour-rules.md", "utf8");
  // \d+ rather than \d: a two-digit id would not match at all, so the gate
  // would pass by ignoring it instead of by covering it.
  const ids = [...new Set(doc.match(/\b(?:CP|CA|PC|TS|OUT)-\d+\b/g) ?? [])].sort();

  const suite = readdirSync("tests")
    .filter((file) => file.endsWith(".ts"))
    .map((file) => readFileSync(`tests/${file}`, "utf8"))
    .join("\n");

  // Guard against the regex quietly matching nothing.
  expect(ids.length).toBeGreaterThan(20);
  expect(ids.filter((id) => !suite.includes(id))).toEqual([]);
});
