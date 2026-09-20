import React, { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ImageStyle, LayoutChangeEvent } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { REFERENCE_IMAGE_CACHE_POLICY } from '@/config/referenceAssets';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/pestDiseaseDetailStyles';
import { getRiskColor } from '@/utils/riskHelpers';
import type { RiskLevel } from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';

/** Caption pill for screens that have no seasonal risk to show. */
export interface HeroBadge {
  label: string;
  bg: string;
  color: string;
}

interface Props {
  name: string;
  subtitle: string;
  fallbackIcon?: VisualIconKey;
  image?: ImageSource;
  /** Current-season risk; omitted when nothing is recorded for this season. */
  risk?: RiskLevel;
  /** Generic caption pill, used when `risk` does not apply. `risk` wins. */
  badge?: HeroBadge;
  topInset: number;
  onBack: () => void;
  /** Opens the fullscreen preview. Omit to leave the image non-interactive. */
  onPressImage?: () => void;
  /** Action rendered opposite the back button (e.g. the catalog's Save). */
  headerRight?: React.ReactNode;
}

/**
 * Detail hero — the reference image (or an oversized emoji watermark) sits
 * behind the name, with a scrim fading into the page background so the title
 * stays legible over either.
 */
export function ReferenceHero({
  name,
  subtitle,
  fallbackIcon = 'general.plant',
  image,
  risk,
  badge,
  topInset,
  onBack,
  onPressImage,
  headerRight,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [scrimWidth, setScrimWidth] = useState(0);

  const riskColors = risk ? getRiskColor(risk, theme) : undefined;
  // A seasonal risk is the more specific signal, so it wins over a plain badge.
  const pill =
    risk && riskColors
      ? { label: `${risk.toUpperCase()} RISK NOW`, bg: riskColors.bg, color: riskColors.text }
      : badge;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setScrimWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View style={styles.hero} onLayout={handleLayout}>
      {image ? (
        <TouchableOpacity
          style={styles.heroImage}
          activeOpacity={onPressImage ? 0.9 : 1}
          onPress={onPressImage}
          disabled={!onPressImage}
          accessibilityRole="imagebutton"
          accessibilityLabel={`View ${name} photo full screen`}
        >
          <Image
            source={image}
            style={styles.heroImageInner as ImageStyle}
            contentFit="cover"
            cachePolicy={REFERENCE_IMAGE_CACHE_POLICY}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.heroWatermark}>
          <GardenIcon name={fallbackIcon} size={132} color={theme.primary} />
        </View>
      )}

      {scrimWidth > 0 ? (
        <View style={styles.heroScrim} pointerEvents="none">
          <Svg width={scrimWidth} height={150}>
            <Defs>
              <SvgLinearGradient id="referenceHeroScrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.background} stopOpacity="0" />
                <Stop offset="0.58" stopColor={theme.background} stopOpacity="0.86" />
                <Stop offset="1" stopColor={theme.background} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect x={0} y={0} width={scrimWidth} height={150} fill="url(#referenceHeroScrim)" />
          </Svg>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.heroBackButton, { top: topInset + 10 }]}
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
      </TouchableOpacity>

      {headerRight ? (
        <View style={[styles.heroHeaderRight, { top: topInset + 10 }]}>{headerRight}</View>
      ) : null}

      <View style={styles.heroCaption} pointerEvents="none">
        {pill ? (
          <View style={[styles.heroRiskPill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.heroRiskPillText, { color: pill.color }]}>{pill.label}</Text>
          </View>
        ) : null}
        <Text style={styles.heroTitle} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.heroSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
