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

export type PlayerColorState = ColorState & {
  // Necessary fields to perform color state evaluation
  playerId: PlayerId;
  pairingNb: number;
  score: number;

  // History must have color field in
  history: ColorHistoryContract[];

  /**
   * FIDE C.04.3 art. 1.8 — a topscorer is a player above 50% of the maximum
   * possible score *when pairing the final round*. The status does not exist in
   * any earlier round.
   *
   * This package has no round counter and cannot infer one: history.length
   * counts a player's rounds, not the tournament's. Setting this outside the
   * final round produces pairings FIDE forbids, and nothing here will notice.
   * That is why it is named for the round rather than just for the status.
   *
   * Optional; absent means false, which keeps art. 2.1.3 [C3] in force.
   */
  isFinalRoundTopscorer?: boolean;
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
