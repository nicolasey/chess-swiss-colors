import type { PlayerColorState, ColorAssignment } from "./colors";
import { ColorPreference } from "./color-preference.enum";
import { Color } from "./color.enum";

/**
 * Give a pair proper colors
 * 
 * @param playerOne string|number
 * @param playerTwo Card
 * @param randomColor Color
 * @param isLastRound boolean (defaults to false) In some systems, absolute color can be bypass if last round && topPlayer
 * @returns ColorAssignment
 */
export function assignColors(playerOne: PlayerColorState, playerTwo: PlayerColorState, randomColor: Color, isLastRound = false) {
  if (!playerOne.pairingNb || !playerTwo.pairingNb) throw new Error("Missing pairing number !");
  
  const hasSamePreference = playerOne.colorPreference === playerTwo.colorPreference;
  const hasSameLevel = playerOne.colorPreferenceLevel === playerTwo.colorPreferenceLevel;
  const oneHasNoPreference = playerOne.colorPreference === null;
  const oneHasAbsolutePreference = playerOne.colorPreferenceLevel === ColorPreference.ABSOLUTE;

  if (hasSamePreference && oneHasNoPreference) return assignColorNoPref(playerOne, playerTwo, randomColor); // START
  if (!hasSamePreference) return assignColorDiffPref(playerOne, playerTwo); // E1
  if (hasSamePreference && !hasSameLevel) return assignColorsMostAsked(playerOne, playerTwo); // E2

  // @todo samePref sameLevel cases
  // find a diff in color history and assign colors using this
  // skip byes as if it does not even exist
  // if === then give expected color to player with highest (score, pairingNb)
}

function assignColorNoPref(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
  randomColor: Color) {
  /**
   * Check if pairing numbers are set
   */
  if (!playerOne.pairingNb || !playerTwo.pairingNb) {
    throw new Error("Pairing numbers required !")
  }

  const oneIsHigherRanked = (playerOne.pairingNb < playerTwo.pairingNb);
  const oneIsEven = isEven(playerOne.pairingNb);
  const twoIsEven = isEven(playerTwo.pairingNb);

  return (oneIsHigherRanked) ?
    { 
      white: (oneIsEven && randomColor === Color.BLACK) ? playerOne : playerTwo,
      black: (oneIsEven && randomColor === Color.BLACK) ? playerTwo : playerOne,
    } : { 
      white: (twoIsEven && randomColor === Color.BLACK) ? playerTwo : playerOne,
      black: (twoIsEven && randomColor === Color.BLACK) ? playerOne : playerTwo,
    };
}

function assignColorDiffPref(playerOne: PlayerColorState, playerTwo: PlayerColorState): ColorAssignment {
  return (playerOne.colorPreference === Color.BLACK) ?
    { white: playerTwo.playerId, black: playerOne.playerId } : 
    { white: playerOne.playerId, black: playerTwo.playerId };
}

function assignColorsMostAsked(playerOne: PlayerColorState, playerTwo: PlayerColorState): ColorAssignment {
  const oneIsPrior = playerOne.colorPreferenceLevel > playerTwo.colorPreferenceLevel;
  return (oneIsPrior) ? 
    {
      white: (playerOne.colorPreference === Color.WHITE) ? playerOne.playerId : playerTwo.playerId,
      black: (playerOne.colorPreference === Color.WHITE) ? playerTwo.playerId : playerOne.playerId,
    } : {
      white: (playerTwo.colorPreference === Color.WHITE) ? playerTwo.playerId : playerOne.playerId,
      black: (playerTwo.colorPreference === Color.WHITE) ? playerOne.playerId : playerTwo.playerId,
    }
}

function isEven(integer: number) {
  return integer % 2 === 0
}