import { ColorPreference } from "./src/color-preference.enum";
import { Color } from "./src/color.enum";

export type PlayerId = string | number;

export type ColorAssignment = {
  white: PlayerId;
  black: PlayerId;
}

export type PlayerColorState = {
  // Necessary fields to perform color state evaluation
  playerId: PlayerId;
  pairingNb: number;
  score: number;
  roundNb: number;

  // Color State
  colorPreference: Color;
  colorPreferenceLevel: ColorPreference;
}

export type ColorHistoryContract = {
  color: Color;
}

export type ColorDiff = {
  // Nb rounds ago, starting from last played round
  roundAgo: number;
  roundNb: number;

  // The diff found
  one: Color;
  two: Color;
}
