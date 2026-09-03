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

  // 5.2.1 — preferences differ, so granting one grants the other
  if (!hasSamePreference) return grantPreferenceOf(playerOne, playerTwo);
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

  return award(higherGets, higher, lower);
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
  return award(player.colorPreference, player, opponent);
}

/**
 * The shape every rule in art. 5.2 ends in: one player takes a colour and the
 * opponent takes the other. Only the choice of player and colour differs, so
 * that choice is all each rule above is left holding.
 *
 * @param color Color the one `player` receives
 * @param player PlayerColorState
 * @param opponent PlayerColorState
 * @returns ColorAssignment
 */
function award(
  color: Color,
  player: PlayerColorState,
  opponent: PlayerColorState,
): ColorAssignment {
  return color === Color.WHITE
    ? { white: player.playerId, black: opponent.playerId }
    : { white: opponent.playerId, black: player.playerId };
}

function assignColorsMostAsked(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
): ColorAssignment {
  const oneIsPrior =
    playerOne.colorPreferenceLevel > playerTwo.colorPreferenceLevel;
  const stronger = oneIsPrior ? playerOne : playerTwo;
  const weaker = oneIsPrior ? playerTwo : playerOne;

  return grantPreferenceOf(stronger, weaker);
}

/**
 * FIDE C.04.3 art. 5.2.2, second clause
 * Both players hold the same absolute preference, so only the colour difference
 * separates them: the one further from balance takes the colour it wants.
 *
 * "Wider" is measured against the colour the player is asking for, not as a
 * magnitude. Art. 1.7.1 has two alternative triggers, and the two-in-a-row one
 * fires whatever the difference is — so two players absolute for the same
 * colour need not be on the same side of zero. W,B,B is absolute for White at
 * −1; W,W,B,W,W,B,B is absolute for White at +1, already a game of White to the
 * good. Comparing |−1| with |+1| calls those equal, and comparing |+1| with a
 * balanced |0| hands White to the player who has had more of it.
 *
 * The deficit orients the difference by what the player wants, so more always
 * means needier, and art. 1.6's sign does the work rather than being discarded.
 *
 * Returns null when the deficits are equal, which leaves art. 5.2.3 to decide.
 * That is the common outcome rather than the exception: C.04.1 r6 caps the
 * difference at ±2, so a preference absolute *because of* the difference is
 * always exactly ±2. The clause separates players only when one of them is
 * absolute through the two-in-a-row trigger at some other difference.
 *
 * @param playerOne PlayerColorState
 * @param playerTwo PlayerColorState
 * @returns ColorAssignment | null
 */
function assignByWiderDifference(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
): ColorAssignment | null {
  const oneDeficit = deficitOfPreferredColor(playerOne);
  const twoDeficit = deficitOfPreferredColor(playerTwo);

  if (oneDeficit === twoDeficit) return null;

  const wider = oneDeficit > twoDeficit ? playerOne : playerTwo;
  const other = wider === playerOne ? playerTwo : playerOne;

  return grantPreferenceOf(wider, other);
}

/**
 * How many games short of balance the player is *in the colour they want*.
 *
 * Art. 1.6 makes the colour difference White minus Black, so a player wanting
 * White is short by −colorDifference and one wanting Black by +colorDifference.
 * Positive means owed that colour, negative means already over-supplied.
 *
 * Only comparable between players who want the same colour, which is the only
 * place art. 5.2.2's second clause is reached.
 */
function deficitOfPreferredColor(player: PlayerColorState): number {
  return player.colorPreference === Color.WHITE
    ? -player.colorDifference
    : player.colorDifference;
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

  const lowRankPlayer =
    highRankPlayer.playerId === playerOne.playerId ? playerTwo : playerOne;

  return grantPreferenceOf(highRankPlayer, lowRankPlayer);
}

function assignWithCompare(
  playerOne: PlayerColorState,
  playerTwo: PlayerColorState,
  compare: ColorDiff,
): ColorAssignment {
  // playerOne takes the opposite of the colour they held at that game
  return award(getOppositeColor(compare.one), playerOne, playerTwo);
}
