import React, { useCallback, useMemo, useState } from 'react';
import type { ImageStyle, LayoutChangeEvent } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/organicInputDetailStyles';

interface Props {
  name: string;
  tamilName?: string;
  categoryLabel: string;
  image?: ImageSource;
  topInset: number;
  onBack: () => void;
  onPressImage?: () => void;
}

/**
 * Detail hero — an oversized emoji watermark sits behind the name, with a
 * scrim fading into the page background so the title stays legible.
 * Organic inputs have no bundled reference photography, so the watermark is
 * the only treatment (see `docs/REFERENCE_IMAGES.md`).
 */
export function OrganicInputHero({
  name,
  tamilName,
  categoryLabel,
  image,
  topInset,
  onBack,
  onPressImage,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [scrimWidth, setScrimWidth] = useState(0);

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
          <GardenIcon name="general.plant" size={132} color={theme.primary} />
        </View>
      )}

      {scrimWidth > 0 ? (
        <View style={styles.heroScrim} pointerEvents="none">
          <Svg width={scrimWidth} height={150}>
            <Defs>
              <SvgLinearGradient id="organicInputHeroScrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.background} stopOpacity="0" />
                <Stop offset="0.58" stopColor={theme.background} stopOpacity="0.86" />
                <Stop offset="1" stopColor={theme.background} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect x={0} y={0} width={scrimWidth} height={150} fill="url(#organicInputHeroScrim)" />
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

      <View style={styles.heroCaption} pointerEvents="none">
        <View style={styles.heroCategoryPill}>
          <Text style={styles.heroCategoryPillText}>{categoryLabel.toUpperCase()}</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {name}
        </Text>
        {tamilName ? (
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {tamilName}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
