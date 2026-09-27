import React, { useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { JournalMoreDetails } from './JournalMoreDetails';
import FieldErrorText from '../FieldErrorText';
import VoiceDictation from '@/components/VoiceDictation';
import { HARVEST_UNITS, stepHarvestQuantity } from '@/utils/journalEntryOptions';
import { sanitizeFreeText } from '@/utils/textSanitizer';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalFormStyles';

type HarvestQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface HarvestFields {
  quantity: string;
  unit: string;
  quality: HarvestQuality;
  notes: string;
  /**
   * No longer editable — carried through so editing an older entry keeps the
   * grove tree number it was saved with.
   */
  treeNumber: string;
}

interface Props {
  value: HarvestFields;
  onChange: (patch: Partial<HarvestFields>) => void;
  /** "Last: 120 pcs · yesterday" / "First harvest here" — empty hides it. */
  lastHint: string;
  /** Inline validation message for the amount field. */
  errorText?: string;
}

/** Keeps the amount numeric with at most one decimal point. */
function sanitizeAmount(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  return rest.length > 0 ? `${whole}.${rest.join('')}` : whole;
}

const QUALITY_OPTIONS: { value: HarvestQuality; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export function JournalHarvestSection({
  value,
  onChange,
  lastHint,
  errorText,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleAmountChange = useCallback(
    (text: string) => onChange({ quantity: sanitizeAmount(text) }),
    [onChange]
  );
  const handleNotesChange = useCallback(
    (text: string) => onChange({ notes: sanitizeFreeText(text) }),
    [onChange]
  );
  const stepDown = useCallback(
    () => onChange({ quantity: stepHarvestQuantity(value.quantity, value.unit, -1) }),
    [onChange, value.quantity, value.unit]
  );
  const stepUp = useCallback(
    () => onChange({ quantity: stepHarvestQuantity(value.quantity, value.unit, 1) }),
    [onChange, value.quantity, value.unit]
  );
  const unitHandlers = useMemo(
    () => Object.fromEntries(HARVEST_UNITS.map((unit) => [unit, () => onChange({ unit })])),
    [onChange]
  );
  const qualityHandlers = useMemo(
    () =>
      Object.fromEntries(
        QUALITY_OPTIONS.map((q) => [q.value, () => onChange({ quality: q.value })])
      ),
    [onChange]
  );

  // Summary for the folded extras, so a filled field is visible while collapsed.
  const moreSummary = value.notes.trim() ? 'Notes' : 'Storage notes';

  return (
    <View style={styles.sectionCard}>
      <View style={styles.fieldGroup}>
        <View style={styles.quantityHeader}>
          <Text style={styles.label}>Quantity</Text>
          {lastHint !== '' && (
            <Text style={styles.lastHint} numberOfLines={1}>
              {lastHint}
            </Text>
          )}
        </View>
        {/* −/+ around the amount: most harvests are a tap or two off the last one. */}
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={stepDown}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Ionicons name="remove" size={24} color={theme.text} />
          </TouchableOpacity>
          <TextInput
            style={[styles.amountInput, !!errorText && styles.inputError]}
            placeholder="0"
            placeholderTextColor={theme.inputPlaceholder}
            value={value.quantity}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={9}
            accessibilityLabel="Harvest quantity"
          />
          <TouchableOpacity
            style={[styles.stepButton, styles.stepButtonPrimary]}
            onPress={stepUp}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Ionicons name="add" size={24} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
        <FieldErrorText message={errorText} />
        <View style={styles.segmentTrack}>
          {HARVEST_UNITS.map((unit) => {
            const active = value.unit === unit;
            return (
              <TouchableOpacity
                key={unit}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={unitHandlers[unit]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[styles.segmentText, active && styles.segmentTextActive]}
                  numberOfLines={1}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Quality</Text>
        <View style={styles.optionGrid}>
          {QUALITY_OPTIONS.map((quality) => {
            const active = value.quality === quality.value;
            return (
              <TouchableOpacity
                key={quality.value}
                style={[styles.optionTile, active && styles.optionTileActive]}
                onPress={qualityHandlers[quality.value]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[styles.optionTileText, active && styles.optionTileTextActive]}
                  numberOfLines={1}
                >
                  {quality.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <JournalMoreDetails initiallyExpanded={!!value.notes.trim()} summary={moreSummary}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.label}>Storage / notes</Text>
          <VoiceDictation compact value={value.notes} onChangeText={handleNotesChange} />
        </View>
        <TextInput
          style={[styles.notesInput, styles.notesInputSmall]}
          value={value.notes}
          onChangeText={handleNotesChange}
          placeholder="Where it's stored, who it went to…"
          placeholderTextColor={theme.inputPlaceholder}
          multiline
          maxLength={500}
        />
      </JournalMoreDetails>
    </View>
  );
}
