import React, { useMemo } from 'react';
import type { ImageStyle } from 'react-native';
import { View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { GardenIcon } from '@/components/GardenIcon';
import { REFERENCE_IMAGE_CACHE_POLICY } from '@/config/referenceAssets';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/referenceThumbStyles';
import type { VisualIconKey } from '@/types/visual.types';

interface Props {
  /** Bundled reference image; falls back to a themed semantic icon when undefined. */
  source?: ImageSource;
  fallbackIcon?: VisualIconKey;
  /**
   * row: 36×36 list rows; chip: 20×20 suggestion chips; hero: 44×44 headers;
   * tile: full-width 4:3 photo for a grid tile, rounded on its own.
   */
  variant?: 'row' | 'chip' | 'hero' | 'tile';
  accessibilityLabel?: string;
  /** Pass the entry id when rendered inside FlatList/SectionList rows. */
  recyclingKey?: string;
}

/**
 * Small reference-image thumbnail with a semantic icon fallback, shared by the pest and
 * disease lists, the plant catalog, and the PestDiseaseModal suggestion chips.
 */
export function ReferenceThumb({
  source,
  fallbackIcon = 'general.plant',
  variant = 'chip',
  accessibilityLabel,
  recyclingKey,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const variantStyles = useMemo(
    () =>
      ({
        row: { image: styles.rowImage, fallback: styles.rowFallback, iconSize: 22 },
        chip: {
          image: styles.chipImage,
          fallback: styles.chipFallback,
          iconSize: 13,
        },
        hero: {
          image: styles.heroImage,
          fallback: styles.heroFallback,
          iconSize: 24,
        },
        tile: {
          image: styles.tileImage,
          fallback: styles.tileFallback,
          iconSize: 34,
        },
      })[variant],
    [variant, styles]
  );
  if (!source) {
    return (
      <View style={variantStyles.fallback} accessibilityLabel={accessibilityLabel}>
        <GardenIcon name={fallbackIcon} size={variantStyles.iconSize} color={theme.primary} />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={variantStyles.image as ImageStyle}
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      cachePolicy={REFERENCE_IMAGE_CACHE_POLICY}
      recyclingKey={recyclingKey}
      transition={150}
    />
  );
}
