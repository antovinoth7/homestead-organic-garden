import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  /** The ⋯ button — opens the entry's action sheet. */
  onMore: (entry: JournalEntry) => void;
  /** "Mark resolved" on an unresolved pest/disease entry. */
  onResolve: (entry: JournalEntry) => void;
  /** Tapping the place chip filters the list to that bed or plant. */
  onLocationPress: (entry: JournalEntry) => void;
  /** Receives the entry's full photo list plus the tapped index, so the viewer can swipe. */
  onPhotoPress: (uris: string[], index: number) => void;
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
 * square placeholder replaces the image rather than an empty wide panel.
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
        single && !failed ? styles.thumbCellSingle : styles.thumbCellSquare,
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

const TYPE_ICONS: Record<JournalEntryType, React.ComponentProps<typeof Ionicons>['name']> = {
  [JournalEntryType.Observation]: 'eye-outline',
  [JournalEntryType.Harvest]: 'basket-outline',
  [JournalEntryType.PestDisease]: 'bug-outline',
  [JournalEntryType.Issue]: 'alert-circle-outline',
  [JournalEntryType.Milestone]: 'flag-outline',
  [JournalEntryType.Other]: 'document-text-outline',
};

function typeColor(type: JournalEntryType, theme: ReturnType<typeof useTheme>): string {
  switch (type) {
    case JournalEntryType.Observation:
      return theme.primary;
    case JournalEntryType.Harvest:
      return theme.warningDark;
    case JournalEntryType.PestDisease:
    case JournalEntryType.Issue:
      return theme.errorDark;
    case JournalEntryType.Milestone:
      return theme.purpleDark;
    default:
      return theme.textSecondary;
  }
}

export const JournalEntryCard = React.memo(function JournalEntryCard({
  entry,
  locationName,
  locationKind,
  onPress,
  onMore,
  onResolve,
  onLocationPress,
  onPhotoPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isMilestone = entry.entry_type === JournalEntryType.Milestone;
  const milestoneMeta = isMilestone ? getMilestoneMeta(entry.milestone_kind) : null;
  const iconName = milestoneMeta
    ? milestoneMeta.icon
    : (TYPE_ICONS[entry.entry_type] ?? TYPE_ICONS[JournalEntryType.Other]);
  const entryTypeLabel = milestoneMeta ? milestoneMeta.label : journalTypeLabel(entry.entry_type);
  const chipColor = typeColor(entry.entry_type, theme);

  const timestamp = formatJournalTimestamp(entry.created_at);
  const isHarvest = entry.entry_type === JournalEntryType.Harvest;
  const isPest = entry.entry_type === JournalEntryType.PestDisease;
  const tags = entry.tags ?? [];
  // Harvest amount and pest name live in the headline, so the chips below only
  // carry what the headline doesn't: place, quality, severity, status.
  const headline = journalEntryHeadline(entry);
  // A harvest saved without notes still shows its storage notes, muted.
  const notes = entry.content.trim();
  const shownNotes = notes || (isHarvest ? (entry.harvest_notes?.trim() ?? '') : '');
  // A missing status means active (see isActiveProblem); an open problem also
  // says how long it has been open — "Active · 6 days".
  const pestStatus = isPest ? (entry.pest_status ?? 'active') : null;
  const openDays = daysOpen(entry);
  const statusLabel = pestStatus
    ? openDays === null
      ? titleCase(pestStatus)
      : `${titleCase(pestStatus)} · ${formatDaysOpen(openDays)}`
    : null;
  const severe = entry.pest_severity === 'high' || entry.pest_severity === 'severe';
  const hasChips =
    !!locationName ||
    (isHarvest && !!entry.harvest_quality) ||
    (isPest && (!!entry.pest_severity || !!statusLabel)) ||
    tags.length > 0;

  const photos = entry.photo_urls ?? [];
  const visiblePhotos = photos.slice(0, MAX_THUMBS);
  const extraCount = photos.length - MAX_THUMBS;
  const canResolve = isActiveProblem(entry);

  const handlePress = useCallback(() => onPress(entry), [onPress, entry]);
  const handleMore = useCallback(() => onMore(entry), [onMore, entry]);
  const handleResolve = useCallback(() => onResolve(entry), [onResolve, entry]);
  const handleLocation = useCallback(() => onLocationPress(entry), [onLocationPress, entry]);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={handlePress}>
      {/* Header: tinted type chip, compact timestamp, ⋯ actions */}
      <View style={styles.cardTopRow}>
        <View style={[styles.typeChip, styles[`typeChip_${entry.entry_type}`]]}>
          <Ionicons name={iconName} size={15} color={chipColor} />
          <Text style={[styles.typeChipText, styles[`typeChipText_${entry.entry_type}`]]}>
            {entryTypeLabel}
          </Text>
        </View>
        <Text style={styles.dateText} numberOfLines={1}>
          {timestamp}
        </Text>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMore}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Entry actions"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Structured headline (harvest amount, pest name), then the notes.
          Empty notes render nothing — no blank gap on a quick harvest log. */}
      {headline && (
        <Text style={styles.headlineText} numberOfLines={2}>
          {headline}
        </Text>
      )}
      {shownNotes !== '' && (
        <Text style={[styles.contentText, !notes && styles.contentTextMuted]} numberOfLines={3}>
          {shownNotes}
        </Text>
      )}

      {/* Place, per-type details and free tags share one chip row */}
      {hasChips && (
        <View style={styles.chipRow}>
          {locationName && (
            <TouchableOpacity
              style={[styles.chip, styles.chipPlant]}
              onPress={handleLocation}
              accessibilityRole="button"
              accessibilityLabel={`Show entries for ${locationName}`}
            >
              <Ionicons
                name={locationKind === 'bed' ? 'grid-outline' : 'leaf'}
                size={13}
                color={theme.primary}
              />
              <Text style={[styles.chipText, styles.chipPlantText]} numberOfLines={1}>
                {locationName}
              </Text>
            </TouchableOpacity>
          )}
          {isHarvest && entry.harvest_quality && (
            <View style={[styles.chip, styles.chipOutline]}>
              <Text style={[styles.chipText, styles.chipMutedText]}>
                {titleCase(entry.harvest_quality)}
              </Text>
            </View>
          )}
          {isPest && entry.pest_severity && (
            <View style={[styles.chip, severe ? styles.chipSevere : styles.chipModerate]}>
              <Text
                style={[styles.chipText, severe ? styles.chipSevereText : styles.chipModerateText]}
              >
                {titleCase(entry.pest_severity)}
              </Text>
            </View>
          )}
          {pestStatus && statusLabel && (
            <View
              style={[
                styles.chip,
                pestStatus === 'resolved' ? styles.chipResolved : styles.chipOutline,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  pestStatus === 'resolved' ? styles.chipResolvedText : styles.chipMutedText,
                ]}
              >
                {statusLabel}
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

      {canResolve && (
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={handleResolve}
          accessibilityRole="button"
          accessibilityLabel="Mark resolved"
        >
          <Ionicons name="checkmark" size={17} color={theme.primary} />
          <Text style={styles.resolveButtonText}>Mark resolved</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});
