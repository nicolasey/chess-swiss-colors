import { expect, test } from "bun:test";
import { assignColors, Color, ColorPreference, type PlayerColorState } from "../index";
import { faker } from "@faker-js/faker";

const createPlayerSample = (
  pairingNb: number,
  score: number,
  colorPreference: Color,
  colorPreferenceLevel: ColorPreference): PlayerColorState => ({
  playerId: faker.number.int({ min: 1, max: 9000 }),
  pairingNb,
  score,
  roundNb: 1,
  colorPreference,
  colorPreferenceLevel,
  history: [],
});

test("when_no_preference", () => {
  const playerOne = createPlayerSample(1, 0, Color.BYE, ColorPreference.LOW);
  const playerTwo = createPlayerSample(2, 0, Color.BYE, ColorPreference.LOW);

  const result = assignColors(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("when_diff_preference", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(2, 0, Color.WHITE, ColorPreference.HIGH);

  const result = assignColors(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("when_same_preference_diff_level", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(2, 0, Color.BLACK, ColorPreference.ABSOLUTE);

  const result = assignColors(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerTwo.playerId);
  expect(result.white).toBe(playerOne.playerId);
});

test("when_same_preference_diff_level_second", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(2, 0, Color.BLACK, ColorPreference.LOW);

  const result = assignColors(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});

test("when_same", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(2, 0, Color.BLACK, ColorPreference.HIGH);

  const result = assignColors(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});


test("when_same_but_score_diff", () => {
  const playerOne = createPlayerSample(1, 0, Color.BLACK, ColorPreference.HIGH);
  const playerTwo = createPlayerSample(2, 0.5, Color.BLACK, ColorPreference.HIGH);

  const result = assignColors(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerTwo.playerId);
  expect(result.white).toBe(playerOne.playerId);
});

test("when_same_absolute_diff_color_history", () => {
  let playerOne = createPlayerSample(1, 0.5, Color.BLACK, ColorPreference.ABSOLUTE);
  let playerTwo = createPlayerSample(2, 0.5, Color.BLACK, ColorPreference.ABSOLUTE);

  playerOne.history = [
    { color: Color.BLACK },
    { color: Color.WHITE },
    { color: Color.BYE },
    { color: Color.WHITE }
  ];
  playerTwo.history = [
    { color: Color.BLACK },
    { color: Color.BLACK },
    { color: Color.WHITE },
    { color: Color.WHITE }
  ]

  const result = assignColors(playerOne, playerTwo, Color.BLACK);

  expect(result.black).toBe(playerOne.playerId);
  expect(result.white).toBe(playerTwo.playerId);
});
