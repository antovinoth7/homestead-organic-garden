import React, { useMemo } from 'react';
import type { ImageStyle } from 'react-native';
import { Text, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/referenceThumbStyles';

interface Props {
  /** Bundled reference image; falls back to the emoji tile when undefined. */
  source?: ImageSource;
  emoji: string;
  /** row: 36×36 list rows; chip: 20×20 suggestion chips. */
  variant: 'row' | 'chip';
  /** Pass the entry id when rendered inside FlatList/SectionList rows. */
  recyclingKey?: string;
}

/**
 * Small reference-image thumbnail with emoji fallback, shared by the pest and
 * disease lists, the plant catalog, and the PestDiseaseModal suggestion chips.
 */
export function ReferenceThumb({ source, emoji, variant, recyclingKey }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isRow = variant === 'row';

  if (!source) {
    return (
      <View style={isRow ? styles.rowFallback : styles.chipFallback}>
        <Text style={isRow ? styles.rowFallbackText : styles.chipFallbackText}>{emoji}</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={(isRow ? styles.rowImage : styles.chipImage) as ImageStyle}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={recyclingKey}
      transition={150}
    />
  );
}
