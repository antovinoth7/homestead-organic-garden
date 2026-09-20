import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogPlantDetailStyles';
import type { DiseaseEntry, PestDiseaseKind, PestEntry } from '@/types/database.types';

type Entry = PestEntry | DiseaseEntry;

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  kind: PestDiseaseKind;
  /** Full catalogue of entries; already-linked names are filtered out here. */
  allEntries: readonly Entry[];
  /** Names already linked (inherited + custom), case-insensitively excluded. */
  takenNames: readonly string[];
  onSelect: (name: string) => void;
}

const keyExtractor = (item: Entry): string => item.id;

/** Searchable picker shared by the Known Pests and Known Diseases sections. */
export function PestDiseasePickerModal({
  visible,
  onClose,
  title,
  searchPlaceholder,
  kind,
  allEntries,
  takenNames,
  onSelect,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [search, setSearch] = useState('');

  const close = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  const handleSelect = useCallback(
    (name: string) => {
      onSelect(name);
      setSearch('');
      onClose();
    },
    [onSelect, onClose]
  );

  const available = useMemo(() => {
    const taken = new Set(takenNames.map((n) => n.toLowerCase()));
    const query = search.trim().toLowerCase();
    return allEntries.filter(
      (entry) =>
        !taken.has(entry.name.toLowerCase()) &&
        (!query || entry.name.toLowerCase().includes(query))
    );
  }, [allEntries, takenNames, search]);

  const renderSeparator = useCallback(() => <View style={styles.pickerSeparator} />, [styles]);

  const renderRow = useCallback(
    ({ item }: { item: Entry }) => <PickerRow item={item} kind={kind} onSelect={handleSelect} />,
    [handleSelect, kind]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      hardwareAccelerated
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.pickerModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={close}>
              <Ionicons name="close" size={16} color={theme.textInverse} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.pickerSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          <FlatList
            style={styles.pickerList}
            keyboardShouldPersistTaps="handled"
            data={available}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={renderSeparator}
            renderItem={renderRow}
          />
        </View>
      </View>
    </Modal>
  );
}

interface RowProps {
  item: Entry;
  kind: PestDiseaseKind;
  onSelect: (name: string) => void;
}

function PickerRow({ item, kind, onSelect }: RowProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onSelect(item.name), [onSelect, item.name]);

  return (
    <TouchableOpacity style={styles.pickerRow} onPress={handlePress}>
      <GardenIcon
        name={kind === 'pest' ? 'general.pest' : 'general.disease'}
        size={18}
        color={theme.textSecondary}
      />
      <Text style={styles.pickerRowText}>{item.name}</Text>
    </TouchableOpacity>
  );
}
