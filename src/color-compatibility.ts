import { ColorPreference } from "./color-preference.enum";
import type { PlayerColorState } from "../colors.types";

/**
 * Two players are compatible if both have not: same color preference AND absolute preference level
 * 
 * @param playerOne PlayerColorState
 * @param playerTwo PlayerColorState
 * @returns boolean
 */
export function isColorCompatible(playerOne: PlayerColorState, playerTwo: PlayerColorState): boolean {
  const incompatibleIf = (playerOne.colorPreferenceLevel === ColorPreference.ABSOLUTE)
    && (playerTwo.colorPreferenceLevel === ColorPreference.ABSOLUTE)
    && (playerOne.colorPreference === playerTwo.colorPreference);
  return !incompatibleIf;
}