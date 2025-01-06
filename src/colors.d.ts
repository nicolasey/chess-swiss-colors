export type PlayerId = string | number;

export type ColorAssignment = {
  white: PlayerId;
  black: PlayerId;
}

export type PlayerColorState = {
  playerId: PlayerId;
  pairingNb: number;
  score: number;
  roundNb: number;

  colorPreference: Color;
  colorPreferenceLevel: ColorPreference;
  colorHistory: Color[];
}

export type ColorDiff = {
  // Nb rounds ago, starting from last played round
  roundAgo: number;
  roundNb: number;

  // The diff found
  one: Color;
  two: Color;
}
