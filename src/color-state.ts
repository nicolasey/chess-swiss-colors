import { ColorPreference } from "./color-preference.enum";
import { Color, getOppositeColor } from "./color.enum";

export type ColorState = {
  colorPreference: Color | null;
  colorPreferenceLevel: ColorPreference | null;
}

export function getColorPreference(colorHistory: Color[]): ColorState {
  const white = colorHistory.filter(item => item === Color.WHITE).length;
  const black = colorHistory.filter(item => item === Color.BLACK).length;
  let diff = Math.abs(white - black);

  const lastPlayedColor = getLastPlayedColor(colorHistory);

  const lastTwoColors = getLastTwoColors(colorHistory);
  const lastTwoColorsAreSame = (lastTwoColors) ? lastTwoColors[0] === lastTwoColors[1] : false;

  if (diff === 0) return { 
    colorPreference: lastPlayedColor ? getOppositeColor(lastPlayedColor) : null,
    colorPreferenceLevel: ColorPreference.LOW,
  }

  // If last two colors are same, then override diff to absolute (FIDE C04.1 g)
  if (lastTwoColorsAreSame) diff = ColorPreference.ABSOLUTE;

  return {
    colorPreference: (white > black) ? Color.BLACK : Color.WHITE,
    colorPreferenceLevel: diff as ColorPreference,
  }
}

/**
 * Returns last played color for a Player
 * Returns null if none was played
 * Passes if BYE
 * 
 * @param items Item[]
 * @returns Color | null
 */
export function getLastPlayedColor(items: Color[]): Color | null {
  if (items.length === 0) return null;
  items = items.reverse();

  for (let index = 0; index < items.length; index++) {
    if (items[index] !== Color.BYE) return items[index] as Color;
  }
  return null;
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
  if (items.length < 2) return null;

  let colors = [];
  for (let index = 0; index < items.length; index++) {
    if (items[index] !== Color.BYE) colors.push(items[index] as Color);
    if (colors.length === 2) return colors;
  }

  return null
}