# chess-colors

[![Test](https://github.com/nicolasey/chess-swiss-colors/actions/workflows/test.yml/badge.svg)](https://github.com/nicolasey/chess-swiss-colors/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript&logoColor=white)](tsconfig.json)
[![Bun](https://img.shields.io/badge/Bun-tested-000000.svg?logo=bun&logoColor=white)](https://bun.sh)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)

Color assignment for Swiss-system chess pairings, following the FIDE rules (C.04.1).
Zero dependencies, TypeScript, works with any pairing engine: you own the pairing,
this library only decides who gets white.

## Install

```bash
bun add @nicolasey/chess-colors
```

```bash
npm install @nicolasey/chess-colors
```

## Quick start

```ts
import { getColorPreference, assignColors, Color } from "@nicolasey/chess-colors";

const aliceHistory = [Color.WHITE, Color.BLACK, Color.WHITE];
const bobHistory = [Color.BLACK, Color.WHITE, Color.BLACK];

// 1. Derive each player's color state from their color history
const aliceState = getColorPreference(aliceHistory);
// → { colorPreference: Color.BLACK, colorPreferenceLevel: ColorPreference.HIGH }
const bobState = getColorPreference(bobHistory);
// → { colorPreference: Color.WHITE, colorPreferenceLevel: ColorPreference.HIGH }

// 2. Assign colors to a pair
assignColors(
  {
    playerId: "alice",
    pairingNb: 1,
    score: 2,
    history: aliceHistory.map((color) => ({ color })),
    ...aliceState,
  },
  {
    playerId: "bob",
    pairingNb: 8,
    score: 2,
    history: bobHistory.map((color) => ({ color })),
    ...bobState,
  },
  randomColor, // the color drawn by the arbiter before round 1
);
// → { white: "bob", black: "alice" }
```

## API

### `getColorPreference(history: Color[]): ColorState`

Turns a color history into a preference and its strength.

| History | Result |
|---|---|
| Balanced, last game played | opposite of last color, `LOW` |
| Balanced, no game played | `Color.BYE`, `LOW` |
| Diff of 1 | minority color, `HIGH` |
| Diff of 2+ | minority color, `ABSOLUTE` |
| Same color twice in a row | minority color, `ABSOLUTE` (C.04.1 g) |

`OFF_GRID` is never derived here — set it yourself when a system grants a
last-round exception to a top player.

### `assignColors(playerOne, playerTwo, randomColor): ColorAssignment`

Returns `{ white: PlayerId, black: PlayerId }`. Resolution order:

1. Neither player has a preference → higher-ranked player gets `randomColor`
   on an odd pairing number, the opposite on an even one (C.04.1 f).
   Throws if a pairing number is missing or `0`.
2. Different preferences → both get what they want (E.1).
3. Same preference, different level → the stronger preference wins (E.2).
4. Same preference and level → most recent differing color in their histories
   decides; whoever had black more recently gets white.
5. Still tied → higher rank wins (score, then lowest pairing number).

### `isColorCompatible(playerOne, playerTwo): boolean`

`false` only when both players have the *same* preference at `ABSOLUTE` level.
Call it before pairing to avoid building a pair no color assignment can save.

### `isTopPlayer(player): boolean`

`score > history.length / 2`. History is assumed to include forfeits, so its
length equals the number of rounds played. Used to decide who may bypass an
absolute preference in the last round.

### `evaluateColorHistory(historyOne, historyTwo): ColorDiff | null`

Most recent first, byes stripped, compared position by position. Returns the
first difference (`{ roundAgo, one, two }`) or `null` if the histories match
over their common length.

### Types & enums

```ts
enum Color { WHITE = "W", BLACK = "B", BYE = "BYE" }
enum ColorPreference { LOW = 0, HIGH = 1, ABSOLUTE = 2, OFF_GRID = 3 }

type ColorState = { colorPreference: Color; colorPreferenceLevel: ColorPreference };

type PlayerColorState = ColorState & {
  playerId: string | number;
  pairingNb: number;          // 1-based, lower = higher ranked
  score: number;
  history: { color: Color }[]; // oldest first
};
```

Also exported: `getOppositeColor`, `getLastPlayedColor`, `getLastTwoColors`,
`eliminateByesFromHistory`.

## Notes for implementers

- **History is oldest-first.** Byes may be present; they are stripped where the
  rules require it.
- **The random color is physical.** FIDE requires the higher-ranked player to
  draw a color before round 1. Your software should ask the arbiter for it at
  tournament start and pass the same value to every `assignColors` call.
- **Last-round exceptions are yours to apply.** This library never sets
  `OFF_GRID` on its own; combine `isTopPlayer` with your system's rules.

## Tests

```bash
bun test
```

## License

MIT
