# Spec — topscorer exemption

Closes the last colour-rule gap: [#5](https://github.com/nicolasey/chess-swiss-colors/issues/5), expectations **PC-4** and **CA-4** in
[fide-colour-rules.md](fide-colour-rules.md).

Status: **ready to implement.** The question in §3 is resolved.

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
| C.04.1 r6, r7 | The ±2 bound and the no-three-in-a-row bound, each with: *each pairing system may have exceptions to this rule* |

**Where the final round comes in.** The 2026 revision **removed** "in the last
round of a tournament" from the exception clauses of r6 and r7 — the pre-2026
rules f and g carried it, rules 6 and 7 do not. In the current text those
clauses delegate to each system with no temporal condition at all.

The Dutch system's temporal bound is instead carried by art. 1.8, in the
*definition* of topscorer: the status only exists when pairing the **final
round**. So the restriction is structural rather than stated:

```
outside the final round → nobody is a topscorer
                        → [C3] binds everyone
                        → no exempted pair can exist
                        → r6 and r7 hold, with nothing needed to defend them
```

A permitted topscorer pair *will* push someone past ±2 or into a third
consecutive colour. That is the exception working, not a defect — but only in
the final round, and only because art. 1.8 cannot be true anywhere else.

## 3. Resolved — the exemption lifts when *either* player is a topscorer

[C3]'s subject is plural, which left two readings: the prohibition applies only
to a pair of two non-topscorers (a), or it survives while either player is a
non-topscorer (b). They differ exactly for a mixed pair, which is common in a
final-round top bracket.

**Reading (a) is correct.** The prohibition names a pair of non-topscorers; one
topscorer in the pair takes it outside [C3]'s scope entirely. Two independent
confirmations:

- The handbook text itself — [C.04.3 art. 2.1.3](https://handbook.fide.com/chapter/C0403202602),
  read against art. 1.8.
- The Dutch-algorithm literature describes [C3] as relaxed for topscorers and
  their opponents in the last round, not only for topscorer-versus-topscorer
  pairs — see [Biró et al. on pairing mechanisms](https://real.mtak.hu/80729/7/jXaio4T11ygd57-77-86.pdf)
  and [JaVaFo](https://www.rrweb.org/javafo/JaVaFo1.html), the reference
  implementation of C.04.3.

So `isColorCompatible` lifts the prohibition on `one.isFinalRoundTopscorer ||
two.isFinalRoundTopscorer`, as drafted in §5.3. Art. 1.8 also confirms topscorers exist
only when pairing the **final round**, which is why §4 leaves the call to the
caller: nothing in this package knows which round it is.

## 4. Who decides, and why the field is named for the round

**The caller does**, and the first reason is the round number, not the scoring
system. Art. 1.8 depends on two facts this package cannot see:

1. **whether this is the final round** — there is no round counter anywhere in
   the API, and none can be inferred: `history.length` counts a player's rounds,
   not the tournament's remaining ones;
2. what the maximum possible score is, which varies with the scoring system and
   with how unplayed rounds are counted.

`isTopscorer` guesses the second and cannot even attempt the first. It stays
exported as a helper for engines whose assumptions match it, and stops being the
source of truth for a decision it cannot reliably make. This is the boundary
already settled for PC-5: the engine owns pairing-level facts.

### 4.1 The field is `isFinalRoundTopscorer`, not `isTopscorer`

Because the whole temporal bound rides on this one boolean. A caller who sets a
field called `isTopscorer` during round 3 — reading it as "is currently leading"
— gets a [C3]-forbidden pair and an r6/r7 violation in a round where no
exception is permitted. The library cannot detect it: it has no notion of which
round this is.

`isFinalRoundTopscorer` makes the precondition unmissable at the assignment
site, and it is art. 1.8's own vocabulary rather than invented terminology. A
second `finalRound` parameter was considered and rejected: a topscorer *is* a
final-round fact, so it would duplicate the information and create an
incoherent state to arbitrate (`finalRound: false` with the flag set).

**Known limitation, to be recorded in `fide-colour-rules.md`:** no test can
cover this. Correct use of the flag is a caller contract that the library has no
means to verify, and the OUT sweep cannot check it either. Better written down
than left to look covered.

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

  /**
   * NEW — art. 1.8: a topscorer is a player above 50% of the maximum possible
   * score **when pairing the final round**. The status does not exist in any
   * earlier round, and this package has no way to check which round it is:
   * setting this outside the final round produces pairings FIDE forbids, and
   * nothing here will notice. Optional; absent means false.
   */
  isFinalRoundTopscorer?: boolean;
};
```

`colorDifference` is **signed**, per art. 1.6 — a White preference goes with a
negative difference. `getColorPreference` already computes `white` and `black`
and throws the signed value away at `Math.abs`; it just stops doing that.

`isFinalRoundTopscorer` is optional so the change is additive for callers who
never pair a final round. Absent means non-topscorer, which keeps the
prohibition in force — the safe default, since that failure mode is a refused
legal pairing rather than an illegal one produced in silence.

### 5.2 `ColorPreference.OFF_GRID` is removed

It has no FIDE counterpart. It was invented as a level above `ABSOLUTE` to mark
the last-round exception, and nothing has ever produced it. The exception is
properly expressed by `isFinalRoundTopscorer` plus `colorDifference`, so it
becomes dead weight that invites a caller to invent semantics for it.

### 5.3 `isColorCompatible`

```ts
export function isColorCompatible(one, two): boolean {
  const sameAbsolutePreference =
    one.colorPreferenceLevel === ColorPreference.ABSOLUTE &&
    two.colorPreferenceLevel === ColorPreference.ABSOLUTE &&
    one.colorPreference === two.colorPreference;

  if (!sameAbsolutePreference) return true;

  // art. 2.1.3 [C3] — the prohibition names non-topscorers, so one topscorer
  // in the pair takes it outside the rule entirely (§3).
  return Boolean(one.isFinalRoundTopscorer || two.isFinalRoundTopscorer);
}
```

Signature unchanged. Existing callers keep their behaviour exactly, because
`isFinalRoundTopscorer` defaults to absent.

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

> **Correction (implemented).** This section first read "both players want the
> same colour and want it absolutely, **so their differences share a sign**".
> That is false, and the first implementation inherited it. Art. 1.7.1's two
> triggers are alternatives, so the two-in-a-row one makes a preference absolute
> at *any* difference, either side of zero: `W,B,B` is absolute White at −1 and
> `W,W,B,W,W,B,B` is absolute White at +1. On `Math.abs` those two tie, and a +1
> beats a balanced 0 — handing White to the player who has already had more of
> it, which inverts what the rule is for. The comparison is on the **deficit**:
> the difference oriented by the colour the player is asking for, so more always
> means needier. The table below is unaffected — both its players are on the
> same side — but it is no longer the whole story.

```ts
/**
 * FIDE C.04.3 art. 5.2.2, second clause. Both players want the same colour and
 * want it absolutely; the one further from balance *in that colour* takes it.
 * Returns null when the deficits are equal, leaving 5.2.3 to decide.
 */
function assignByWiderDifference(one, two): ColorAssignment | null {
  const oneDeficit = deficitOfPreferredColor(one);
  const twoDeficit = deficitOfPreferredColor(two);
  if (oneDeficit === twoDeficit) return null;
  const winner = oneDeficit > twoDeficit ? one : two;
  const loser = winner === one ? two : one;
  return winner.colorPreference === Color.WHITE
    ? { white: winner.playerId, black: loser.playerId }
    : { white: loser.playerId, black: winner.playerId };
}

// art. 1.6 signs the difference White-minus-Black, so a player wanting White is
// short by its negation. Comparable only between players wanting the same
// colour — the only place this clause is reached.
function deficitOfPreferredColor(player): number {
  return player.colorPreference === Color.WHITE
    ? -player.colorDifference
    : player.colorDifference;
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
| PC-4 | 2.1.3 | `isFinalRoundTopscorer` absent behaves exactly as `false` |
| CA-4 | 5.2.2 | Both absolute, same preference, differences −2 vs −1 → the −2 player gets White |
| CA-4 | 5.2.2 | Both absolute White at +1 and 0 → the **0** player gets White; magnitude would say the opposite |
| CA-4 | 5.2.2 | Differences equal → falls through to 5.2.3, then 5.2.4 |
| CA-4 | — | Order independence holds on both paths (CA-8) |
| OUT-1/2 | C.04.1 r6/r7 | A permitted topscorer pair **may** breach ±2 or three-in-a-row; every other pair may not |
| OUT-1/2 | — | In an exempted pair **exactly one** player breaches, and it is the one denied their preference |
| — | 1.8 | **Not testable:** that the flag is only set in the final round is a caller contract with no in-library check |

## 7. Knock-on: the outcome sweep

`OUT-1/OUT-2` currently assert that no pair the library calls compatible ever
receives an illegal colour. Once exempted pairs become compatible that assertion
is false *by design* and the sweep fails for the right reason — the worst kind
of red, because the obvious cure is to stop looking:

```ts
if (isExempt(one, two)) continue;   // NO — silently drops them from coverage
```

That returns the suite to green while checking strictly less. `assignColors`
could hand back the same player twice and nothing would say so.

### 7.1 Recognise the pair without restating the rule

Ask `isColorCompatible` twice, once with the flags cleared, so [C3] stays in one
place:

```ts
const exemptOnly = (one: PlayerColorState, two: PlayerColorState) =>
  isColorCompatible(one, two) &&
  !isColorCompatible(
    { ...one, isFinalRoundTopscorer: false },
    { ...two, isFinalRoundTopscorer: false },
  );
```

### 7.2 Replace r6/r7 with a sharper invariant, not with nothing

Both players want the same colour absolutely, so one is satisfied and one is
denied — and only the denied one can breach. The satisfied player's difference
moves back toward zero, and they cannot make a third of a colour they were
absolute *against*. Verified exhaustively over every legal history to nine
rounds: **4,608 exempted pairs, zero cases where the satisfied player breached,
zero where the denied player escaped.**

So the exempt bucket asserts something exact:

```ts
if (exemptOnly(one, two)) {
  exemptChecked++;
  const satisfied = result.white === one.playerId ? one : two;
  const denied = satisfied === one ? two : one;
  // r6/r7 waived per art. 1.8's final-round scope — but not into thin air.
  expect(breaches(satisfied)).toBeFalse();
  expect(breaches(denied)).toBeTrue();
  continue;
}
// strict bucket: r6/r7 exactly as today
```

This doubles as a net for CA-4: swap the two roles and both assertions fail.

### 7.3 Floor the bucket

```ts
expect(exemptChecked).toBeGreaterThan(0);
```

Without it, a bug that stops the exemption firing leaves the bucket empty and
the suite green — reintroducing the failure mode the `continue` had.

### 7.4 Cost

Only same-preference, both-absolute pairs can ever be exempt: 4,608 at depth 9
against ~50,000 for the main sweep. Keep the main sweep as it is, all players
non-topscorer and r6/r7 strict, and add a targeted second sweep over that subset
with the flags varied across `{true,false}`, `{false,true}` and `{true,true}` —
all three must lift the prohibition under §3. Roughly 14,000 extra pairs,
negligible against the current 838 ms.

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
`isTopscorer` remains a helper, not a decision-maker.
