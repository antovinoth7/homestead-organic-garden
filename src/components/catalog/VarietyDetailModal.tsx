import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogPlantDetailStyles';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import VoiceDictation from '@/components/VoiceDictation';
import { sanitizeNum } from '@/utils/catalogDraft';
import { GROWING_SEASON_OPTIONS } from '@/utils/plantLabels';
import type { VarietyDetail } from '@/types/database.types';

interface SeasonPillProps {
  label: string;
  value: string;
  active: boolean;
  onToggle: (value: string) => void;
}

function SeasonPill({ label, value, active, onToggle }: SeasonPillProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onToggle(value), [onToggle, value]);

  return (
    <TouchableOpacity
      style={[styles.seasonPill, active && styles.seasonPillActive]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.seasonPillText, active && styles.seasonPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface Props {
  /** null = closed, '' = adding a new variety, otherwise the name being edited. */
  editingVariety: string | null;
  newVariety: string;
  onNewVarietyChange: (next: string) => void;
  draft: VarietyDetail;
  onDraftChange: (updater: (prev: VarietyDetail) => VarietyDetail) => void;
  onClose: () => void;
  onSave: () => void;
}

/** Add/edit sheet for a single variety. Detail fields are all optional. */
export function VarietyDetailModal({
  editingVariety,
  newVariety,
  onNewVarietyChange,
  draft,
  onDraftChange,
  onClose,
  onSave,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isAdding = editingVariety === '';

  const onDaysChange = useCallback(
    (raw: string) => {
      const parsed = parseInt(sanitizeNum(raw), 10);
      onDraftChange((prev) => ({
        ...prev,
        daysToMaturity: Number.isNaN(parsed) ? undefined : parsed,
      }));
    },
    [onDraftChange]
  );

  const onToggleSeason = useCallback(
    (value: string) => {
      onDraftChange((prev) => {
        const current = prev.seasonSuitability ?? [];
        return {
          ...prev,
          seasonSuitability: current.includes(value)
            ? current.filter((s) => s !== value)
            : [...current, value],
        };
      });
    },
    [onDraftChange]
  );

  const onSeedSourceChange = useCallback(
    (seedSource: string) => onDraftChange((prev) => ({ ...prev, seedSource })),
    [onDraftChange]
  );

  const onNotesChange = useCallback(
    (notes: string) => onDraftChange((prev) => ({ ...prev, notes })),
    [onDraftChange]
  );

  return (
    <Modal
      visible={editingVariety !== null}
      transparent
      animationType="fade"
      hardwareAccelerated
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isAdding ? 'Add Variety' : editingVariety}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={16} color={theme.textInverse} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalHint}>
            {isAdding
              ? 'Enter a name and optional details'
              : 'Optional details for this variety'}
          </Text>

          {isAdding && (
            <FloatingLabelInput
              label="Variety name *"
              value={newVariety}
              onChangeText={onNewVarietyChange}
              autoFocus
              autoCorrect={false}
            />
          )}

          <FloatingLabelInput
            label="Days to maturity"
            keyboardType="numeric"
            value={draft.daysToMaturity !== undefined ? String(draft.daysToMaturity) : ''}
            onChangeText={onDaysChange}
          />

          <Text style={styles.pruningTipsLabel}>Season suitability</Text>
          <View style={styles.seasonPillRow}>
            {GROWING_SEASON_OPTIONS.map((option) => (
              <SeasonPill
                key={option.value}
                label={option.label}
                value={option.value}
                active={(draft.seasonSuitability ?? []).includes(option.value)}
                onToggle={onToggleSeason}
              />
            ))}
          </View>

          <FloatingLabelInput
            label="Seed source (e.g. TNAU, saved seed)"
            value={draft.seedSource ?? ''}
            onChangeText={onSeedSourceChange}
            autoCorrect={false}
          />

          <Text style={styles.pruningTipsLabel}>Notes</Text>
          <VoiceDictation value={draft.notes ?? ''} onChangeText={onNotesChange} />
          <TextInput
            style={styles.varietyNotesInput}
            value={draft.notes ?? ''}
            onChangeText={onNotesChange}
            multiline
            numberOfLines={3}
            placeholder="Farmer observations, soil preference, yield notes..."
            placeholderTextColor={theme.textTertiary}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={onSave}
            >
              <Text style={styles.modalButtonTextPrimary}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
