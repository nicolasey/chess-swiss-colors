import { ColorPreference } from "./src/color-preference.enum";
import { Color } from "./src/color.enum";

export type PlayerId = string | number;

export type ColorAssignment = {
  white: PlayerId;
  black: PlayerId;
};

export type ColorState = {
  colorPreference: Color;
  colorPreferenceLevel: ColorPreference;
};

export type PlayerColorState = {
  // Necessary fields to perform color state evaluation
  playerId: PlayerId;
  pairingNb: number;
  score: number;

  // Color State
  colorPreference: Color;
  colorPreferenceLevel: ColorPreference;

  // History must have color field in
  history: ColorHistoryContract[];
};

export type ColorHistoryContract = {
  color: Color;
};

export type ColorDiff = {
  // Nb games ago, counted from the most recent game played. Byes are
  // stripped first, so this is games played, not rounds elapsed.
  roundAgo: number;

  // The diff found
  one: Color;
  two: Color;
};

export type TournamentColor = {
  randomColor: Color | null;
};
