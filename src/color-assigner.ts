import type {
  PlayerColorState,
  ColorAssignment,
  ColorDiff,
} from "../colors.types";
import { ColorPreference } from "./color-preference.enum";
import { Color, getOppositeColor } from "./color.enum";
import { evaluateColorHistory } from "./color-compare";

/**
 * Give a pair proper colors
 *
 * @param playerOne PlayerColorState
 * @param playerTwo PlayerColorState
 * @param randomColor Color | the initial-colour drawn before round 1
 * @returns ColorAssignment
 */
export function assignColors(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
  randomColor: Color,
): ColorAssignment {
  const hasSamePreference =
    playerOne.colorPreference === playerTwo.colorPreference;
  const hasSameLevel =
    playerOne.colorPreferenceLevel === playerTwo.colorPreferenceLevel;
  const oneHasNoPreference = playerOne.colorPreference === Color.BYE;
  const twoHasNoPreference = playerTwo.colorPreference === Color.BYE;

  // 5.2.5 — neither has ever played, so neither has anything to grant
  if (oneHasNoPreference && twoHasNoPreference)
    return assignColorNoPref(playerOne, playerTwo, randomColor);

  // 1.7.4 — exactly one has no preference: the other's is granted outright
  if (oneHasNoPreference) return grantPreferenceOf(playerTwo, playerOne);
  if (twoHasNoPreference) return grantPreferenceOf(playerOne, playerTwo);

  if (!hasSamePreference) return assignColorDiffPref(playerOne, playerTwo); // E1
  if (hasSamePreference && !hasSameLevel)
    return assignColorsMostAsked(playerOne, playerTwo); // 5.2.2, first clause

  // 5.2.2, second clause. Levels are equal here, so testing one is enough.
  if (playerOne.colorPreferenceLevel === ColorPreference.ABSOLUTE) {
    const byWiderDifference = assignByWiderDifference(playerOne, playerTwo);
    if (byWiderDifference !== null) return byWiderDifference;
  }

  // If same preference, and same level, then we compare color history
  const compare = evaluateColorHistory(playerOne.history, playerTwo.history);

  // If compare detects a difference in thoseplayers color history, then use diff to assign colors
  if (compare !== null) return assignWithCompare(playerOne, playerTwo, compare);

  // finally, if everything is === then give expected color to player with highest (score, pairingNb) as fallback
  return giveColorToHighestPlayer(playerOne, playerTwo);
}

/**
 * FIDE C.04.1 (f)
 * The higher ranked player of a pair receives the drawn colour when their
 * pairing number is odd, and the opposite colour when it is even.
 */
function assignColorNoPref(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
  randomColor: Color,
): ColorAssignment {
  if (!playerOne.pairingNb || !playerTwo.pairingNb) {
    throw new Error("Pairing numbers required !");
  }

  const oneIsHigherRanked = playerOne.pairingNb < playerTwo.pairingNb;
  const higher = oneIsHigherRanked ? playerOne : playerTwo;
  const lower = oneIsHigherRanked ? playerTwo : playerOne;

  const higherGets = isEven(higher.pairingNb)
    ? getOppositeColor(randomColor)
    : randomColor;

  return higherGets === Color.WHITE
    ? { white: higher.playerId, black: lower.playerId }
    : { white: lower.playerId, black: higher.playerId };
}

/**
 * FIDE C.04.3 art. 1.7.4
 * A player who has played no games has no colour preference, and the preference
 * of their opponent is granted. Reached only when exactly one of the pair has
 * none: `assignColors` sends the both-have-none case to art. 5.2.5 first.
 *
 * @param player PlayerColorState the one holding the preference
 * @param opponent PlayerColorState the one without
 * @returns ColorAssignment
 */
function grantPreferenceOf(
  player: PlayerColorState,
  opponent: PlayerColorState,
): ColorAssignment {
  return player.colorPreference === Color.WHITE
    ? { white: player.playerId, black: opponent.playerId }
    : { white: opponent.playerId, black: player.playerId };
}

function assignColorDiffPref(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
): ColorAssignment {
  return playerOne.colorPreference === Color.BLACK
    ? { white: playerTwo.playerId, black: playerOne.playerId }
    : { white: playerOne.playerId, black: playerTwo.playerId };
}

function assignColorsMostAsked(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
): ColorAssignment {
  const oneIsPrior =
    playerOne.colorPreferenceLevel > playerTwo.colorPreferenceLevel;
  return oneIsPrior
    ? {
        white:
          playerOne.colorPreference === Color.WHITE
            ? playerOne.playerId
            : playerTwo.playerId,
        black:
          playerOne.colorPreference === Color.WHITE
            ? playerTwo.playerId
            : playerOne.playerId,
      }
    : {
        white:
          playerTwo.colorPreference === Color.WHITE
            ? playerTwo.playerId
            : playerOne.playerId,
        black:
          playerTwo.colorPreference === Color.WHITE
            ? playerOne.playerId
            : playerTwo.playerId,
      };
}

/**
 * FIDE C.04.3 art. 5.2.2, second clause
 * Both players hold the same absolute preference, so their colour differences
 * share a sign and only the magnitude separates them: the wider one takes the
 * colour. [C3] permits such a pair for topscorers only.
 *
 * Returns null when the magnitudes are equal, which leaves art. 5.2.3 to
 * decide. That is the common outcome rather than the exception: C.04.1 r6 caps
 * the difference at ±2, so a preference absolute *because of* the difference is
 * always exactly ±2. The clause separates players only when one of them is
 * absolute through the two-in-a-row trigger at a smaller difference.
 *
 * @param playerOne PlayerColorState
 * @param playerTwo PlayerColorState
 * @returns ColorAssignment | null
 */
function assignByWiderDifference(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
): ColorAssignment | null {
  const oneWidth = Math.abs(playerOne.colorDifference);
  const twoWidth = Math.abs(playerTwo.colorDifference);

  if (oneWidth === twoWidth) return null;

  const wider = oneWidth > twoWidth ? playerOne : playerTwo;
  const other = wider === playerOne ? playerTwo : playerOne;

  return wider.colorPreference === Color.WHITE
    ? { white: wider.playerId, black: other.playerId }
    : { white: other.playerId, black: wider.playerId };
}

function isEven(integer: number): boolean {
  return integer % 2 === 0;
}

/**
 * Affect colors depending on Player rank
 *
 * @param playerOne PlayerColorState
 * @param playerTwo PlayerColorState
 * @returns ColorAssignment
 */
function giveColorToHighestPlayer(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
): ColorAssignment {
  // Sort players by score and pairingNb, identify first
  const highRankPlayer: PlayerColorState = [playerOne, playerTwo].sort(
    (a, b) => b.score - a.score || a.pairingNb - b.pairingNb,
  )[0];

  const isPlayerOne = highRankPlayer.playerId === playerOne.playerId;

  /**
   * We return color expected from highRankPlayer, depending on what player it is
   */
  return isPlayerOne
    ? {
        white:
          playerOne.colorPreference === Color.WHITE
            ? playerOne.playerId
            : playerTwo.playerId,
        black:
          playerOne.colorPreference === Color.WHITE
            ? playerTwo.playerId
            : playerOne.playerId,
      }
    : {
        white:
          playerTwo.colorPreference === Color.BLACK
            ? playerOne.playerId
            : playerTwo.playerId,
        black:
          playerTwo.colorPreference === Color.BLACK
            ? playerTwo.playerId
            : playerOne.playerId,
      };
}

function assignWithCompare(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
  compare: ColorDiff,
): ColorAssignment {
  return {
    white:
      compare.one === Color.BLACK ? playerOne.playerId : playerTwo.playerId,
    black:
      compare.one === Color.BLACK ? playerTwo.playerId : playerOne.playerId,
  };
}
