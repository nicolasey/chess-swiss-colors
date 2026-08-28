import { Color, ColorPreference } from "../index";

/**
 * A colour difference consistent with a given preference and level, for tests
 * that build a PlayerColorState by hand rather than deriving one from a
 * history.
 *
 * FIDE C.04.3 art. 1.6 makes the difference signed — White games minus Black —
 * so a preference for White goes with a negative one. Art. 1.7.1/1.7.2 fix the
 * magnitude: zero when mild, one when strong, two when absolute. Two is the
 * smallest absolute magnitude; a fixture needing a wider one (art. 5.2.2)
 * should pass its own value rather than reach for this.
 */
export const differenceFor = (
  colorPreference: Color,
  colorPreferenceLevel: ColorPreference,
): number => {
  if (colorPreference === Color.BYE) return 0;

  const magnitude =
    colorPreferenceLevel === ColorPreference.ABSOLUTE
      ? 2
      : colorPreferenceLevel === ColorPreference.HIGH
        ? 1
        : 0;

  return colorPreference === Color.WHITE ? -magnitude : magnitude;
};
