import { expect, test } from "bun:test";
import {
  assignColors,
  getColorPreference,
  getOppositeColor,
  Color,
  ColorPreference,
  type ColorAssignment,
  type PlayerColorState,
} from "../index";
import { differenceFor } from "./fixtures";

const ONE_ID = 1;
const TWO_ID = 2;

const createPlayerSample = (
  pairingNb: number,
  score: number,
  colorPreference: Color,
  colorPreferenceLevel: ColorPreference,
  playerId = ONE_ID,
  colorDifference = differenceFor(colorPreference, colorPreferenceLevel),
): PlayerColorState => ({
  playerId,
  pairingNb,
  score,
  colorPreference,
  colorPreferenceLevel,
  colorDifference,
  history: [],
});

const createPair = (
  one: Omit<PlayerColorState, "playerId">,
  two: Omit<PlayerColorState, "playerId">,
): [PlayerColorState, PlayerColorState] => [
  { ...one, playerId: ONE_ID },
  { ...two, playerId: TWO_ID },
];

/**
 * Invariants that must hold for every assignment, on every path:
 *  - the two colours go to two different players
 *  - the players are exactly the two that were passed in
 *  - the outcome does not depend on which player was passed first (CA-8)
 * The first two are OUT-4.
 */
const expectValidAssignment = (
  result: ColorAssignment,
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
  randomColor: Color,
) => {
  expect(result.white).not.toBe(result.black);
  expect([result.white, result.black].sort()).toEqual(
    [playerOne.playerId, playerTwo.playerId].sort(),
  );

  const swapped = assignColors(playerTwo, playerOne, randomColor);
  expect(swapped).toEqual(result);
};

const assign = (
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
  randomColor: Color,
): ColorAssignment => {
  const result = assignColors(playerOne, playerTwo, randomColor);
  expectValidAssignment(result, playerOne, playerTwo, randomColor);
  return result;
};

test("CA-7: when_no_preference", () => {
  const playerOne = createPlayerSample(1, 0, Color.BYE, ColorPreference.MILD);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BYE,
    ColorPreference.MILD,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

/**
 * CA-7 — FIDE C.04.3 art. 5.2.5: the higher ranked player of a pair receives
 * the initial-colour when their TPN is odd, the opposite when it is even.
 */
test("CA-7: round_one_gives_the_drawn_colour_by_pairing_parity", () => {
  const cases: Array<[Color, number, number]> = [
    [Color.BLACK, 1, 2],
    [Color.BLACK, 2, 3],
    [Color.BLACK, 3, 4],
    [Color.BLACK, 4, 5],
    [Color.WHITE, 1, 2],
    [Color.WHITE, 2, 3],
    [Color.WHITE, 3, 4],
    [Color.WHITE, 4, 5],
  ];

  for (const [drawn, higherPairingNb, lowerPairingNb] of cases) {
    const higher = createPlayerSample(
      higherPairingNb,
      0,
      Color.BYE,
      ColorPreference.MILD,
    );
    const lower = createPlayerSample(
      lowerPairingNb,
      0,
      Color.BYE,
      ColorPreference.MILD,
      TWO_ID,
    );

    const expected =
      higherPairingNb % 2 === 0 ? getOppositeColor(drawn) : drawn;

    const result = assign(higher, lower, drawn);
    const higherGot =
      result.white === higher.playerId ? Color.WHITE : Color.BLACK;

    expect(
      `drawn=${drawn} pairing=${higherPairingNb} got=${higherGot}`,
    ).toBe(`drawn=${drawn} pairing=${higherPairingNb} got=${expected}`);
  }
});

test("round_one_requires_pairing_numbers", () => {
  const playerOne = createPlayerSample(0, 0, Color.BYE, ColorPreference.MILD);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BYE,
    ColorPreference.MILD,
    TWO_ID,
  );

  expect(() => assignColors(playerOne, playerTwo, Color.BLACK)).toThrow(
    "Pairing numbers required !",
  );
  expect(() => assignColors(playerTwo, playerOne, Color.BLACK)).toThrow(
    "Pairing numbers required !",
  );
});

test("CA-1: when_diff_preference", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.STRONG);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.WHITE,
    ColorPreference.STRONG,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("CA-3: when_same_preference_diff_level", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.STRONG);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BLACK,
    ColorPreference.ABSOLUTE,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerTwo.playerId);
  expect(result.white).toBe(playerOne.playerId);
});

test("CA-3: when_same_preference_diff_level_second", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.STRONG);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BLACK,
    ColorPreference.MILD,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("CA-6: when_same", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.STRONG);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BLACK,
    ColorPreference.STRONG,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("CA-6: when_same_but_score_diff", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.STRONG);
  const playerTwo = createPlayerSample(
    2,
    0.5,
    Color.BLACK,
    ColorPreference.STRONG,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerTwo.playerId);
  expect(result.white).toBe(playerOne.playerId);
});

/**
 * CA-5 — FIDE C.04.3 art. 5.2.3
 * Same preference, same strength: alternate from the most recent game in which
 * the two held different colours. playerOne had White there, so playerOne takes
 * Black now.
 *
 * playerTwo is deliberately the higher ranked of the pair, so CA-6 would give
 * the opposite answer. If this pair ever stops reaching 5.2.3 the assertion
 * fails, instead of passing for the wrong reason as its predecessor did.
 */
test("CA-5: alternates_from_the_most_recent_differing_game", () => {
  const oneHistory = [Color.WHITE, Color.BLACK, Color.WHITE];
  const twoHistory = [Color.WHITE, Color.WHITE, Color.BLACK];

  const [playerOne, playerTwo] = createPair(
    {
      pairingNb: 2,
      score: 1,
      history: oneHistory.map((color) => ({ color })),
      ...getColorPreference(oneHistory),
    },
    {
      pairingNb: 1,
      score: 1,
      history: twoHistory.map((color) => ({ color })),
      ...getColorPreference(twoHistory),
    },
  );

  // Guard the premise: 5.2.3 is only reached when 5.2.1 and 5.2.2 cannot decide.
  expect(playerOne.colorPreference).toBe(playerTwo.colorPreference);
  expect(playerOne.colorPreferenceLevel).toBe(playerTwo.colorPreferenceLevel);

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.white).toBe(playerTwo.playerId);
  expect(result.black).toBe(playerOne.playerId);
});

/**
 * CA-5 — bye alignment is this library's reading, not FIDE's. Art. 5.2.3 says
 * "the most recent time" the two held different colours and is silent on
 * unplayed rounds; src/color-compare.ts strips byes per player and compares by
 * games played. This pins that choice so changing it has to be deliberate.
 */
test("CA-5: byes_are_stripped_per_player_before_comparing", () => {
  const oneHistory = [Color.WHITE, Color.BYE, Color.BLACK, Color.WHITE];
  const twoHistory = [Color.WHITE, Color.WHITE, Color.BLACK];

  const [playerOne, playerTwo] = createPair(
    {
      pairingNb: 2,
      score: 1,
      history: oneHistory.map((color) => ({ color })),
      ...getColorPreference(oneHistory),
    },
    {
      pairingNb: 1,
      score: 1,
      history: twoHistory.map((color) => ({ color })),
      ...getColorPreference(twoHistory),
    },
  );

  expect(playerOne.colorPreference).toBe(playerTwo.colorPreference);
  expect(playerOne.colorPreferenceLevel).toBe(playerTwo.colorPreferenceLevel);

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.white).toBe(playerTwo.playerId);
  expect(result.black).toBe(playerOne.playerId);
});

test("it_should_not_mutate_the_players_it_is_given", () => {
  const [playerOne, playerTwo] = createPair(
    {
      pairingNb: 1,
      score: 1,
      colorPreference: Color.BLACK,
      colorPreferenceLevel: ColorPreference.STRONG,
      colorDifference: differenceFor(Color.BLACK, ColorPreference.STRONG),
      history: [{ color: Color.WHITE }, { color: Color.BLACK }],
    },
    {
      pairingNb: 2,
      score: 1,
      colorPreference: Color.BLACK,
      colorPreferenceLevel: ColorPreference.STRONG,
      colorDifference: differenceFor(Color.BLACK, ColorPreference.STRONG),
      history: [{ color: Color.BLACK }, { color: Color.BLACK }],
    },
  );
  const oneBefore = structuredClone(playerOne);
  const twoBefore = structuredClone(playerTwo);

  assignColors(playerOne, playerTwo, Color.BLACK);

  expect(playerOne).toEqual(oneBefore);
  expect(playerTwo).toEqual(twoBefore);
});

/**
 * getColorPreference feeds assignColors in real use. Test the seam, not just
 * the two ends of it.
 */
test("CA-1: color_state_feeds_the_assigner", () => {
  const oneHistory = [Color.WHITE, Color.BLACK, Color.WHITE];
  const twoHistory = [Color.BLACK, Color.WHITE, Color.BLACK];

  const oneState = getColorPreference(oneHistory);
  const twoState = getColorPreference(twoHistory);

  expect(oneState.colorPreference).toBe(Color.BLACK);
  expect(twoState.colorPreference).toBe(Color.WHITE);

  const [playerOne, playerTwo] = createPair(
    {
      pairingNb: 1,
      score: 2,
      ...oneState,
      history: oneHistory.map((color) => ({ color })),
    },
    {
      pairingNb: 2,
      score: 2,
      ...twoState,
      history: twoHistory.map((color) => ({ color })),
    },
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

/**
 * CA-2 — FIDE C.04.3 art. 1.7.4
 * A player who has played no games has no colour preference, and their
 * opponent's preference is granted. Uses `assign`, so CA-8 (order independence)
 * is asserted alongside. See docs/fide-colour-rules.md.
 */
test("CA-2: a_player_with_no_preference_grants_their_opponent_white", () => {
  const byeOnly = [Color.BYE];
  const playedBlack = [Color.BLACK];

  const [noPreference, wantsWhite] = createPair(
    { pairingNb: 7, score: 1, history: byeOnly.map((color) => ({ color })),
      ...getColorPreference(byeOnly) },
    { pairingNb: 3, score: 1, history: playedBlack.map((color) => ({ color })),
      ...getColorPreference(playedBlack) },
  );

  expect(wantsWhite.colorPreference).toBe(Color.WHITE);

  const result = assign(noPreference, wantsWhite, Color.WHITE);

  expect(result.white).toBe(wantsWhite.playerId);
  expect(result.black).toBe(noPreference.playerId);
});

test("CA-2: a_player_with_no_preference_grants_their_opponent_black", () => {
  const byeOnly = [Color.BYE];
  const playedWhite = [Color.WHITE];

  const [noPreference, wantsBlack] = createPair(
    { pairingNb: 7, score: 1, history: byeOnly.map((color) => ({ color })),
      ...getColorPreference(byeOnly) },
    { pairingNb: 3, score: 1, history: playedWhite.map((color) => ({ color })),
      ...getColorPreference(playedWhite) },
  );

  expect(wantsBlack.colorPreference).toBe(Color.BLACK);

  const result = assign(noPreference, wantsBlack, Color.WHITE);

  expect(result.black).toBe(wantsBlack.playerId);
  expect(result.white).toBe(noPreference.playerId);
});

test("CA-2: an_empty_history_also_grants_the_opponent", () => {
  const playedBlack = [Color.BLACK];

  const [noPreference, wantsWhite] = createPair(
    { pairingNb: 7, score: 1, history: [], ...getColorPreference([]) },
    { pairingNb: 3, score: 1, history: playedBlack.map((color) => ({ color })),
      ...getColorPreference(playedBlack) },
  );

  const result = assign(noPreference, wantsWhite, Color.WHITE);

  expect(result.white).toBe(wantsWhite.playerId);
});

/**
 * CA-3 — FIDE C.04.3 art. 5.2.2, White side.
 * The Black cases above left this half of the branch unexecuted by the whole
 * suite; a mutation there survived until these were added.
 */
test("CA-3: when_same_preference_diff_level_white", () => {
  const playerOne = createPlayerSample(1, 0, Color.WHITE, ColorPreference.STRONG);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.WHITE,
    ColorPreference.ABSOLUTE,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.white).toBe(playerTwo.playerId);
  expect(result.black).toBe(playerOne.playerId);
});

test("CA-3: when_same_preference_diff_level_white_second", () => {
  const playerOne = createPlayerSample(1, 0, Color.WHITE, ColorPreference.STRONG);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.WHITE,
    ColorPreference.MILD,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.white).toBe(playerOne.playerId);
  expect(result.black).toBe(playerTwo.playerId);
});

/**
 * CA-8 — order independence, as an expectation with a name of its own rather
 * than only an assertion riding inside `assign`. One shape per branch of the
 * assigner, so a branch that is order-dependent cannot hide behind the others.
 */
test("CA-8: the_result_never_depends_on_argument_order", () => {
  const shapes: Array<[Color, ColorPreference, Color, ColorPreference]> = [
    [Color.BYE, ColorPreference.MILD, Color.BYE, ColorPreference.MILD], // 5.2.5
    [Color.WHITE, ColorPreference.STRONG, Color.BLACK, ColorPreference.STRONG], // 5.2.1
    [Color.WHITE, ColorPreference.ABSOLUTE, Color.WHITE, ColorPreference.STRONG], // 5.2.2
    [Color.BLACK, ColorPreference.MILD, Color.BLACK, ColorPreference.MILD], // 5.2.4
  ];

  for (const [onePref, oneLevel, twoPref, twoLevel] of shapes) {
    const one = createPlayerSample(1, 1, onePref, oneLevel);
    const two = createPlayerSample(2, 1, twoPref, twoLevel, TWO_ID);

    expect(assignColors(one, two, Color.WHITE)).toEqual(
      assignColors(two, one, Color.WHITE),
    );
  }
});

/**
 * CA-4 — FIDE C.04.3 art. 5.2.2, second clause.
 * Both are absolute for White. playerTwo's difference is −2 against playerOne's
 * −1, so playerTwo takes it.
 *
 * playerOne is deliberately the higher ranked, and at their most recent
 * differing game playerOne held Black — so 5.2.3 *and* 5.2.4 would both give
 * White to playerOne. If the clause is skipped this fails, rather than passing
 * on a fallback that happened to agree.
 */
test("CA-4: the_wider_colour_difference_takes_the_colour", () => {
  const oneHistory = [Color.WHITE, Color.BLACK, Color.BLACK];
  const twoHistory = [Color.BLACK, Color.BLACK, Color.WHITE, Color.BLACK];

  const [playerOne, playerTwo] = createPair(
    {
      pairingNb: 1,
      score: 1,
      history: oneHistory.map((color) => ({ color })),
      ...getColorPreference(oneHistory),
    },
    {
      pairingNb: 2,
      score: 1,
      history: twoHistory.map((color) => ({ color })),
      ...getColorPreference(twoHistory),
    },
  );

  // The premise: 5.2.2's second clause is only reached when 5.2.1 and the
  // first clause cannot decide.
  expect(playerOne.colorPreference).toBe(playerTwo.colorPreference);
  expect(playerOne.colorPreferenceLevel).toBe(ColorPreference.ABSOLUTE);
  expect(playerTwo.colorPreferenceLevel).toBe(ColorPreference.ABSOLUTE);
  expect(Math.abs(playerTwo.colorDifference)).toBeGreaterThan(
    Math.abs(playerOne.colorDifference),
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.white).toBe(playerTwo.playerId);
  expect(result.black).toBe(playerOne.playerId);
});

/**
 * CA-4 — equal magnitudes leave the clause with nothing to say, and 5.2.3
 * decides. This is the common path, not the exotic one: r6 caps the difference
 * at ±2, so two players absolute *because of* their difference always tie.
 */
test("CA-4: equal_magnitudes_fall_through_to_the_next_rule", () => {
  const oneHistory = [Color.BLACK, Color.WHITE, Color.BLACK, Color.BLACK];
  const twoHistory = [Color.BLACK, Color.BLACK, Color.WHITE, Color.BLACK];

  const [playerOne, playerTwo] = createPair(
    {
      pairingNb: 2,
      score: 1,
      history: oneHistory.map((color) => ({ color })),
      ...getColorPreference(oneHistory),
    },
    {
      pairingNb: 1,
      score: 1,
      history: twoHistory.map((color) => ({ color })),
      ...getColorPreference(twoHistory),
    },
  );

  expect(playerOne.colorDifference).toBe(playerTwo.colorDifference);

  const result = assign(playerOne, playerTwo, Color.BLACK);

  // 5.2.3: playerOne held Black at their most recent differing game, so takes
  // White. playerTwo is the higher ranked, so 5.2.4 would have said the
  // opposite — this asserts the fall-through lands on 5.2.3, not past it.
  expect(result.white).toBe(playerOne.playerId);
  expect(result.black).toBe(playerTwo.playerId);
});
