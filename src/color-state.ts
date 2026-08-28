import type { ColorState } from "../colors.types";
import { ColorPreference } from "./color-preference.enum";
import { Color, getOppositeColor } from "./color.enum";

export function getColorPreference(colorHistory: Color[]): ColorState {
  const white = colorHistory.filter((item) => item === Color.WHITE).length;
  const black = colorHistory.filter((item) => item === Color.BLACK).length;
  const colorDifference = white - black; // art. 1.6, signed
  const diff = Math.abs(colorDifference);

  const lastTwoColors = getLastTwoColors(colorHistory);

  /**
   * FIDE C.04.3 art. 1.7.1
   * The colour difference and the two-in-a-row rule are alternative triggers,
   * either of which makes a preference absolute. Both the level and the
   * direction come from whichever one fired, so this is tested before the
   * balanced case below: a balanced history can still end in a repeated colour.
   */
  if (lastTwoColors && lastTwoColors[0] === lastTwoColors[1])
    return {
      colorPreference: getOppositeColor(lastTwoColors[0]),
      colorPreferenceLevel: ColorPreference.ABSOLUTE,
      colorDifference,
    };

  /**
   * art. 1.7.3 — mild: alternate from the previous game.
   * art. 1.7.4 — a player who has played nothing has no preference, which
   * getLastPlayedColor reports as BYE and getOppositeColor passes through.
   */
  if (diff === 0)
    return {
      colorPreference: getOppositeColor(getLastPlayedColor(colorHistory)),
      colorPreferenceLevel: ColorPreference.LOW,
      colorDifference,
    };

  /**
   * art. 1.7.1/1.7.2 — strong at a difference of one, absolute beyond it. A
   * difference of two or more is already absolute; there is no stronger degree.
   * OFF_GRID is set explicitly by the caller, never derived here.
   */
  return {
    colorPreference: white > black ? Color.BLACK : Color.WHITE,
    colorPreferenceLevel: Math.min(
      diff,
      ColorPreference.ABSOLUTE,
    ) as ColorPreference,
    colorDifference,
  };
}

/**
 * Returns last played color for a Player
 * Returns Color BYE if none was played
 * Passes if BYE
 *
 * @param items Item[]
 * @returns Color
 */
export function getLastPlayedColor(items: Color[]): Color {
  const mostRecentFirst = [...items].reverse();

  for (const color of mostRecentFirst) {
    if (color !== Color.BYE) return color;
  }
  return Color.BYE;
}

/**
 * FIDE C04.1 (g)
 * No player shall receive the same colour three times in a row.
 * Each system may have exceptions to this rule in the last round of a tournament.
 *
 * Returns null when Player has not played (at least) two games
 *
 * @param items Item[]
 * @returns Color | null
 */
export function getLastTwoColors(items: Color[]): Color[] | null {
  const colors: Color[] = [];

  for (const color of [...items].reverse()) {
    if (color !== Color.BYE) colors.push(color);
    if (colors.length === 2) return colors;
  }

  return null;
}
