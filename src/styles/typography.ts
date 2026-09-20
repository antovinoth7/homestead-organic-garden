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
