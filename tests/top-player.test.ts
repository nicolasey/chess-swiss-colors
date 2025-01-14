import { expect, test } from "bun:test";
import { faker } from '@faker-js/faker';
import { Color, ColorPreference, type PlayerColorState } from "../index";
import { isTopPlayer } from '../src/top-player';

const createPlayerSample = (score: number, roundNb: number): PlayerColorState => ({
  playerId: faker.number.int({ min: 1, max: 9000 }),
  pairingNb: faker.number.int({ min: 1, max: 100 }),
  score,
  roundNb,
  colorPreference: Color.WHITE,
  colorPreferenceLevel: ColorPreference.HIGH,
  history: [],
});

test("checks_if_top_player", () => {
  const player = createPlayerSample(2.5, 4);
  const top = isTopPlayer(player);
  expect(top).toBeTrue();

  const player2 = createPlayerSample(2, 4);
  const top2 = isTopPlayer(player2);
  expect(top2).toBeFalse();
});
