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

Checked in this order — the two absolute triggers are alternatives, so a
balanced history can still be absolute (art. 1.7.1):

| History | Result |
|---|---|
| Same color in the two latest games played | **opposite of that color, `ABSOLUTE`** |
| Balanced, last game played | opposite of last color, `LOW` |
| Balanced, no game played | `Color.BYE` — no preference, `LOW` |
| Diff of 1 | minority color, `HIGH` |
| Diff of 2+ | minority color, `ABSOLUTE` |

`OFF_GRID` is never derived here — set it yourself when a system grants a
last-round exception to a top player.

### `assignColors(playerOne, playerTwo, randomColor): ColorAssignment`

Returns `{ white: PlayerId, black: PlayerId }`. Resolution order:

1. Neither player has a preference → higher-ranked player gets `randomColor`
   on an odd pairing number, the opposite on an even one (5.2.5).
   Throws if a pairing number is missing or `0`.
2. Exactly one has no preference → the other's is granted (1.7.4).
3. Different preferences → both get what they want (5.2.1).
4. Same preference, different level → the stronger wins (5.2.2).
5. Same preference and level → the most recent game in which the two held
   different colors decides; whoever had black there now gets white (5.2.3).
6. Still tied → higher rank wins: score first, then lowest pairing
   number (5.2.4, ranked per 1.2).

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
- **`Color.BYE` covers every unplayed round** — byes, forfeits, absences. FIDE
  needs no distinction between them for color: only games played count.
- **`assignColors` recommends, it does not decide.** This package computes
  colors for a Swiss engine that owns the pairing, so it answers for any pair it
  is given — including one FIDE forbids — and never refuses on rule grounds.
  Screen with `isColorCompatible` first; only your engine can act on an
  incompatibility, by building a different pair.

## Rules

[docs/fide-colour-rules.md](docs/fide-colour-rules.md) maps every rule in
C.04.1 and C.04.3 (as revised 1 February 2026) to a testable expectation with a
stable ID, and records which are covered and which are not.

## Tests

```bash
bun test
```

Every rule ID in the doc must be cited somewhere under `tests/`, or the suite
fails. To check that the rules are *defended* rather than merely mentioned:

```bash
./scripts/mutation-check.sh
```

It breaks each rule in `src/` in turn and confirms a test notices.

## License

MIT
