import type { PlayerColorState } from "../colors.types";

/**
 * FIDE C.04.3 art. 1.8
 * A topscorer is a player whose score is strictly above 50% of the maximum
 * possible — that is, more than half the rounds played so far.
 *
 * Art. 1.8 also bounds the status to the pairing of the **final** round, and
 * this predicate cannot check that: the package has no round counter and cannot
 * infer one, since history.length counts a player's rounds rather than the
 * tournament's. It answers the score half of the definition only. The round
 * half is the caller's, and is declared by setting
 * PlayerColorState.isFinalRoundTopscorer — the flag isColorCompatible reads.
 *
 * Assumes history includes forfeits and byes, so its length is rounds played,
 * and that a win is worth one point. Neither is checked.
 *
 * @param player PlayerColorState
 * @returns boolean
 */
export function isTopscorer(player: PlayerColorState): boolean {
  const half = player.history.length / 2;
  return player.score > half;
}
