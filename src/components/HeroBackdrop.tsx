/**
 * HeroBackdrop — the gradient and texture behind a hero header.
 *
 * Draws a 135° gradient from `heroGradientStart` to `heroGradientEnd`, and for
 * the soft-circles texture (Meadow) two soft glows: white near the top right,
 * sky near the bottom. Renders nothing for a palette without a hero texture
 * (Garden), whose hero stays its flat `heroGradientStart` ground.
 *
 * Place it as the first child of a hero with `overflow: 'hidden'`.
 */
import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';
import { hasHeroTexture } from '@/theme/styleTokens';
import { styles } from '@/styles/heroBackdropStyles';

export function HeroBackdrop(): React.JSX.Element | null {
  const theme = useTheme();
  // SVG ids are document-global on web; keep each hero's gradients distinct.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  if (!hasHeroTexture(theme)) return null;

  return (
    <View style={styles.fill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.heroGradientStart} />
            <Stop offset="1" stopColor={theme.heroGradientEnd} />
          </LinearGradient>
          <RadialGradient id={`${id}a`} cx="0.9" cy="0.08" r="0.42" fx="0.9" fy="0.08">
            <Stop offset="0" stopColor={theme.heroGlow} />
            <Stop offset="0.55" stopColor={theme.heroGlow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`${id}b`} cx="0.68" cy="1.18" r="0.7" fx="0.68" fy="1.18">
            <Stop offset="0" stopColor={theme.heroSky} />
            <Stop offset="0.6" stopColor={theme.heroSky} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}g)`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}a)`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}b)`} />
      </Svg>
    </View>
  );
}
