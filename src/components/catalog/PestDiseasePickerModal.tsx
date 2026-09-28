import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { SheetHandle } from '@/components/SheetHandle';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { getDiseaseImage, getPestImage } from '@/config/referenceAssets';
import { createStyles } from '@/styles/plantPickerSheetStyles';
import {
  buildPestDiseasePickerRows,
  type PestDiseasePickerEntry,
  type PestDiseasePickerGroup,
  type PestDiseasePickerRow,
} from '@/utils/pestDiseasePickerRows';
import type { PestDiseaseKind } from '@/types/database.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  kind: PestDiseaseKind;
  /** The catalogue grouped by category; already-linked names are filtered out here. */
  groups: readonly PestDiseasePickerGroup[];
  /** Names already linked (inherited + custom), case-insensitively excluded. */
  takenNames: readonly string[];
  onSelect: (name: string) => void;
}

const keyExtractor = (row: PestDiseasePickerRow): string => row.key;

/**
 * Searchable bottom-sheet picker shared by the Known Pests and Known Diseases
 * sections. Same chrome as the Choose a Plant sheet (`PlantPickerSheet`):
 * handle + title, search bar, category headers, thumbnail rows.
 *
 * Mount it only while open — the search starts empty on each mount.
 */
export function PestDiseasePickerModal({
  visible,
  onClose,
  title,
  searchPlaceholder,
  kind,
  groups,
  takenNames,
  onSelect,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [search, setSearch] = useState('');

  const keyboardHeight = useKeyboardHeight();
  // Edge-to-edge modal: cap below the status bar rather than trusting a
  // percentage of the full-screen window. The sheet rides above the keyboard
  // while searching, so it gives up that much height rather than pushing its
  // title off the top — otherwise the bottom rows sat under the keyboard.
  const sheetHeight =
    Math.min(windowHeight * 0.85, windowHeight - insets.top - 24) - keyboardHeight;
  const sheetStyle = useMemo(
    () => [styles.sheet, { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 24) }],
    [styles, sheetHeight, insets.bottom]
  );

  const rows = useMemo(
    () => buildPestDiseasePickerRows(groups, takenNames, search),
    [groups, takenNames, search]
  );

  const handleSelect = useCallback(
    (name: string) => {
      onSelect(name);
      onClose();
    },
    [onSelect, onClose]
  );

  const renderRow = useCallback(
    ({ item: row }: { item: PestDiseasePickerRow }) => {
      if (row.kind === 'label') {
        return <Text style={styles.categoryHeader}>{row.label}</Text>;
      }
      return (
        <PickerRow
          entry={row.entry}
          categoryLabel={row.categoryLabel}
          kind={kind}
          onSelect={handleSelect}
        />
      );
    },
    [styles, kind, handleSelect]
  );

  const noun = kind === 'pest' ? 'pests' : 'diseases';
  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={28} color={theme.textTertiary} />
        <Text style={styles.emptyStateText}>
          {search.trim() ? `No ${noun} match your search.` : `Every listed ${kind} is linked.`}
        </Text>
      </View>
    ),
    [styles, theme, search, noun, kind]
  );

  return (
    <BottomSheetModal visible={visible} onClose={onClose} sheetStyle={sheetStyle} keyboardAvoiding>
      <SheetHandle onClose={onClose}>
        <Text style={styles.sheetTitle}>{title}</Text>
      </SheetHandle>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={16} color={theme.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={theme.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={emptyState}
      />
    </BottomSheetModal>
  );
}

interface RowProps {
  entry: PestDiseasePickerEntry;
  categoryLabel: string;
  kind: PestDiseaseKind;
  onSelect: (name: string) => void;
}

function PickerRow({ entry, categoryLabel, kind, onSelect }: RowProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onSelect(entry.name), [onSelect, entry.name]);
  const source =
    kind === 'pest'
      ? getPestImage(entry.id, entry.imageAsset)
      : getDiseaseImage(entry.id, entry.imageAsset);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Add ${entry.name}`}
    >
      <ReferenceThumb
        source={source}
        fallbackIcon={kind === 'pest' ? 'general.pest' : 'general.disease'}
        variant="row"
        recyclingKey={entry.id}
      />
      <View style={styles.rowMeta}>
        <Text style={styles.rowName}>{entry.name}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
    </TouchableOpacity>
  );
}
