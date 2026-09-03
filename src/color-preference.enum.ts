/**
 * FIDE C.04.3 art. 1.7 — the three degrees of colour preference, named as the
 * handbook names them: mild (1.7.3), strong (1.7.2), absolute (1.7.1).
 *
 * The numeric values are ordered by strength and compared as such: art. 5.2.2's
 * first clause grants the stronger preference, and getColorPreference derives
 * the level from the colour difference by capping it at ABSOLUTE.
 */
export enum ColorPreference {
  MILD = 0,
  STRONG = 1,
  ABSOLUTE = 2,
}
