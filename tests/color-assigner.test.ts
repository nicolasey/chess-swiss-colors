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

const ONE_ID = 1;
const TWO_ID = 2;

const createPlayerSample = (
  pairingNb: number,
  score: number,
  colorPreference: Color,
  colorPreferenceLevel: ColorPreference,
  playerId = ONE_ID,
): PlayerColorState => ({
  playerId,
  pairingNb,
  score,
  colorPreference,
  colorPreferenceLevel,
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
 *  - the outcome does not depend on which player was passed first
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

test("when_no_preference", () => {
  const playerOne = createPlayerSample(1, 0, Color.BYE, ColorPreference.LOW);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BYE,
    ColorPreference.LOW,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

/**
 * FIDE C.04.1 (f): the higher ranked player of a pair receives the drawn
 * colour when their pairing number is odd, the opposite when it is even.
 */
test("round_one_gives_the_drawn_colour_by_pairing_parity", () => {
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
      ColorPreference.LOW,
    );
    const lower = createPlayerSample(
      lowerPairingNb,
      0,
      Color.BYE,
      ColorPreference.LOW,
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
  const playerOne = createPlayerSample(0, 0, Color.BYE, ColorPreference.LOW);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BYE,
    ColorPreference.LOW,
    TWO_ID,
  );

  expect(() => assignColors(playerOne, playerTwo, Color.BLACK)).toThrow(
    "Pairing numbers required !",
  );
  expect(() => assignColors(playerTwo, playerOne, Color.BLACK)).toThrow(
    "Pairing numbers required !",
  );
});

test("when_diff_preference", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.WHITE,
    ColorPreference.HIGH,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("when_same_preference_diff_level", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
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

test("when_same_preference_diff_level_second", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BLACK,
    ColorPreference.LOW,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("when_same", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(
    2,
    0,
    Color.BLACK,
    ColorPreference.HIGH,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("when_same_but_score_diff", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(
    2,
    0.5,
    Color.BLACK,
    ColorPreference.HIGH,
    TWO_ID,
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerTwo.playerId);
  expect(result.white).toBe(playerOne.playerId);
});

test("when_same_absolute_diff_color_history", () => {
  const [playerOne, playerTwo] = createPair(
    {
      pairingNb: 1,
      score: 0.5,
      colorPreference: Color.BLACK,
      colorPreferenceLevel: ColorPreference.ABSOLUTE,
      history: [
        { color: Color.BLACK },
        { color: Color.WHITE },
        { color: Color.BYE },
        { color: Color.WHITE },
      ],
    },
    {
      pairingNb: 2,
      score: 0.5,
      colorPreference: Color.BLACK,
      colorPreferenceLevel: ColorPreference.ABSOLUTE,
      history: [
        { color: Color.BLACK },
        { color: Color.BLACK },
        { color: Color.WHITE },
        { color: Color.WHITE },
      ],
    },
  );

  const result = assign(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("it_should_not_mutate_the_players_it_is_given", () => {
  const [playerOne, playerTwo] = createPair(
    {
      pairingNb: 1,
      score: 1,
      colorPreference: Color.BLACK,
      colorPreferenceLevel: ColorPreference.HIGH,
      history: [{ color: Color.WHITE }, { color: Color.BLACK }],
    },
    {
      pairingNb: 2,
      score: 1,
      colorPreference: Color.BLACK,
      colorPreferenceLevel: ColorPreference.HIGH,
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
test("color_state_feeds_the_assigner", () => {
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
