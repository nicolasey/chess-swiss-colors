export enum Color {
  WHITE = "W",
  BLACK = "B",
  BYE = "BYE",
}

export function getOppositeColor(color: Color): Color {
  if (color === Color.BYE) return Color.BYE;
  return (color === Color.WHITE) ? Color.BLACK : Color.WHITE;
}
