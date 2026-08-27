import type { ColorState } from "../colors.types";
import { ColorPreference } from "./color-preference.enum";
import { Color, getOppositeColor } from "./color.enum";

export function getColorPreference(colorHistory: Color[]): ColorState {
  const white = colorHistory.filter((item) => item === Color.WHITE).length;
  const black = colorHistory.filter((item) => item === Color.BLACK).length;
  let diff = Math.abs(white - black);

  const lastPlayedColor = getLastPlayedColor(colorHistory);

  const lastTwoColors = getLastTwoColors(colorHistory);
  const lastTwoColorsAreSame = lastTwoColors
    ? lastTwoColors[0] === lastTwoColors[1]
    : false;

  if (diff === 0)
    return {
      colorPreference: lastPlayedColor
        ? getOppositeColor(lastPlayedColor)
        : Color.BYE,
      colorPreferenceLevel: ColorPreference.LOW,
    };

  // If last two colors are same, then override diff to absolute (FIDE C04.1 g)
  if (lastTwoColorsAreSame) diff = ColorPreference.ABSOLUTE;

  return {
    colorPreference: white > black ? Color.BLACK : Color.WHITE,
    // A difference of two or more is already absolute; there is no stronger
    // degree. OFF_GRID is set explicitly by the caller, never derived here.
    colorPreferenceLevel: Math.min(
      diff,
      ColorPreference.ABSOLUTE,
    ) as ColorPreference,
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
