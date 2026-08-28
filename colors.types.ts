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

  // FIDE C.04.3 art. 1.6 — signed: games played White minus games played Black.
  // A preference for White therefore goes with a negative difference. Needed by
  // art. 5.2.2, which breaks a tie between two absolute preferences on the
  // wider difference, a distinction the capped level cannot express.
  colorDifference: number;
};

export type PlayerColorState = {
  // Necessary fields to perform color state evaluation
  playerId: PlayerId;
  pairingNb: number;
  score: number;

  // Color State
  colorPreference: Color;
  colorPreferenceLevel: ColorPreference;
  colorDifference: number;

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
