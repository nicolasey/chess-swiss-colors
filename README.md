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
// → { colorPreference: Color.BLACK, colorPreferenceLevel: ColorPreference.STRONG,
//     colorDifference: 1 }
const bobState = getColorPreference(bobHistory);
// → { colorPreference: Color.WHITE, colorPreferenceLevel: ColorPreference.STRONG,
//     colorDifference: -1 }

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

## Upgrading to 0.3.0

Breaking, all mechanical. No behaviour you were relying on changes silently.

| Before | After | Why |
|---|---|---|
| `ColorPreference.LOW` | `ColorPreference.MILD` | art. 1.7.3's own word |
| `ColorPreference.HIGH` | `ColorPreference.STRONG` | art. 1.7.2's own word |
| `ColorPreference.OFF_GRID` | *(removed)* | had no FIDE counterpart and was never derived; use `isFinalRoundTopscorer` |
| `isTopPlayer(player)` | `isTopscorer(player)` | art. 1.8's own word |
| `ColorState` had two fields | now three | `colorDifference` is required |

The enum's numeric values are unchanged, so `MILD`/`STRONG`/`ABSOLUTE` still
compare by strength and anything persisted as a number still reads back the same.

`ColorState` gaining `colorDifference` only affects states you build by hand;
anything coming out of `getColorPreference` carries it already. Art. 5.2.2's
second clause needs the signed value, and no cap on the level can stand in for it.

One behaviour changed: step 5 of `assignColors` used to compare
`Math.abs(colorDifference)`. It compares the deficit now. Same answer whenever
the two players sit on the same side of balance — which is every pair whose
preference is absolute *because of* the difference — and the correct one when
they do not.

## API

### `getColorPreference(history: Color[]): ColorState`

Turns a color history into a preference and its strength.

Checked in this order — the two absolute triggers are alternatives, so a
balanced history can still be absolute (art. 1.7.1):

| History | Result |
|---|---|
| Same color in the two latest games played | **opposite of that color, `ABSOLUTE`** |
| Balanced, last game played | opposite of last color, `MILD` |
| Balanced, no game played | `Color.BYE` — no preference, `MILD` |
| Diff of 1 | minority color, `STRONG` |
| Diff of 2+ | minority color, `ABSOLUTE` |

The level names are FIDE's own (art. 1.7.1-1.7.3: absolute, strong, mild).

All three fields are returned, and none is derivable from the others. The two
absolute triggers are alternatives, so `ABSOLUTE` says nothing about the size of
`colorDifference`: `[W,B,W,W,B,B]` is balanced at `0` and absolute for White,
while `[W,B,W,B]` is balanced at `0` and only mild. `colorDifference` is signed
per art. 1.6 — White games minus Black — so a preference for White comes with a
negative one, and that sign is what `assignColors` step 5 needs.

### `assignColors(playerOne, playerTwo, randomColor): ColorAssignment`

Returns `{ white: PlayerId, black: PlayerId }`. Resolution order:

1. Neither player has a preference → higher-ranked player gets `randomColor`
   on an odd pairing number, the opposite on an even one (5.2.5).
   Throws if a pairing number is missing or `0`.
2. Exactly one has no preference → the other's is granted (1.7.4).
3. Different preferences → both get what they want (5.2.1).
4. Same preference, different level → the stronger wins (5.2.2).
5. Same preference, both absolute → the wider color difference wins (5.2.2),
   measured *against the color asked for*: a player wanting white is short by
   `-colorDifference`, one wanting black by `+colorDifference`, and the needier
   of the two takes it. Equal deficits fall through to the next rule, which is
   the common case. Reachable only for a pair `isColorCompatible` permits, so
   in practice only when a topscorer is involved.
6. Same preference and level → the most recent game in which the two held
   different colors decides; whoever had black there now gets white (5.2.3).
7. Still tied → higher rank wins: score first, then lowest pairing
   number (5.2.4, ranked per 1.2).

### `isColorCompatible(playerOne, playerTwo): boolean`

`false` when both players have the *same* preference at `ABSOLUTE` level — and
neither is a final-round topscorer (2.1.3 [C3]). Call it before pairing to avoid
building a pair no color assignment can save.

Set `isFinalRoundTopscorer` on a player to lift the prohibition. One topscorer
in the pair is enough; the colors are then decided by the wider color difference
(step 5 above). **This flag means art. 1.8's topscorer — a status that exists
only when pairing the final round.** This package has no round counter and
cannot infer one, so setting it in an earlier round produces pairings FIDE
forbids and nothing here will notice.

### `isTopscorer(player): boolean`

`score > history.length / 2` — art. 1.8's topscorer, above 50% of the maximum
possible. History is assumed to include forfeits and byes, so its length equals
the number of rounds played, and a win is assumed to be worth one point.

It answers the **score** half of art. 1.8 only. The definition also requires
that you are pairing the final round, which this library cannot check — see
`isFinalRoundTopscorer` above. Use this to find your topscorers, then set the
flag yourself.

### `evaluateColorHistory(historyOne, historyTwo): ColorDiff | null`

Most recent first, byes stripped, compared position by position. Returns the
first difference (`{ roundAgo, one, two }`) or `null` if the histories match
over their common length.

### Types & enums

```ts
enum Color { WHITE = "W", BLACK = "B", BYE = "BYE" }
enum ColorPreference { MILD = 0, STRONG = 1, ABSOLUTE = 2 }

type ColorState = {
  colorPreference: Color;
  colorPreferenceLevel: ColorPreference;
  colorDifference: number;    // signed: White games minus Black (art. 1.6)
};

type PlayerColorState = ColorState & {
  playerId: string | number;
  pairingNb: number;             // 1-based, lower = higher ranked
  score: number;
  history: { color: Color }[];   // oldest first
  isFinalRoundTopscorer?: boolean; // art. 1.8; absent means false
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
- **Last-round exceptions are yours to apply.** Combine `isTopscorer` with your
  system's rules to decide who is a topscorer, then set
  `isFinalRoundTopscorer` — that flag is the only thing that lifts [C3].
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
