import React, { useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import { createStyles } from '@/styles/varietyDetailSheetStyles';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import VoiceDictation from '@/components/VoiceDictation';
import { sanitizeNum } from '@/utils/catalogDraft';
import { GROWING_SEASON_OPTIONS, normalizeSeasonValue } from '@/utils/plantLabels';
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
      style={[styles.seasonChip, active && styles.seasonChipActive]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.seasonChipText, active && styles.seasonChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface Props {
  /** '' = adding a new variety, otherwise the name being edited. Mount only while open. */
  editingVariety: string;
  newVariety: string;
  onNewVarietyChange: (next: string) => void;
  draft: VarietyDetail;
  onDraftChange: (updater: (prev: VarietyDetail) => VarietyDetail) => void;
  /** Done, and every dismissal — like the other catalog sheets, nothing typed is dropped. */
  onSave: () => void;
}

/**
 * Add/edit bottom sheet for a single variety. Detail fields are all optional.
 *
 * Commits on Done *and* on dismissal (backdrop, handle, back button), matching
 * `CatalogTextEditSheet`: an empty name on a new variety simply closes.
 */
export function VarietyDetailModal({
  editingVariety,
  newVariety,
  onNewVarietyChange,
  draft,
  onDraftChange,
  onSave,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const isAdding = editingVariety === '';

  const sheetStyle = useMemo(
    () => [styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }],
    [styles, insets.bottom]
  );

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
        // Normalised first so a retired value (e.g. Kharif) toggles as its
        // replacement instead of lingering beside it.
        const current = [...new Set((prev.seasonSuitability ?? []).map(normalizeSeasonValue))];
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

  const activeSeasons = useMemo(
    () => new Set((draft.seasonSuitability ?? []).map(normalizeSeasonValue)),
    [draft.seasonSuitability]
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
    // The shared bottom sheet, not an RN Modal wrapping a KeyboardAvoidingView:
    // KAV mis-measures inside a transparent, statusBarTranslucent modal (see
    // useKeyboardHeight) and re-lays out on every keyboard frame. Opening this
    // editor with an auto-focused field on that path was taking the whole app
    // down with a native crash on Android (Sentry ORGANIC-GARDENING-APP-5K).
    <BottomSheetModal visible onClose={onSave} sheetStyle={sheetStyle} keyboardAvoiding>
      <SheetHandle onClose={onSave}>
        <Text style={styles.sheetTitle} numberOfLines={1}>
          {isAdding ? 'Add Variety' : editingVariety}
        </Text>
      </SheetHandle>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

        <Text style={styles.fieldLabel}>Season suitability</Text>
        <View style={styles.seasonChipRow}>
          {GROWING_SEASON_OPTIONS.map((option) => (
            <SeasonPill
              key={option.value}
              label={option.label}
              value={option.value}
              active={activeSeasons.has(option.value)}
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

        {/* Label left, compact mic | language pill right — the catalog's
            Description block, so dictation looks the same everywhere. */}
        <View style={styles.notesHeader}>
          <Text style={styles.notesLabel}>Notes</Text>
          <VoiceDictation compact value={draft.notes ?? ''} onChangeText={onNotesChange} />
        </View>
        <TextInput
          style={styles.notesInput}
          value={draft.notes ?? ''}
          onChangeText={onNotesChange}
          multiline
          numberOfLines={3}
          placeholder="Farmer observations, soil preference, yield notes..."
          placeholderTextColor={theme.inputPlaceholder}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={onSave}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}
