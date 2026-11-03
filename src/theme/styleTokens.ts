/**
 * Read a palette's shape / type / shadow tokens inside a `createStyles(theme)`
 * factory.
 *
 * Each helper takes the value the factory has always used as its fallback.
 * A palette that does not set the token (Garden sets none) gets that original
 * value back, so adopting a helper never changes the Garden look.
 *
 *   card: {
 *     borderRadius: radius(theme, 'card', 12),
 *     borderWidth: border(theme, 'card', 1),
 *     ...shadow(theme, 'card', LEGACY_CARD_SHADOW),
 *   },
 *   title: { fontSize: typeSize(theme, 'h3', 16), ...font(theme, 'title', '700') },
 */
import type { TextStyle, ViewStyle } from 'react-native';
import type { Theme } from './colors';
import type { BorderRole, FontRole, RadiusRole, ShadowRole, TypeRole } from './themeStyle';

type FontWeight = NonNullable<TextStyle['fontWeight']>;

export const radius = (theme: Theme, role: RadiusRole, fallback: number): number =>
  theme.style.radii[role] ?? fallback;

export const border = (theme: Theme, role: BorderRole, fallback: number): number =>
  theme.style.borders[role] ?? fallback;

export const typeSize = (theme: Theme, role: TypeRole, fallback: number): number =>
  theme.style.type[role] ?? fallback;

const NO_SHADOW: ViewStyle = {};

// Clears the platform shadow props a factory may have set before the spread,
// so a palette `boxShadow` is not drawn on top of a legacy elevation.
const RESET_LEGACY_SHADOW: ViewStyle = {
  shadowOpacity: 0,
  elevation: 0,
};

/**
 * The palette's shadow for `role`, or `fallback` (default: none) when the
 * palette does not define one. A palette shadow is a `boxShadow` and carries
 * no legacy `shadow*` / `elevation` keys, so spread it last.
 */
export const shadow = (
  theme: Theme,
  role: ShadowRole,
  fallback: ViewStyle = NO_SHADOW
): ViewStyle => {
  const palette = theme.shadows[role];
  return palette ? { ...RESET_LEGACY_SHADOW, ...palette } : fallback;
};

/** True when the palette draws `role` with its own shadow (vs the legacy fallback). */
export const hasShadow = (theme: Theme, role: ShadowRole): boolean =>
  theme.shadows[role] !== undefined;

/**
 * Type face for `role`. With a custom family the weight lives in the face
 * itself, so `fontWeight` is reset to normal — pairing a bold weight with a
 * single-weight custom family makes iOS fall back to the system font and
 * Android synthesise a faux bold. Spread it after any `fontWeight` in the
 * style. Garden (no family) returns `fallbackWeight` unchanged.
 */
export const font = (theme: Theme, role: FontRole, fallbackWeight?: FontWeight): TextStyle => {
  const family = theme.style.fonts[role];
  if (family) return { fontFamily: family, fontWeight: 'normal' };
  return fallbackWeight ? { fontWeight: fallbackWeight } : {};
};

/**
 * Small section label ("eyebrow"). Garden keeps the factory's own size,
 * tracking and casing; Meadow uses sentence case, 13 / semibold, no tracking.
 * Spread it after the label's own `fontSize` / `letterSpacing` /
 * `textTransform`.
 */
export const eyebrow = (
  theme: Theme,
  fallback: { fontSize: number; letterSpacing: number; fontWeight?: FontWeight }
): TextStyle => {
  const { type } = theme.style;
  return {
    fontSize: type.eyebrowSize ?? fallback.fontSize,
    letterSpacing: type.eyebrowTracking ?? fallback.letterSpacing,
    ...(type.eyebrowUppercase ? {} : { textTransform: 'none' as const }),
    ...font(theme, 'bodyStrong', fallback.fontWeight),
  };
};
