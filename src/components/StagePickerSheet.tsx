import React, { useCallback, useMemo } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/stagePickerSheetStyles';
import { GROWTH_STAGE_DESCRIPTIONS, GROWTH_STAGE_EMOJIS, GROWTH_STAGE_LABELS } from '@/utils/plantLabels';
import type { GrowthStage } from '@/types/database.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  stages: GrowthStage[];
  effectiveStage: GrowthStage;
  pinnedStage: GrowthStage | null;
  automaticHint: string;
  onSelectStage: (stage: GrowthStage) => void;
  onSelectAutomatic: () => void;
}

/** Bottom sheet for choosing a growth stage, or clearing back to the automatic one. */
export function StagePickerSheet({
  visible,
  onClose,
  stages,
  effectiveStage,
  pinnedStage,
  automaticHint,
  onSelectStage,
  onSelectAutomatic,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelectStage = useCallback(
    (stage: GrowthStage): void => {
      onSelectStage(stage);
      onClose();
    },
    [onSelectStage, onClose]
  );

  const handleSelectAutomatic = useCallback((): void => {
    onSelectAutomatic();
    onClose();
  }, [onSelectAutomatic, onClose]);

  const isAutomatic = pinnedStage === null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Growth Stage</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity
              style={[styles.row, isAutomatic && styles.rowSelected]}
              onPress={handleSelectAutomatic}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isAutomatic }}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="sync-outline" size={18} color={theme.primary} />
              </View>
              <View style={styles.rowMeta}>
                <Text style={styles.rowName}>Automatic</Text>
                <Text style={styles.rowDescription}>{automaticHint}</Text>
              </View>
              {isAutomatic && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Set Manually</Text>
            {stages.map((stage) => {
              const isSelected = pinnedStage === stage;
              const isCurrent = isAutomatic && stage === effectiveStage;
              return (
                <TouchableOpacity
                  key={stage}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => handleSelectStage(stage)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.emojiCircle}>
                    <Text style={styles.emoji}>{GROWTH_STAGE_EMOJIS[stage]}</Text>
                  </View>
                  <View style={styles.rowMeta}>
                    <View style={styles.rowNameLine}>
                      <Text style={styles.rowName}>{GROWTH_STAGE_LABELS[stage]}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowDescription} numberOfLines={2}>
                      {GROWTH_STAGE_DESCRIPTIONS[stage]}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
