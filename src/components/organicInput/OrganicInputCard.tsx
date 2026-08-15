import React, { useCallback, useMemo } from 'react';
import type { ImageStyle } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/organicInputListStyles';
import { getCategoryLabel } from '@/config/organicInputs';
import { getOrganicInputImage, REFERENCE_IMAGE_CACHE_POLICY } from '@/config/referenceAssets';
import type { OrganicInputEntry } from '@/types/database.types';

interface Props {
  entry: OrganicInputEntry;
  onPress: (id: string) => void;
}

/**
 * Browse-list row: emoji tile, name + Tamil name, a clamped description, and a
 * meta row carrying the category, the application rate and — when the input
 * has a farm-scaled preparation — a DIY recipe badge.
 */
export function OrganicInputCard({ entry, onPress }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const image = useMemo(
    () => getOrganicInputImage(entry.id, entry.imageAsset),
    [entry.id, entry.imageAsset]
  );

  const handlePress = useCallback(() => onPress(entry.id), [onPress, entry.id]);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.75}>
      <View style={styles.cardTile}>
        {image ? (
          <Image
            source={image}
            style={styles.cardTileImage as ImageStyle}
            contentFit="cover"
            cachePolicy={REFERENCE_IMAGE_CACHE_POLICY}
            recyclingKey={entry.id}
          />
        ) : (
          <GardenIcon name="general.plant" size={24} color={theme.primary} />
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {entry.name}
          </Text>
          {entry.tamilName ? (
            <Text style={styles.cardTamil} numberOfLines={1}>
              {entry.tamilName}
            </Text>
          ) : null}
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {entry.description}
        </Text>

        <View style={styles.cardMetaRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{getCategoryLabel(entry.category)}</Text>
          </View>
          {entry.applicationRate ? (
            <Text style={styles.cardRate} numberOfLines={1}>
              {entry.applicationRate}
            </Text>
          ) : null}
          {entry.recipeId ? (
            <View style={styles.recipeBadge}>
              <Text style={styles.recipeBadgeText}>DIY RECIPE</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardChevron}>
        <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}
