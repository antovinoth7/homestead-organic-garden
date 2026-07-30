import React, { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ImageStyle, LayoutChangeEvent } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/pestDiseaseDetailStyles';
import { getRiskColor } from '@/utils/riskHelpers';
import type { RiskLevel } from '@/types/database.types';

interface Props {
  name: string;
  subtitle: string;
  emoji: string;
  image?: ImageSource;
  /** Current-season risk; omitted when nothing is recorded for this season. */
  risk?: RiskLevel;
  topInset: number;
  onBack: () => void;
  /** Opens the fullscreen preview. Omit to leave the image non-interactive. */
  onPressImage?: () => void;
}

/**
 * Detail hero — the reference image (or an oversized emoji watermark) sits
 * behind the name, with a scrim fading into the page background so the title
 * stays legible over either.
 */
export function ReferenceHero({
  name,
  subtitle,
  emoji,
  image,
  risk,
  topInset,
  onBack,
  onPressImage,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [scrimWidth, setScrimWidth] = useState(0);

  const riskColors = risk ? getRiskColor(risk, theme) : undefined;

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
            cachePolicy="memory-disk"
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.heroWatermark}>
          <Text style={styles.heroWatermarkText}>{emoji}</Text>
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
        <Ionicons name="chevron-back" size={20} color={theme.textInverse} />
      </TouchableOpacity>

      <View style={styles.heroCaption} pointerEvents="none">
        {risk && riskColors ? (
          <View style={[styles.heroRiskPill, { backgroundColor: riskColors.bg }]}>
            <Text style={[styles.heroRiskPillText, { color: riskColors.text }]}>
              {risk.toUpperCase()} RISK NOW
            </Text>
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
