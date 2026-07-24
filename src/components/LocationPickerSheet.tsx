import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import { createStyles } from '@/styles/locationPickerSheetStyles';

interface Props {
  visible: boolean;
  onClose: () => void;
  parentLocations: string[];
  childLocations: string[];
  parentShortNames: Record<string, string>;
  selectedParent: string;
  selectedChild: string;
  onSelect: (parent: string, child: string) => void;
}

export function LocationPickerSheet({
  visible,
  onClose,
  parentLocations,
  childLocations,
  parentShortNames,
  selectedParent,
  selectedChild,
  onSelect,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // The modal is edge-to-edge, so cap the sheet below the status bar instead of
  // relying on a percentage of the (now full-screen) window.
  const sheetMaxHeight = windowHeight - insets.top - 24;

  // Local stage-1 choice; committed only when a child is picked (or immediately
  // when the location config has no child sections).
  const [pendingParent, setPendingParent] = useState('');

  useEffect(() => {
    if (visible) setPendingParent(selectedParent);
  }, [visible, selectedParent]);

  const handleParentPress = useCallback(
    (parent: string): void => {
      if (childLocations.length === 0) {
        onSelect(parent, '');
        onClose();
        return;
      }
      setPendingParent(parent);
    },
    [childLocations.length, onSelect, onClose]
  );

  const handleChildPress = useCallback(
    (child: string): void => {
      onSelect(pendingParent, child);
      onClose();
    },
    [pendingParent, onSelect, onClose]
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={[
        styles.sheet,
        { maxHeight: sheetMaxHeight, paddingBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      <SheetHandle onClose={onClose}>
        <Text style={styles.sheetTitle}>Choose a Location</Text>
      </SheetHandle>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {parentLocations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={28} color={theme.textTertiary} />
            <Text style={styles.emptyStateText}>
              No locations configured yet. Add locations in Settings first.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.stageLabel}>Main Location</Text>
            <View style={styles.cardGrid}>
              {parentLocations.map((parent) => {
                const isSelected = parent === pendingParent;
                const shortName = parentShortNames[parent];
                return (
                  <TouchableOpacity
                    key={parent}
                    style={[styles.locationCard, isSelected && styles.locationCardSelected]}
                    onPress={() => handleParentPress(parent)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'location' : 'location-outline'}
                      size={22}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.locationCardName,
                        isSelected && styles.locationCardNameSelected,
                      ]}
                    >
                      {parent}
                    </Text>
                    {shortName ? (
                      <View style={styles.shortNameBadge}>
                        <Text style={styles.shortNameBadgeText}>{shortName}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
            {pendingParent !== '' && childLocations.length > 0 && (
              <>
                <Text style={styles.stageLabel}>Direction / Section</Text>
                <View style={styles.chipRow}>
                  {childLocations.map((child) => {
                    const isSelected = child === selectedChild && pendingParent === selectedParent;
                    return (
                      <TouchableOpacity
                        key={child}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => handleChildPress(child)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {child}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </BottomSheetModal>
  );
}
