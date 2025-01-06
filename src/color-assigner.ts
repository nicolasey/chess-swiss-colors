import type { PlayerColorState, ColorAssignment } from "./colors";
import { ColorPreference } from "./color-preference.enum";
import { Color } from "./color.enum";
import { evaluateColorHistory } from './color-compare';

/**
 * Give a pair proper colors
 * 
 * @param playerOne PlayerColorState
 * @param playerTwo PlayerColorState
 * @param randomColor Color | Color chosen before round 1 as player 1 random start color
 * @param isLastRound boolean (defaults to false) In some systems, absolute color can be bypass if last round && topPlayer
 * @returns ColorAssignment
 */
export function assignColors(playerOne: PlayerColorState, playerTwo: PlayerColorState, randomColor: Color) {
  const hasSamePreference = playerOne.colorPreference === playerTwo.colorPreference;
  const hasSameLevel = playerOne.colorPreferenceLevel === playerTwo.colorPreferenceLevel;
  const oneHasNoPreference = playerOne.colorPreference === null;
  const oneHasAbsolutePreference = playerOne.colorPreferenceLevel === ColorPreference.ABSOLUTE;

  if (hasSamePreference && oneHasNoPreference) return assignColorNoPref(playerOne, playerTwo, randomColor); // START
  if (!hasSamePreference) return assignColorDiffPref(playerOne, playerTwo); // E1
  if (hasSamePreference && !hasSameLevel) return assignColorsMostAsked(playerOne, playerTwo); // E2

  // @todo samePref sameLevel cases
  const compare = evaluateColorHistory(playerOne.colorHistory, playerTwo.colorHistory);

  if (compare !== null) {}
  // find a diff in color history and assign colors using this
  // skip byes as if it does not even exist

  // if === then give expected color to player with highest (score, pairingNb) as fallback
  return giveColorToHighestPlayer(playerOne, playerTwo);
}

function assignColorNoPref(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
  randomColor: Color): ColorAssignment {
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
      white: (oneIsEven && randomColor === Color.BLACK) ? playerOne.playerId : playerTwo.playerId,
      black: (oneIsEven && randomColor === Color.BLACK) ? playerTwo.playerId : playerOne.playerId,
    } : { 
      white: (twoIsEven && randomColor === Color.BLACK) ? playerTwo.playerId : playerOne.playerId,
      black: (twoIsEven && randomColor === Color.BLACK) ? playerOne.playerId : playerTwo.playerId,
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

function isEven(integer: number): boolean {
  return integer % 2 === 0
}

/**
 * Affect colors depending on Player rank
 * 
 * @param playerOne PlayerColorState
 * @param playerTwo PlayerColorState
 * @returns ColorAssignment
 */
function giveColorToHighestPlayer(playerOne: PlayerColorState, playerTwo: PlayerColorState): ColorAssignment {
  // Sort players by score and pairingNb, identify first
  const highRankPlayer: PlayerColorState = [playerOne, playerTwo].sort(
    (a, b) => b.score - a.score || a.pairingNb - b.pairingNb)
    [0];

  const isPlayerOne = (highRankPlayer.playerId === playerOne.playerId);
  
  /**
   * We return color expected from highRankPlayer, depending on what player it is
   */
  return (isPlayerOne) ? {
    white: (playerOne.colorPreference === Color.WHITE) ? playerOne.playerId : playerTwo.playerId,
    black: (playerOne.colorPreference === Color.WHITE) ? playerTwo.playerId : playerOne.playerId,
  } : {
    white: (playerTwo.colorPreference === Color.BLACK) ? playerOne.playerId : playerTwo.playerId,
    black: (playerTwo.colorPreference === Color.BLACK) ? playerTwo.playerId : playerOne.playerId,
  }
}
