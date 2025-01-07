import type { ColorDiff } from "./colors";
import { Color } from "./color.enum";

/**
 * Return first line with a difference, from PlayerCard histories
 * Returns null if history is the same
 * 
 * @param playerOneHistory Item[]
 * @param playerTwoHistory Item[]
 * @returns ColorDiff | null
 */
export function evaluateColorHistory(playerOneHistory: Color[], playerTwoHistory: Color[]): ColorDiff | null {
  playerOneHistory.reverse();
  playerTwoHistory.reverse();

  // @todo check if BYE counts in history eval
  playerOneHistory = eliminateByesFromHistory(playerOneHistory);
  playerTwoHistory = eliminateByesFromHistory(playerTwoHistory);

  const colorsLength = Math.min(playerOneHistory.length, playerTwoHistory.length);
  for (let i = 0; i < colorsLength; i++) {
    if (playerOneHistory[i] !== playerTwoHistory[i]) {
      return {
        roundAgo: i,
        roundNb: colorsLength - i,
        one: playerOneHistory[i],
        two: playerTwoHistory[i],
      }
    }
  }

  // If no diff, returns null
  return null;
}

export function eliminateByesFromHistory(history: Color[]): Color[] {
  let withoutByes: Color[] = [];
  history.map(color => {
    if (color !== Color.BYE) withoutByes.push(color)
  });
  return withoutByes;
}
