#!/usr/bin/env bash
# Break one FIDE rule in src/, confirm a test notices. A SURVIVED line means the
# rule has no assertion defending it — line coverage will not tell you this.
# Compares the set of failing test names, so a known-failing test cannot mask a
# mutation the way a failure count does.
set -uo pipefail
cd "$(dirname "$0")/.."

[ -z "$(git status --porcelain src/)" ] || { echo "src/ must be clean"; exit 1; }

fails () { bun test 2>&1 | grep -oE '^\(fail\) [^[]*' | sed 's/[[:space:]]*$//' | sort -u; }

base=$(fails)
status=0

mutate () { # file, perl-expr, label
  perl -0pi -e "$2" "$1"
  if git diff --quiet -- "$1"; then
    printf '  ?? PATTERN  %s (source moved — fix the pattern)\n' "$3"; status=1
  elif [ "$(fails)" = "$base" ]; then
    printf '  SURVIVED    %s\n' "$3"; status=1
  else
    printf '  caught      %s\n' "$3"
  fi
  git checkout -- "$1"
}

echo "baseline: $(printf '%s' "$base" | grep -c .) failing"
mutate src/color-assigner.ts 's/return playerOne\.colorPreference === Color\.BLACK/return playerOne.colorPreference === Color.WHITE/'                        '5.2.1  grant both preferences'
mutate src/color-assigner.ts 's/playerOne\.colorPreferenceLevel > playerTwo\.colorPreferenceLevel/false/'                                                     '5.2.2  grant the stronger'
mutate src/color-assigner.ts 's/if \(compare !== null\)/if (false \&\& compare !== null)/'                                                                    '5.2.3  alternate from differing game'
mutate src/color-assigner.ts 's/const wider = oneWidth > twoWidth/const wider = oneWidth < twoWidth/'                                                       '5.2.2b wider difference takes the colour'
mutate src/color-assigner.ts 's/if \(oneWidth === twoWidth\) return null;//'                                                                                 '5.2.2b equal magnitudes fall through'
mutate src/color-assigner.ts 's/\(a, b\) => b\.score - a\.score \|\| a\.pairingNb - b\.pairingNb/(a, b) => a.pairingNb - b.pairingNb/'                        '1.2    rank by score then TPN'
mutate src/color-assigner.ts 's/return integer % 2 === 0;/return integer % 2 !== 0;/'                                                                         '5.2.5  initial-colour by TPN parity'
mutate src/color-state.ts    's/if \(lastTwoColors \&\& lastTwoColors\[0\] === lastTwoColors\[1\]\)/if (false)/'                                                              '1.7.1  two-in-a-row is absolute'
mutate src/color-state.ts    's/getOppositeColor\(getLastPlayedColor\(colorHistory\)\)/getLastPlayedColor(colorHistory)/'                                                                        '1.7.3  mild alternates from last game'
mutate src/color-compare.ts  's/if \(color !== Color\.BYE\) withoutByes\.push\(color\);/withoutByes.push(color);/'                                            '1.6    unplayed rounds carry no colour'
mutate src/color-state.ts    's/const colorDifference = white - black;/const colorDifference = black - white;/'                                            '1.6    difference is signed White minus Black'
mutate src/topscorer.ts     's/return player\.score > half;/return player.score >= half;/'                                                                   '1.8    topscorer is strictly over half'
mutate src/color-compatibility.ts 's/if \(!sameAbsolutePreference\) return true;/return true;/'                                                             '2.1.3  same absolute preference may not meet'
mutate src/color-compatibility.ts 's/playerOne\.isFinalRoundTopscorer \|\| playerTwo\.isFinalRoundTopscorer/true/'                                            '2.1.3  exemption lifts only for topscorers'

exit $status
