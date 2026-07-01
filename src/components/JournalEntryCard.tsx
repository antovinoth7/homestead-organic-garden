import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalStyles';
import { JournalEntry, JournalEntryType } from '@/types/database.types';

interface Props {
  entry: JournalEntry;
  /** Resolved by the parent so the card stays pure (no plant lookup here). */
  plantName: string | null;
  onPress: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  onPhotoPress: (uri: string) => void;
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
    [JournalEntryType.Issue]: 'alert-circle',
    [JournalEntryType.Milestone]: 'flag',
    [JournalEntryType.Other]: 'document-text',
  };
  const colorMap: Record<JournalEntryType, string> = {
    [JournalEntryType.Observation]: theme.primary,
    [JournalEntryType.Harvest]: theme.warning,
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

  const { iconName, color: typeColor } = getEntryTypeIcon(entry.entry_type, theme);
  const entryTypeLabel =
    entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1);

  const entryDate = new Date(entry.created_at);
  const date = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const year = entryDate.getFullYear();
  const time = entryDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

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
      onSwipeableOpen={() => {
        if (onSwipeableOpen && swipeableRef.current) {
          onSwipeableOpen(swipeableRef.current);
        }
      }}
    >
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={handlePress}>
        <View style={[styles.cardAccent, { backgroundColor: typeColor }]} />

        <View style={styles.cardBody}>
          {/* Top row: type icon + label + date */}
          <View style={styles.cardTopRow}>
            <View style={[styles.typeIconCircle, { backgroundColor: typeColor + '18' }]}>
              <Ionicons name={iconName} size={16} color={typeColor} />
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.entryTypeLabel}>{entryTypeLabel}</Text>
              <Text style={styles.dateText}>
                {date}, {year} · {time}
              </Text>
            </View>
          </View>

          {/* Plant tag + harvest details */}
          {(plantName ||
            (entry.entry_type === JournalEntryType.Harvest && entry.harvest_quantity)) && (
            <View style={styles.tagsRow}>
              {plantName && (
                <View style={styles.plantTag}>
                  <Ionicons name="leaf" size={11} color={theme.primary} />
                  <Text style={styles.plantTagText}>{plantName}</Text>
                </View>
              )}
              {entry.entry_type === JournalEntryType.Harvest && entry.harvest_quantity && (
                <View style={styles.harvestBadge}>
                  <Ionicons name="scale-outline" size={11} color={theme.warning} />
                  <Text style={styles.harvestText}>
                    {entry.harvest_quantity} {entry.harvest_unit || 'units'}
                  </Text>
                </View>
              )}
              {entry.entry_type === JournalEntryType.Harvest && entry.harvest_quality && (
                <View style={[styles.qualityBadge, styles[`quality${entry.harvest_quality}`]]}>
                  <Text style={styles.qualityText}>{entry.harvest_quality.toUpperCase()}</Text>
                </View>
              )}
            </View>
          )}

          {/* Journal tags */}
          {entry.tags && entry.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {entry.tags.map((tag) => (
                <View key={tag} style={styles.journalTagBadge}>
                  <Text style={styles.journalTagText}>{tag.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Content preview */}
          <Text style={styles.contentText} numberOfLines={2}>
            {entry.content}
          </Text>

          {/* Fixed thumbnail row (no horizontal scroll → no swipe-gesture conflict) */}
          {visiblePhotos.length > 0 && (
            <View style={styles.thumbRow}>
              {visiblePhotos.map((photoUrl, idx) => {
                const isLastShown = idx === MAX_THUMBS - 1;
                const showOverlay = isLastShown && extraCount > 0;
                return (
                  <TouchableOpacity
                    key={`${entry.id}-${idx}`}
                    onPress={() => onPhotoPress(photoUrl)}
                    activeOpacity={0.8}
                    style={showOverlay ? styles.thumbMore : undefined}
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
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});
