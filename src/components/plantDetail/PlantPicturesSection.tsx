import React, { useCallback, useMemo, useState } from 'react';
import type { ImageStyle } from 'react-native';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantPicturesTabStyles';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { ShowMoreFooter } from '@/components/ShowMoreFooter';
import { usePlantPhotos } from '@/hooks/usePlantPhotos';
import { resolvedPlantPhotos } from '@/utils/plantPhotos';
import { paginateList } from '@/utils/progressiveList';
import type { Plant, JournalEntry } from '@/types/database.types';

interface Props {
  plant: Plant;
  journalEntries: JournalEntry[];
}

/** Whole rows of the 3-column grid — 4 rows shown, 4 more per tap. */
const INITIAL_VISIBLE_COUNT = 12;
const PAGE_SIZE = 12;

/** Photo timeline aggregating the plant, journal and pest/disease photos. */
export function PlantPicturesSection({ plant, journalEntries }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { photos, loading } = usePlantPhotos({ plant, journalEntries });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Drop unresolved (pest) photos up front so a cell's index matches the
  // viewer's page index — mapping over `photos` and skipping nulls would not.
  const visiblePhotos = useMemo(() => resolvedPlantPhotos(photos), [photos]);
  const uris = useMemo(() => visiblePhotos.map((p) => p.uri), [visiblePhotos]);

  // `paginateList` returns a prefix slice, so a rendered cell's index still
  // matches its index in the full `uris` array — the viewer keeps every photo
  // swipeable even while only a window of thumbnails is mounted.
  const page = useMemo(
    () => paginateList(visiblePhotos, visibleCount, INITIAL_VISIBLE_COUNT),
    [visiblePhotos, visibleCount]
  );

  const showMore = useCallback(() => setVisibleCount((count) => count + PAGE_SIZE), []);
  const showLess = useCallback(() => setVisibleCount(INITIAL_VISIBLE_COUNT), []);

  if (loading && photos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (visiblePhotos.length === 0) {
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
      <View style={styles.grid}>
        {page.visible.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.cell}
            activeOpacity={0.85}
            onPress={() => setSelectedIndex(index)}
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
        ))}
      </View>
      <ShowMoreFooter
        visibleCount={page.visible.length}
        totalCount={visiblePhotos.length}
        remaining={page.remaining}
        canCollapse={page.canCollapse}
        onShowMore={showMore}
        onShowLess={showLess}
        itemNoun="photos"
      />
      {selectedIndex !== null && (
        <ImageZoomModal
          visible
          uris={uris}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
