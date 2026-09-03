import { ColorPreference } from "./color-preference.enum";
import type { PlayerColorState } from "../colors.types";

/**
 * FIDE C.04.3 art. 2.1.3 [C3]
 * Two players holding the same absolute colour preference may not be paired —
 * unless one of them is a final-round topscorer. The rule's subject is
 * *non*-topscorers, so a single topscorer in the pair puts it outside the
 * prohibition entirely, which is how a final round pairs its leaders at all.
 *
 * The colours for such a pair are then decided by art. 5.2.2's wider-difference
 * clause. Note this is a pairing constraint, not a colour one: assignColors
 * recommends a colour for any pair it is given and never consults this.
 *
 * @param playerOne PlayerColorState
 * @param playerTwo PlayerColorState
 * @returns boolean
 */
export function isColorCompatible(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
): boolean {
  const sameAbsolutePreference =
    playerOne.colorPreferenceLevel === ColorPreference.ABSOLUTE &&
    playerTwo.colorPreferenceLevel === ColorPreference.ABSOLUTE &&
    playerOne.colorPreference === playerTwo.colorPreference;

  if (!sameAbsolutePreference) return true;

  return Boolean(
    playerOne.isFinalRoundTopscorer || playerTwo.isFinalRoundTopscorer,
  );
}