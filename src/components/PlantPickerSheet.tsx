import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import { getPlantEmoji } from '@/utils/plantHelpers';
import { CATEGORY_FULL_LABELS } from '@/utils/plantLabels';
import { createStyles } from '@/styles/plantPickerSheetStyles';
import type { PlantPickerItem } from '@/utils/plantPickerItems';
import type { PlantType } from '@/types/database.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  items: PlantPickerItem[];
  /** Currently selected plant name (plantVariety in form state), if any. */
  selectedName: string | null;
  /** Category of the current selection; keeps out-of-catalog selections re-selectable. */
  selectedPlantType: PlantType | null;
  onSelect: (item: PlantPickerItem) => void;
}

type ListRow =
  | { kind: 'label'; key: string; label: string }
  | { kind: 'plant'; key: string; item: PlantPickerItem };

function buildRows(
  items: PlantPickerItem[],
  query: string,
  selectedName: string | null,
  selectedPlantType: PlantType | null
): ListRow[] {
  const q = query.trim().toLowerCase();
  const rows: ListRow[] = [];

  // A prefilled selection (e.g. from the bed wizard) may not exist in the
  // catalog; pin it so the current value is always visible and re-selectable.
  if (!q && selectedName && !items.some((i) => i.name === selectedName)) {
    rows.push({ kind: 'label', key: 'label:current', label: 'Current selection' });
    rows.push({
      kind: 'plant',
      key: 'current-selection',
      item: {
        plantType: selectedPlantType ?? 'vegetable',
        name: selectedName,
        seasonLabel: null,
        hasVarieties: false,
      },
    });
  }

  let lastType: PlantType | null = null;
  for (const item of items) {
    if (q && !item.name.toLowerCase().includes(q)) {
      continue;
    }
    if (item.plantType !== lastType) {
      lastType = item.plantType;
      rows.push({
        kind: 'label',
        key: `label:${item.plantType}`,
        label: CATEGORY_FULL_LABELS[item.plantType],
      });
    }
    rows.push({ kind: 'plant', key: `${item.plantType}:${item.name}`, item });
  }
  return rows;
}

export function PlantPickerSheet({
  visible,
  onClose,
  items,
  selectedName,
  selectedPlantType,
  onSelect,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');

  // The modal is edge-to-edge, so cap the sheet below the status bar instead of
  // relying on a percentage of the (now full-screen) window.
  const sheetHeight = Math.min(windowHeight * 0.85, windowHeight - insets.top - 24);

  useEffect(() => {
    if (visible) setSearchQuery('');
  }, [visible]);

  const rows = useMemo(
    () => buildRows(items, searchQuery, selectedName, selectedPlantType),
    [items, searchQuery, selectedName, selectedPlantType]
  );

  const handleSelect = useCallback(
    (item: PlantPickerItem): void => {
      onSelect(item);
      onClose();
    },
    [onSelect, onClose]
  );

  const renderRow = useCallback(
    ({ item: row }: { item: ListRow }): React.JSX.Element => {
      if (row.kind === 'label') {
        return <Text style={styles.categoryHeader}>{row.label}</Text>;
      }
      const { item } = row;
      const isSelected = item.name === selectedName;
      return (
        <TouchableOpacity
          style={[styles.row, isSelected && styles.rowSelected]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{getPlantEmoji(item.name)}</Text>
          </View>
          <View style={styles.rowMeta}>
            <Text style={styles.rowName}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{CATEGORY_FULL_LABELS[item.plantType]}</Text>
              </View>
              {item.seasonLabel ? (
                <View style={styles.seasonBadge}>
                  <Text style={styles.seasonBadgeText}>{item.seasonLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
        </TouchableOpacity>
      );
    },
    [styles, theme, selectedName, handleSelect]
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={[
        styles.sheet,
        { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      <SheetHandle onClose={onClose}>
        <Text style={styles.sheetTitle}>Choose a Plant</Text>
      </SheetHandle>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={16} color={theme.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search plants…"
          placeholderTextColor={theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={28} color={theme.textTertiary} />
            <Text style={styles.emptyStateText}>No plants match your search.</Text>
          </View>
        }
      />
    </BottomSheetModal>
  );
}
