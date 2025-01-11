import type { PlayerColorState } from "../colors.types";

/**
 * Checks if a Player is a top player
 * 
 * A top player is a Player that have more than half of possible points
 * A top player might be allowed in some systems to bypass color absolute pref IF last round
 * 
 * @param player PlayerColorState
 * @returns boolean
 */
export function isTopPlayer(player: PlayerColorState): boolean {
  const half = (player.roundNb / 2);
  return player.score > half;
}
