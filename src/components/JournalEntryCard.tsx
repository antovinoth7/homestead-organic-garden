import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalStyles';
import { JournalEntry, JournalEntryType } from '@/types/database.types';
import {
  daysOpen,
  formatDaysOpen,
  formatJournalTimestamp,
  getMilestoneMeta,
  isActiveProblem,
  journalEntryHeadline,
  journalTypeLabel,
  type JournalLocationKind,
} from '@/utils/journalEntryOptions';

interface Props {
  entry: JournalEntry;
  /**
   * The linked plant's name, else the linked bed's — resolved by the parent so
   * the card stays pure (no plant/bed lookup here).
   */
  locationName: string | null;
  locationKind: JournalLocationKind | null;
  onPress: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  /** Shown as a swipe action only on an unresolved pest/disease entry. */
  onResolve?: (entry: JournalEntry) => void;
  /** Receives the entry's full photo list plus the tapped index, so the viewer can swipe. */
  onPhotoPress: (uris: string[], index: number) => void;
  onSwipeableOpen?: (ref: Swipeable) => void;
}

const MAX_THUMBS = 3;

/** `treated` → `Treated`; chip values are stored lower-case. */
const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

interface ThumbProps {
  uri: string;
  entryId: string;
  index: number;
  photos: string[];
  single: boolean;
  /** Number of photos hidden behind this thumb's "+N" overlay (0 = none). */
  moreCount: number;
  onPhotoPress: (uris: string[], index: number) => void;
  styles: ReturnType<typeof createStyles>;
  placeholderColor: string;
}

/**
 * One photo thumbnail. Journal photos are device-local, so a URI can stop
 * resolving (reinstall, restore onto another phone, web preview); then a small
 * square placeholder replaces the image rather than an empty 16:9 panel.
 */
const JournalThumb = React.memo(function JournalThumb({
  uri,
  entryId,
  index,
  photos,
  single,
  moreCount,
  onPhotoPress,
  styles,
  placeholderColor,
}: ThumbProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);
  // `photos`, not the visible slice — the "+N" thumb must open the viewer on a
  // gallery containing every photo on the entry.
  const handlePress = useCallback(() => onPhotoPress(photos, index), [onPhotoPress, photos, index]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.thumbCell,
        single && !failed && styles.thumbCellSingle,
        failed && styles.thumbBroken,
      ]}
      accessibilityLabel={failed ? 'Photo unavailable' : 'Open photo'}
    >
      {failed ? (
        <Ionicons name="image-outline" size={22} color={placeholderColor} />
      ) : (
        <Image
          source={{ uri }}
          style={styles.thumb as ImageStyle}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={`journal-${entryId}-${index}`}
          onError={handleError}
        />
      )}
      {moreCount > 0 && (
        <View style={styles.thumbMoreOverlay}>
          <Text style={styles.thumbMoreText}>+{moreCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

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
  locationName,
  locationKind,
  onPress,
  onEdit,
  onDelete,
  onResolve,
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
  const entryTypeLabel = milestoneMeta ? milestoneMeta.label : journalTypeLabel(entry.entry_type);

  const timestamp = formatJournalTimestamp(entry.created_at);
  const isHarvest = entry.entry_type === JournalEntryType.Harvest;
  const isPest = entry.entry_type === JournalEntryType.PestDisease;
  const tags = entry.tags ?? [];
  // Harvest amount and pest name live in the headline, so the chips below only
  // carry what the headline doesn't: place, quality, severity, status.
  const headline = journalEntryHeadline(entry);
  const notes = entry.content.trim();
  // A missing status means active (see isActiveProblem); an open problem also
  // says how long it has been open — "Active · 6 days".
  const pestStatus = isPest ? (entry.pest_status ?? 'active') : null;
  const openDays = daysOpen(entry);
  const statusLabel = pestStatus
    ? openDays === null
      ? titleCase(pestStatus)
      : `${titleCase(pestStatus)} · ${formatDaysOpen(openDays)}`
    : null;
  const hasChips =
    !!locationName ||
    (isHarvest && !!entry.harvest_quality) ||
    (isPest && (!!entry.pest_severity || !!statusLabel)) ||
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

  const canResolve = !!onResolve && isActiveProblem(entry);
  const handleResolve = useCallback(() => {
    swipeableRef.current?.close();
    onResolve?.(entry);
  }, [onResolve, entry]);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.swipeActions}>
        {canResolve && (
          <TouchableOpacity
            style={styles.swipeResolveAction}
            onPress={handleResolve}
            accessibilityLabel="Mark as resolved"
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={theme.textInverse} />
            <Text style={styles.swipeActionText}>Resolved</Text>
          </TouchableOpacity>
        )}
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
    [styles, theme, canResolve, handleResolve, handleEdit, handleDelete]
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
          <View style={[styles.typeChip, styles[`typeChip_${entry.entry_type}`]]}>
            <Ionicons name={iconName} size={13} color={typeColor} />
            <Text style={[styles.typeChipText, styles[`typeChipText_${entry.entry_type}`]]}>
              {entryTypeLabel}
            </Text>
          </View>
          <Text style={styles.dateText} numberOfLines={1}>
            {timestamp}
          </Text>
        </View>

        {/* Structured headline (harvest amount, pest name), then the notes.
            Empty notes render nothing — no blank gap on a quick harvest log. */}
        {headline && (
          <Text style={styles.headlineText} numberOfLines={1}>
            {headline}
          </Text>
        )}
        {notes !== '' && (
          <Text
            style={[styles.contentText, !!headline && styles.contentTextUnderHeadline]}
            numberOfLines={headline ? 2 : 3}
          >
            {notes}
          </Text>
        )}

        {/* Place, per-type details and free tags share one chip row */}
        {hasChips && (
          <View style={styles.chipRow}>
            {locationName && (
              <View style={[styles.chip, styles.chipPlant]}>
                <Ionicons
                  name={locationKind === 'bed' ? 'grid-outline' : 'leaf'}
                  size={12}
                  color={theme.primary}
                />
                <Text style={[styles.chipText, styles.chipPlantText]} numberOfLines={1}>
                  {locationName}
                </Text>
              </View>
            )}
            {isHarvest && entry.harvest_quality && (
              <View style={[styles.chip, styles[`quality${entry.harvest_quality}`]]}>
                <Text style={[styles.chipText, styles.chipMutedText]}>
                  {titleCase(entry.harvest_quality)}
                </Text>
              </View>
            )}
            {isPest && entry.pest_severity && (
              <View style={[styles.chip, styles[`severity_${entry.pest_severity}`]]}>
                <Text style={[styles.chipText, styles.chipMutedText]}>
                  {titleCase(entry.pest_severity)}
                </Text>
              </View>
            )}
            {pestStatus && statusLabel && (
              <View style={[styles.chip, styles[`status_${pestStatus}`]]}>
                <Text style={[styles.chipText, styles.chipMutedText]}>{statusLabel}</Text>
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
            {visiblePhotos.map((photoUrl, idx) => (
              <JournalThumb
                key={`${entry.id}-${idx}`}
                uri={photoUrl}
                entryId={entry.id}
                index={idx}
                photos={photos}
                single={visiblePhotos.length === 1}
                moreCount={idx === MAX_THUMBS - 1 && extraCount > 0 ? extraCount + 1 : 0}
                onPhotoPress={onPhotoPress}
                styles={styles}
                placeholderColor={theme.textTertiary}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
});
