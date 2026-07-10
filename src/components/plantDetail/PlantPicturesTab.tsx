import React, { useCallback, useMemo, useState } from 'react';
import type { ImageStyle, ListRenderItem } from 'react-native';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantPicturesTabStyles';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { usePlantPhotos } from '@/hooks/usePlantPhotos';
import type { PlantPhotoItem } from '@/utils/plantPhotos';
import type { Plant, JournalEntry } from '@/types/database.types';

interface Props {
  plant: Plant;
  journalEntries: JournalEntry[];
}

const COLUMNS = 3;

/** Photo timeline aggregating the plant, journal and pest/disease photos. */
export function PlantPicturesTab({ plant, journalEntries }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { photos, loading } = usePlantPhotos({ plant, journalEntries });
  const [selectedUri, setSelectedUri] = useState<string | null>(null);

  const renderItem = useCallback<ListRenderItem<PlantPhotoItem>>(
    ({ item }) => {
      if (!item.uri) return null;
      const uri = item.uri;
      return (
        <TouchableOpacity
          style={styles.cell}
          activeOpacity={0.85}
          onPress={() => setSelectedUri(uri)}
          accessibilityRole="imagebutton"
          accessibilityLabel="View photo"
        >
          <Image
            source={{ uri }}
            style={styles.image as ImageStyle}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        </TouchableOpacity>
      );
    },
    [styles]
  );

  const keyExtractor = useCallback((item: PlantPhotoItem) => item.id, []);

  if (loading && photos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="images-outline" size={48} color={theme.textTertiary} />
        <Text style={styles.emptyTitle}>No photos yet</Text>
        <Text style={styles.emptyText}>
          Photos from this plant, its journal entries and pest records will appear here.
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={COLUMNS}
        contentContainerStyle={styles.grid}
        removeClippedSubviews
      />
      {selectedUri && (
        <ImageZoomModal
          visible={selectedUri !== null}
          uri={selectedUri}
          onClose={() => setSelectedUri(null)}
        />
      )}
    </>
  );
}
