import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalStyles';
import { JournalEntry, JournalEntryType } from '@/types/database.types';
import {
  formatJournalTimestamp,
  getMilestoneMeta,
  normalizeHarvestUnit,
} from '@/utils/journalEntryOptions';

interface Props {
  entry: JournalEntry;
  /** Resolved by the parent so the card stays pure (no plant lookup here). */
  plantName: string | null;
  onPress: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  /** Receives the entry's full photo list plus the tapped index, so the viewer can swipe. */
  onPhotoPress: (uris: string[], index: number) => void;
  onSwipeableOpen?: (ref: Swipeable) => void;
}

const MAX_THUMBS = 3;

function getEntryTypeIcon(
  type: JournalEntryType,
  theme: ReturnType<typeof useTheme>
): { iconName: React.ComponentProps<typeof Ionicons>['name']; color: string } {
  const iconMap: Record<JournalEntryType, React.ComponentProps<typeof Ionicons>['name']> = {
    [JournalEntryType.Observation]: 'eye',
    [JournalEntryType.Harvest]: 'basket',
    [JournalEntryType.PestDisease]: 'bug',
    [JournalEntryType.Issue]: 'alert-circle',
    [JournalEntryType.Milestone]: 'flag',
    [JournalEntryType.Other]: 'document-text',
  };
  const colorMap: Record<JournalEntryType, string> = {
    [JournalEntryType.Observation]: theme.primary,
    [JournalEntryType.Harvest]: theme.warning,
    [JournalEntryType.PestDisease]: theme.error,
    [JournalEntryType.Issue]: theme.error,
    [JournalEntryType.Milestone]: theme.success,
    [JournalEntryType.Other]: theme.textSecondary,
  };
  return {
    iconName: iconMap[type] ?? iconMap[JournalEntryType.Other],
    color: colorMap[type] ?? theme.textSecondary,
  };
}

export const JournalEntryCard = React.memo(function JournalEntryCard({
  entry,
  plantName,
  onPress,
  onEdit,
  onDelete,
  onPhotoPress,
  onSwipeableOpen,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const swipeableRef = useRef<Swipeable>(null);

  const { iconName: baseIcon, color: typeColor } = getEntryTypeIcon(entry.entry_type, theme);
  const isMilestone = entry.entry_type === JournalEntryType.Milestone;
  const milestoneMeta = isMilestone ? getMilestoneMeta(entry.milestone_kind) : null;
  const iconName = milestoneMeta ? milestoneMeta.icon : baseIcon;
  const entryTypeLabel =
    entry.entry_type === JournalEntryType.PestDisease
      ? 'Pest/Disease'
      : milestoneMeta
        ? milestoneMeta.label
        : entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1);

  const timestamp = formatJournalTimestamp(entry.created_at);
  const isHarvest = entry.entry_type === JournalEntryType.Harvest;
  const isPest = entry.entry_type === JournalEntryType.PestDisease;
  const tags = entry.tags ?? [];
  const hasChips =
    !!plantName ||
    (isHarvest && (!!entry.harvest_quantity || !!entry.harvest_quality)) ||
    (isPest && (!!entry.pest_name || !!entry.pest_severity || !!entry.pest_status)) ||
    tags.length > 0;

  const photos = entry.photo_urls ?? [];
  const visiblePhotos = photos.slice(0, MAX_THUMBS);
  const extraCount = photos.length - MAX_THUMBS;

  const handlePress = useCallback(() => onPress(entry), [onPress, entry]);

  const handleEdit = useCallback(() => {
    swipeableRef.current?.close();
    onEdit(entry);
  }, [onEdit, entry]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(entry);
  }, [onDelete, entry]);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={styles.swipeEditAction}
          onPress={handleEdit}
          accessibilityLabel="Edit entry"
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={20} color={theme.textInverse} />
          <Text style={styles.swipeActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.swipeDeleteAction}
          onPress={handleDelete}
          accessibilityLabel="Delete entry"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color={theme.textInverse} />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    ),
    [styles, theme, handleEdit, handleDelete]
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      containerStyle={styles.swipeContainer}
      onSwipeableOpen={() => {
        if (onSwipeableOpen && swipeableRef.current) {
          onSwipeableOpen(swipeableRef.current);
        }
      }}
    >
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={handlePress}>
        {/* Header: tinted type chip + compact timestamp */}
        <View style={styles.cardTopRow}>
          <View style={[styles.typeChip, { backgroundColor: typeColor + '1A' }]}>
            <Ionicons name={iconName} size={13} color={typeColor} />
            <Text style={[styles.typeChipText, { color: typeColor }]}>{entryTypeLabel}</Text>
          </View>
          <Text style={styles.dateText} numberOfLines={1}>
            {timestamp}
          </Text>
        </View>

        {/* Content first — it's the journal */}
        <Text style={styles.contentText} numberOfLines={3}>
          {entry.content}
        </Text>

        {/* Plant, per-type details and free tags share one chip row */}
        {hasChips && (
          <View style={styles.chipRow}>
            {plantName && (
              <View style={[styles.chip, styles.chipPlant]}>
                <Ionicons name="leaf" size={12} color={theme.primary} />
                <Text style={[styles.chipText, styles.chipPlantText]} numberOfLines={1}>
                  {plantName}
                </Text>
              </View>
            )}
            {isHarvest && !!entry.harvest_quantity && (
              <View style={[styles.chip, styles.chipHarvest]}>
                <Ionicons name="scale-outline" size={12} color={theme.warning} />
                <Text style={[styles.chipText, styles.chipHarvestText]}>
                  {entry.harvest_quantity} {normalizeHarvestUnit(entry.harvest_unit)}
                </Text>
              </View>
            )}
            {isHarvest && entry.harvest_quality && (
              <View style={[styles.chip, styles[`quality${entry.harvest_quality}`]]}>
                <Text style={[styles.chipText, styles.chipMutedText]}>
                  {entry.harvest_quality.toUpperCase()}
                </Text>
              </View>
            )}
            {isPest && entry.pest_name && (
              <View style={[styles.chip, styles.chipPest]}>
                <Ionicons
                  name={entry.pest_kind === 'disease' ? 'medical' : 'bug'}
                  size={12}
                  color={theme.error}
                />
                <Text style={[styles.chipText, styles.chipPestText]} numberOfLines={1}>
                  {entry.pest_name}
                </Text>
              </View>
            )}
            {isPest && entry.pest_severity && (
              <View style={[styles.chip, styles[`severity_${entry.pest_severity}`]]}>
                <Text style={[styles.chipText, styles.chipMutedText]}>
                  {entry.pest_severity.toUpperCase()}
                </Text>
              </View>
            )}
            {isPest && entry.pest_status && (
              <View style={[styles.chip, styles[`status_${entry.pest_status}`]]}>
                <Text style={[styles.chipText, styles.chipMutedText]}>
                  {entry.pest_status.toUpperCase()}
                </Text>
              </View>
            )}
            {tags.map((tag) => (
              <View key={tag} style={[styles.chip, styles.chipTag]}>
                <Text style={[styles.chipText, styles.chipTagText]}>{tag.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Fixed thumbnail row (no horizontal scroll → no swipe-gesture conflict) */}
        {visiblePhotos.length > 0 && (
          <View style={styles.thumbRow}>
            {visiblePhotos.map((photoUrl, idx) => {
              const isLastShown = idx === MAX_THUMBS - 1;
              const showOverlay = isLastShown && extraCount > 0;
              return (
                <TouchableOpacity
                  key={`${entry.id}-${idx}`}
                  // `photos`, not `visiblePhotos` — the "+N" thumb must open the
                  // viewer on a gallery containing every photo on the entry.
                  onPress={() => onPhotoPress(photos, idx)}
                  activeOpacity={0.8}
                  style={[styles.thumbCell, visiblePhotos.length === 1 && styles.thumbCellSingle]}
                >
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.thumb as ImageStyle}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    recyclingKey={`journal-${entry.id}-${idx}`}
                  />
                  {showOverlay && (
                    <View style={styles.thumbMoreOverlay}>
                      <Text style={styles.thumbMoreText}>+{extraCount + 1}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
});
