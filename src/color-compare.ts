import type { ColorDiff, ColorHistoryContract } from "../colors.types";
import { Color } from "./color.enum";

/**
 * Return first line with a difference, from PlayerCard histories
 * Returns null if history is the same
 *
 * @param playerOneHistory Item[]
 * @param playerTwoHistory Item[]
 * @returns ColorDiff | null
 */
export function evaluateColorHistory(
  playerOneHistory: ColorHistoryContract[],
  playerTwoHistory: ColorHistoryContract[],
): ColorDiff | null {
  // @todo check if BYE counts in history eval
  const oneColors = eliminateByesFromHistory(
    [...playerOneHistory].reverse().map((h) => h.color),
  );
  const twoColors = eliminateByesFromHistory(
    [...playerTwoHistory].reverse().map((h) => h.color),
  );

  const colorsLength = Math.min(oneColors.length, twoColors.length);
  for (let i = 0; i < colorsLength; i++) {
    if (oneColors[i] !== twoColors[i]) {
      return {
        roundAgo: i,
        one: oneColors[i],
        two: twoColors[i],
      };
    }
  }

  // If no diff, returns null
  return null;
}

export function eliminateByesFromHistory(history: Color[]): Color[] {
  let withoutByes: Color[] = [];
  history.map((color) => {
    if (color !== Color.BYE) withoutByes.push(color);
  });
  return withoutByes;
}
