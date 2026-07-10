import React, { useMemo } from 'react';
import type { ImageStyle } from 'react-native';
import { View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { PlantKeyInfoSection } from '@/components/PlantKeyInfoSection';
import type { Plant } from '@/types/database.types';

interface Props {
  plant: Plant;
  onPhotoPress: () => void;
}

/**
 * Scrollable hero for the plant detail tabs: the photo (or placeholder) plus
 * the key-info block. Rendered at the top of each tab's scroll area so it
 * scrolls away with content rather than occupying fixed space.
 */
export function PlantDetailHero({ plant, onPhotoPress }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      {plant.photo_url ? (
        <TouchableOpacity activeOpacity={0.9} onPress={onPhotoPress}>
          <Image
            source={{ uri: plant.photo_url }}
            style={styles.photo as ImageStyle}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
          />
        </TouchableOpacity>
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="leaf" size={64} color={theme.primary} />
        </View>
      )}

      <View style={styles.keyInfoWrapper}>
        <PlantKeyInfoSection styles={styles} theme={theme} plant={plant} />
      </View>
    </View>
  );
}
