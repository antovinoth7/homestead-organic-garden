import React, { useMemo, useState } from 'react';
import type { ImageStyle } from 'react-native';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantPicturesTabStyles';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { usePlantPhotos } from '@/hooks/usePlantPhotos';
import type { Plant, JournalEntry } from '@/types/database.types';

interface Props {
  plant: Plant;
  journalEntries: JournalEntry[];
}

/** Photo timeline aggregating the plant, journal and pest/disease photos. */
export function PlantPicturesSection({ plant, journalEntries }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { photos, loading } = usePlantPhotos({ plant, journalEntries });
  const [selectedUri, setSelectedUri] = useState<string | null>(null);

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
    <View style={styles.grid}>
      {photos.map((item) =>
        item.uri ? (
          <TouchableOpacity
            key={item.id}
            style={styles.cell}
            activeOpacity={0.85}
            onPress={() => setSelectedUri(item.uri)}
            accessibilityRole="imagebutton"
            accessibilityLabel="View photo"
          >
            <Image
              source={{ uri: item.uri }}
              style={styles.image as ImageStyle}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        ) : null
      )}
      {selectedUri && (
        <ImageZoomModal
          visible={selectedUri !== null}
          uri={selectedUri}
          onClose={() => setSelectedUri(null)}
        />
      )}
    </View>
  );
}
