# Spec — topscorer exemption

Closes the last colour-rule gap: [#5](https://github.com/nicolasey/chess-swiss-colors/issues/5), expectations **PC-4** and **CA-4** in
[fide-colour-rules.md](fide-colour-rules.md).

Status: **draft — one blocking question in §3.**

## 1. What this delivers

FIDE forbids two players with the same absolute colour preference from meeting,
*except* when they are topscorers. That exception is how a final round can pair
the leaders at all. Permitting the pair is only half the job: something then has
to choose colours for a pair in which both players urgently need the same one,
and art. 5.2.2's wider-difference clause is that something.

So PC-4 and CA-4 ship together. Delivering the exemption without the tiebreak
would permit a pair the assigner cannot reason about.

## 2. The rules

| Art. | Rule |
|---|---|
| 1.8 | Topscorers are players with more than 50% of the maximum possible score, **when pairing the final round** |
| 2.1.3 [C3] | Non-topscorers with the same absolute colour preference shall not meet |
| 5.2.2 | Grant the stronger preference. If both are absolute, grant the **wider colour difference** |
| 1.6 | Colour difference = games played White minus games played Black |
| C.04.1 r6, r7 | The ±2 bound and the no-three-in-a-row bound, each with: *every pairing system may make exceptions in the last round* |

The r6/r7 escape clauses are load-bearing here. A permitted topscorer pair
*will* push someone past ±2 or into a third consecutive colour — that is the
point of the exception, not a defect in it.

## 3. Blocking question

[C3]'s subject is plural: *non-topscorers* shall not meet. Two readings:

- **(a) Both must be non-topscorers** for the prohibition to apply — so it lifts
  as soon as *either* player is a topscorer.
- **(b) Either being a non-topscorer** keeps the prohibition — so it lifts only
  when *both* are topscorers.

(a) is the literal reading. (b) is the conservative one. They differ only for a
mixed pair, which in a final-round top bracket is common, so this is not
academic.

**Resolve against a reference implementation (JaVaFo or Vega) before coding.**
Everything below is written for (a) and is a one-line change if it turns out to
be (b).

## 4. Who decides that a player is a topscorer

**The caller does.** Art. 1.8 depends on two things this library cannot see:
whether this is the final round, and what the maximum possible score is — which
varies with the scoring system and with how unplayed rounds are counted.
`isTopPlayer` guesses both, assuming `history.length` is rounds played and a win
is worth 1.

This matches the boundary already settled for PC-5: the engine owns
pairing-level facts, this package computes colours. `isTopPlayer` stays exported
as a helper for engines whose assumptions match it, and stops being the source
of truth for a decision it cannot reliably make.

## 5. Design

### 5.1 Types

```ts
export type ColorState = {
  colorPreference: Color;
  colorPreferenceLevel: ColorPreference;
  colorDifference: number;   // NEW — signed, art. 1.6: White games minus Black
};

export type PlayerColorState = ColorState & {
  playerId: PlayerId;
  pairingNb: number;
  score: number;
  history: ColorHistoryContract[];
  isTopscorer?: boolean;     // NEW — optional, absent means false
};
```

`colorDifference` is **signed**, per art. 1.6 — a White preference goes with a
negative difference. `getColorPreference` already computes `white` and `black`
and throws the signed value away at `Math.abs`; it just stops doing that.

`isTopscorer` is optional so the change is additive for callers who never pair a
final round. Absent means non-topscorer, which keeps the prohibition in force —
the safe default, since the failure mode is a refused legal pairing rather than
an illegal one.

### 5.2 `ColorPreference.OFF_GRID` is removed

It has no FIDE counterpart. It was invented as a level above `ABSOLUTE` to mark
the last-round exception, and nothing has ever produced it. The exception is
properly expressed by `isTopscorer` plus `colorDifference`, so the enum member
becomes dead weight that invites a caller to invent semantics for it.

### 5.3 `isColorCompatible`

```ts
export function isColorCompatible(one, two): boolean {
  const sameAbsolutePreference =
    one.colorPreferenceLevel === ColorPreference.ABSOLUTE &&
    two.colorPreferenceLevel === ColorPreference.ABSOLUTE &&
    one.colorPreference === two.colorPreference;

  if (!sameAbsolutePreference) return true;

  // art. 2.1.3 [C3] — the prohibition names non-topscorers. Reading (a).
  return Boolean(one.isTopscorer || two.isTopscorer);
}
```

Signature unchanged. Existing callers keep their behaviour exactly, because
`isTopscorer` defaults to absent.

### 5.4 `assignColors` — art. 5.2.2, second clause

The resolution order gains one step. Today 5.2.2 is reached only when the levels
*differ*; the tiebreak applies when they are the same and both absolute:

```
1.7.4   one player has no preference          → grant the other's
5.2.1   preferences differ                     → grant both
5.2.2a  same preference, different level       → grant the stronger
5.2.2b  same preference, both ABSOLUTE         → grant the wider difference   ← NEW
5.2.3   otherwise                              → alternate from the differing game
5.2.4   otherwise                              → higher ranked
```

```ts
/**
 * FIDE C.04.3 art. 5.2.2, second clause. Both players want the same colour and
 * want it absolutely, so their differences share a sign; the wider magnitude
 * takes the colour. Returns null when they are equal, leaving 5.2.3 to decide.
 */
function assignByWiderDifference(one, two): ColorAssignment | null {
  const oneWidth = Math.abs(one.colorDifference);
  const twoWidth = Math.abs(two.colorDifference);
  if (oneWidth === twoWidth) return null;
  const winner = oneWidth > twoWidth ? one : two;
  const loser = winner === one ? two : one;
  return winner.colorPreference === Color.WHITE
    ? { white: winner.playerId, black: loser.playerId }
    : { white: loser.playerId, black: winner.playerId };
}
```

**This clause discriminates less often than it looks, and for a non-obvious
reason.** r6 caps the difference at ±2, so an absolute preference *derived from
the difference* always means exactly ±2 — two such players always tie, and fall
through to 5.2.3. The clause only separates players when one of them is absolute
via the **two-in-a-row** trigger at a smaller difference:

| Player | History | Absolute White because | Difference | Gets |
|---|---|---|---|---|
| A | `W,B,B` | two Blacks in a row | −1 | Black |
| B | `B,B,W,B` | difference reached −2 | −2 | **White** |

Both histories are legal and both yield `{ W, ABSOLUTE }` today; only the
magnitude tells them apart, and that is the number `ColorState` currently
discards.

The tie path is therefore the common one, not the exotic one. Test it first.

## 6. Expectations

| ID | Rule | Expected behaviour |
|---|---|---|
| PC-4 | 2.1.3 | Same absolute preference, at least one topscorer → **compatible** |
| PC-4 | 2.1.3 | Same absolute preference, neither a topscorer → **incompatible** (unchanged) |
| PC-4 | 2.1.3 | `isTopscorer` absent behaves exactly as `false` |
| CA-4 | 5.2.2 | Both absolute, same preference, differences −2 vs −1 → the −2 player gets White |
| CA-4 | 5.2.2 | Differences equal → falls through to 5.2.3, then 5.2.4 |
| CA-4 | — | Order independence holds on both paths (CA-8) |
| OUT-1/2 | C.04.1 r6/r7 | A permitted topscorer pair **may** breach ±2 or three-in-a-row; every other pair may not |

## 7. Knock-on: the outcome sweep

`OUT-1/OUT-2` currently assert that no pair the library calls compatible ever
receives an illegal colour. Once topscorer pairs become compatible that
assertion is false *by design*, and the sweep would fail for the right reason —
which is the worst kind of red.

The sweep must partition instead of skipping: pairs permitted only by the
topscorer exemption are checked against a relaxed bound (a well-formed
assignment, both players distinct), everything else against r6/r7 as today. A
plain `continue` would silently drop the exempt pairs from coverage.

## 8. Migration

Breaking, and deliberately taken now: the package is 0.x and not yet on npm, so
the cost is near zero today and permanent the day it publishes.

- Callers building `ColorState` by hand must add `colorDifference`. Callers using
  `getColorPreference` get it for free.
- `ColorPreference.OFF_GRID` is removed; nothing can be relying on it, since
  nothing ever produced it.
- Ship as `0.3.0`, and put both changes in the README's API section.

## 9. Test plan

- Tests cite `PC-4:` and `CA-4:` so the citation gate in
  `tests/fide-invariants.test.ts` goes green on 28/28.
- `scripts/mutation-check.sh` gains two cases, and both must be **caught**:
  - `2.1.3 topscorer exemption` — force the exemption always on
  - `5.2.2b wider difference` — invert the comparison
- The equal-difference fall-through needs a test that would fail if it returned
  an assignment instead of `null` — otherwise 5.2.3 stops being reachable from
  this path and its own coverage quietly degrades.
- Rule IDs are matched by `\b(?:CP|CA|PC|TS|OUT)-\d\b`. That regex stops at one
  digit; widen it before adding a tenth ID in any family.

## 10. Out of scope

The pairing engine. This package recommends colours (PC-5); score brackets,
floaters, the [C1]–[C19] criteria and bye allocation belong to the consumer.
`isTopPlayer` remains a helper, not a decision-maker.
