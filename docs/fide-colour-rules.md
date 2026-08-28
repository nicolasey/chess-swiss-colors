# FIDE colour rules → expectations

Rules this library is supposed to implement, each turned into a concrete,
checkable expectation. Every expectation has a stable ID so a test can cite it
and coverage gaps stay visible.

## Sources

| Chapter | Revision used | Link |
|---|---|---|
| C.04.1 Basic rules for Swiss Systems | effective 1 February 2026 | [handbook.fide.com](https://handbook.fide.com/chapter/C0401202507) |
| C.04.3 FIDE (Dutch) System | effective 1 February 2026 | [handbook.fide.com](https://handbook.fide.com/chapter/C0403202602) |

Two scope notes:

- **The Dutch system is assumed.** FIDE approves several Swiss systems
  (Dubov, Burstein, Lim) with *different* colour allocation rules. This library
  implements the Dutch one, which is the FIDE default.
- **The February 2026 revision renumbered everything.** C.04.3 is now
  self-contained with articles 1.x–5.x; it no longer defers to C.04.2's
  lettered A.6/A.7 definitions. Older references to "A.7.a" map to 1.7.1 here.
  C.04.1's lettered rules (a–j) are now numbered 1–9.

Rules below are paraphrased for readability. Cite the article and read the
handbook before changing behaviour.

## Vocabulary

| Term | Definition | This codebase |
|---|---|---|
| Colour difference | Rounds played White minus rounds played Black (1.6) | `ColorState.colorDifference`, signed |
| Absolute preference | 1.7.1 | `ColorPreference.ABSOLUTE` |
| Strong preference | 1.7.2 | `ColorPreference.HIGH` |
| Mild preference | 1.7.3 | `ColorPreference.LOW` |
| Topscorer | Score above 50% of the maximum possible, when pairing the **final** round (1.8) | `PlayerColorState.isFinalRoundTopscorer`, declared by the caller; `isTopPlayer` is a helper |
| TPN | Tournament Pairing Number; lower = higher ranked | `pairingNb` |
| Initial-colour | Colour drawn by lot before round 1 | `randomColor` |
| — | no FIDE counterpart | `ColorPreference.OFF_GRID` |

`Color.BYE` covers **every unplayed round** — pairing-allocated byes, half-point
byes, forfeits, absences. FIDE needs no separate forfeit colour: art. 1.6 counts
only games played, and art. 1.7.1 looks only at rounds a player played, so both
are skipped identically. Where byes and forfeits genuinely differ is outside
this library — score arrives separately as `player.score`, and C.04.1 r4 (no
second bye) is a pairing constraint. `Color.BYE` is also used as the
no-preference sentinel in `ColorState.colorPreference`; that second job is what
makes CA-2 possible.

Unplayed rounds (byes, forfeits) never carry a colour: they count toward
neither the colour difference nor "the two latest rounds".

## Preference derivation — `getColorPreference`

| ID | Art. | Rule | Expected behaviour | Test | Status |
|---|---|---|---|---|---|
| CP-1 | 1.7.4 | A player who has played no games has no preference | `[]` → no preference | `when_nothing_happened` | ✅ |
| CP-2 | 1.7.3 | Difference of zero → mild, alternating from the previous game | `[B,W]` → mild White | `when_balanced` | ✅ |
| CP-3 | 1.7.2 | Difference of exactly ±1 → strong for the minority colour | `[B,W,B]` → strong White | `when_high`, `after_round_one` | ✅ |
| CP-4 | 1.7.1 | Difference beyond ±1 → absolute for the minority colour | 5W/1B → absolute Black | `it_should_never_return_a_level_outside_the_enum` | ✅ |
| CP-5 | 1.7.1 | Same colour in the two latest played rounds → **absolute** for the opposite colour | `[W,B,B]` → absolute White | `when_two_in_a_row` | ✅ |
| CP-6 | 1.7.1 | CP-5 applies whatever the colour difference is — the two triggers are alternatives, not a rule plus a modifier | `[W,W,B,B]` → absolute White | `CP-6:` ×2 | ✅ |
| CP-7 | 1.7.1 | When CP-5 fires, the preference colour comes from the repeated colour, not from the count | last two Black → White, even if Black is the majority | `CP-7:` | ✅ |
| CP-8 | 1.6 | Unplayed rounds are excluded from the difference and from "two latest rounds" | `[W,BYE,W]` → absolute Black | `it_should_ignore_byes`, `get_last_two_colors_skips_byes` | ✅ |
| CP-9 | 1.7 | Level is always one of mild/strong/absolute | never outside the enum | `CP-9:` | ✅ |
| CP-10 | 1.6 | `ColorState` reports the **signed** colour difference, White games minus Black | `[W,W,B]` → `+1`; byes move it not at all | `CP-10:` ×3 | ✅ |

CP-6 was reachable in ordinary play by round 4 and was the defect with the
largest blast radius: a mild label loses to any strong preference under CA-3,
which handed the player a third consecutive Black and broke OUT-2. Fixed by
testing the two triggers as alternatives, in the order art. 1.7.1 states them.

## Colour allocation — `assignColors`

Applied in descending priority; the first that resolves the pair wins.

| ID | Art. | Rule | Expected behaviour | Test | Status |
|---|---|---|---|---|---|
| CA-1 | 5.2.1 | Grant both preferences when they differ | Black-pref vs White-pref → each gets theirs | `when_diff_preference` | ✅ |
| CA-2 | 1.7.4 | One player has no preference → the opponent's preference is granted | bye-only vs White-pref → opponent gets White | `CA-2:` ×3 | ✅ |
| CA-3 | 5.2.2 | Same preference, different strength → the stronger is granted | absolute beats strong beats mild | `CA-3:` ×4 | ✅ both colours |
| CA-4 | 5.2.2 | Both absolute and identical (topscorers only) → grant the wider colour difference | magnitude 2 outranks magnitude 1; equal magnitudes fall through to CA-5 | `CA-4:` ×2 | ✅ |
| CA-5 | 5.2.3 | Otherwise alternate from the most recent round in which the two played different colours | whoever had Black there now gets White | `CA-5:` ×2 | ✅ |
| CA-6 | 5.2.4 | Otherwise grant the higher-ranked player's preference | lower TPN wins | `when_same`, `when_same_but_score_diff` | ✅ |
| CA-7 | 5.2.5 | Neither has a preference → initial-colour to the higher-ranked player on an odd TPN, opposite on an even one | round 1 | `round_one_gives_the_drawn_colour_by_pairing_parity` | ✅ |
| CA-8 | — | Argument order must not change the result | `f(a,b) === f(b,a)` | `CA-8:` + `expectValidAssignment` | ✅ |

CA-5 note: the old `when_same_absolute_diff_color_history` was named for this
rule but never reached it — its two histories were identical over the compared
range, so the pair fell through to CA-6 and the assertion passed for the wrong
reason. Its replacement makes playerTwo the higher ranked of the pair so CA-6
would give the opposite answer: if the pair ever stops reaching 5.2.3 the test
fails, rather than passing by accident.

CA-6 note: art. 1.2 ranks for pairing purposes by score first, then TPN
ascending. The code's `b.score - a.score || a.pairingNb - b.pairingNb` matches
that exactly, including for cross-bracket pairs.

Bye alignment in CA-5 is **not specified by FIDE**. The 2026 wording says "the
most recent time", not round, and is silent on unplayed rounds. The code strips
byes per player and compares by games played; `src/color-compare.ts` carries a
`@todo` admitting the uncertainty. That is a defensible reading, but it is this
library's choice — `compare_history_with_byes` currently asserts it as though
the handbook settled it.

## Pairing constraints — `isColorCompatible`

| ID | Art. | Rule | Expected behaviour | Test | Status |
|---|---|---|---|---|---|
| PC-1 | 2.1.3 [C3] | Two **non-topscorers** with the same absolute preference shall not meet | both absolute White → incompatible | `when_incompatible` | ✅ |
| PC-2 | 2.1.3 [C3] | Opposite preferences are compatible however strong | absolute White vs absolute Black → compatible | `when_compatible` | ✅ |
| PC-3 | 2.1.3 [C3] | Only one absolute → compatible | absolute vs strong, same colour → compatible | `same_color_only_one_absolute` | ✅ |
| PC-4 | 2.1.3 [C3] | The prohibition is restricted to non-topscorers; one topscorer in the pair lifts it | absolute-White pair with a topscorer → compatible | `PC-4:` ×4 | ✅ |
| PC-5 | — | `assignColors` is advisory: it recommends colours and never refuses on rule grounds | a [C3]-forbidden pair still gets a well-formed recommendation | `PC-5:` ×2 | ✅ decided |

PC-4 and CA-4 are the same missing feature seen from two sides. [C3] restricts
the prohibition to non-topscorers precisely so that topscorers *can* be paired
with matching absolute preferences in the final round — and 5.2.2's wider-
difference clause exists to resolve exactly that pair. The library has
`isTopPlayer` and an `OFF_GRID` level but wires neither into the decision.

PC-5 note: this package computes colours for a higher Swiss engine that owns
the pairing. Only that engine can act on an incompatibility — by building a
different pair — so `assignColors` recommends and never refuses on rule
grounds. Screening with `isColorCompatible` is the caller's step. Malformed
input is not covered by that: a missing pairing number still throws.

## Topscorer — `isTopPlayer`

| ID | Art. | Rule | Expected behaviour | Test | Status |
|---|---|---|---|---|---|
| TS-1 | 1.8 | Score strictly above 50% of the maximum possible | 2/3 → yes; 1.5/3 → no | `checks_if_top_player`, `exactly_half_is_not_a_top_player` | ✅ |
| TS-2 | 1.8 | Only meaningful when pairing the final round | caller's gate | n/a | ⚠️ predicate is ungated by design |

TS-1 assumes `history.length` equals rounds played (forfeits and byes
included) and that a win is worth 1 point. Neither is checked.

## Outcome invariants

Properties of the assignment itself, checked by exhaustive sweep rather than by
example — they are what the preference rules exist to guarantee, so a break here
means something upstream mislabelled a player.

| ID | Art. | Rule | Expected behaviour | Status |
|---|---|---|---|---|
| OUT-1 | C.04.1 r6 | Colour difference stays within ±2 | no assignment pushes a player past ±2 | ✅ |
| OUT-2 | C.04.1 r7 | Never the same colour three rounds running | no assignment gives a third repeat | ✅ |
| OUT-3 | C.04.1 r8 | Prefer the colour played less; alternate when balanced | CP-2/CP-3 in aggregate | ✅ via CP rules |
| OUT-4 | — | The two colours go to the two players passed in, and differ | no duplicate or foreign id | ✅ `expectValidAssignment` |
| OUT-1/2 | 2.1.3, 1.8 | A pair permitted only by the [C3] exemption may breach r6/r7 — **exactly one** player does, the one denied their preference | 13,824 exempted pairs, no exception either way | ✅ |

OUT-1 and OUT-2 hold only if callers respect PC-1. They are consequences of the
preference rules rather than anything the assigner enforces directly, which is
why a mislabelled preference produced an illegal colour rather than an error —
so they are checked by sweep, not by example. Every legal history up to nine
rounds is paired against every other, and again to six rounds with byes in the
alphabet so the two players' games fall out of step and CA-5 has to align them.
Over 50,000 compatible pairs in each sweep, no illegal colour.

Pairs the [C3] exemption permits are **partitioned, not skipped**. They breach
r6/r7 by design, so skipping them would return the suite to green while covering
strictly less — `assignColors` could hand back the same player twice and nothing
would say so. They get a sharper assertion instead: both players want the same
colour absolutely, so one is satisfied and one denied, and only the denied one
can breach. Verified over 13,824 exempted pairs with no exception either way.
The bucket carries a floor, so a bug that stops the exemption firing fails the
test rather than emptying it.

## Coverage summary

| Status | Count | IDs |
|---|---|---|
| ✅ correct and covered | 28 | CP-1…CP-10, CA-1…CA-8, PC-1…PC-5, TS-1, OUT-1…OUT-4 |
| ⚠️ no test possible | 1 | TS-2 |

**One expectation cannot be tested at all.** Art. 1.8 makes topscorer status a
final-round fact, and `isFinalRoundTopscorer` carries the whole temporal bound.
This package has no round counter and cannot infer one, so a caller setting the
flag in an earlier round gets a pairing FIDE forbids and nothing here will
notice. That is a caller contract with no in-library check — written down rather
than left looking covered by the sweep.

Every ID above must appear somewhere under `tests/`; the last test in
`tests/fide-invariants.test.ts` fails the suite if one does not. That gate found
CP-4 uncited the first time it ran.

Citation proves a rule is *mentioned*. To prove it is *defended*:

```bash
./scripts/mutation-check.sh
```

It breaks each rule in `src/` in turn and confirms a test notices. A SURVIVED
line means nothing is defending that rule — which is how 5.2.3 sat unverified
behind 100% line coverage.
