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
}
