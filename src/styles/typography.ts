/**
 * Shared type tokens.
 *
 * The Today screen sets its meta lines — dates, counts, plot facts, forecast
 * figures — in a monospace face so numbers align down the column. `'monospace'`
 * is an Android-only family name: on iOS it is not a registered face and the
 * text silently falls back to the proportional system font, so the face has to
 * be resolved per platform rather than hardcoded.
 */

import { Platform, TextStyle } from 'react-native';
import type { Theme } from '@/theme/colors';

export const MONO_FONT: string = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/** Spread into a mono meta line's style; pair with a colour and size. */
export const MONO_META: TextStyle = {
  fontFamily: MONO_FONT,
  letterSpacing: 0.4,
};

type FontWeight = NonNullable<TextStyle['fontWeight']>;

/**
 * Face for numbers shown as readings (counts, dates, temperatures). Garden
 * keeps the platform monospace; a palette with a `readout` face (Meadow:
 * Outfit 600) uses it with tabular figures so columns still align.
 * `weight` is the weight the style used with the monospace face.
 */
export const mono = (theme: Theme, weight?: FontWeight): TextStyle => {
  const family = theme.style.fonts.readout;
  if (family) {
    return { fontFamily: family, fontWeight: 'normal', fontVariant: ['tabular-nums'] };
  }
  return weight ? { fontFamily: MONO_FONT, fontWeight: weight } : { fontFamily: MONO_FONT };
};

/** `MONO_META` for the active palette; spread in place of `...MONO_META`. */
export const monoMeta = (theme: Theme, weight?: FontWeight): TextStyle =>
  theme.style.fonts.readout
    ? { ...mono(theme, weight), letterSpacing: 0 }
    : { ...MONO_META, ...mono(theme, weight) };
