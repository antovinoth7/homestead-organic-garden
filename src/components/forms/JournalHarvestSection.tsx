import React, { useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import FloatingLabelInput from '../FloatingLabelInput';
import FieldErrorText from '../FieldErrorText';
import VoiceDictation from '@/components/VoiceDictation';
import { HARVEST_UNITS } from '../../utils/journalEntryOptions';
import { PlantType } from '../../types/database.types';
import { sanitizeAlphaNumericSpaces } from '../../utils/textSanitizer';
import { useTheme } from '../../theme';
import { createStyles } from '../../styles/journalFormStyles';

type HarvestQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface HarvestFields {
  quantity: string;
  unit: string;
  quality: HarvestQuality;
  notes: string;
  treeNumber: string;
}

interface Props {
  value: HarvestFields;
  onChange: (patch: Partial<HarvestFields>) => void;
  plantType: PlantType | null;
  /** Inline validation message for the amount field. */
  errorText?: string;
}

/** Keeps the amount numeric with at most one decimal point. */
function sanitizeAmount(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  return rest.length > 0 ? `${whole}.${rest.join('')}` : whole;
}

const QUALITY_OPTIONS: { value: HarvestQuality; label: string; emoji: string }[] = [
  { value: 'excellent', label: 'Excellent', emoji: '🌟' },
  { value: 'good', label: 'Good', emoji: '👍' },
  { value: 'fair', label: 'Fair', emoji: '👌' },
  { value: 'poor', label: 'Poor', emoji: '👎' },
];

export function JournalHarvestSection({
  value,
  onChange,
  plantType,
  errorText,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleAmountChange = useCallback(
    (text: string) => onChange({ quantity: sanitizeAmount(text) }),
    [onChange]
  );

  return (
    <View style={styles.harvestSection}>
      <Text style={styles.sectionTitle}>Harvest Details</Text>

      {/* Amount is the one thing every harvest entry needs, so it leads the
          section as a large centered field with the unit echoed beside it. */}
      <View style={styles.amountBlock}>
        <Text style={styles.label}>Quantity</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={[styles.amountInput, !!errorText && styles.amountInputError]}
            placeholder="0"
            placeholderTextColor={theme.inputPlaceholder}
            value={value.quantity}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={9}
            accessibilityLabel="Harvest quantity"
          />
          <Text style={styles.amountUnitSuffix} numberOfLines={1}>
            {value.unit}
          </Text>
        </View>
        <FieldErrorText message={errorText} />

        <View style={styles.unitSegments}>
          {HARVEST_UNITS.map((unit) => {
            const active = value.unit === unit;
            return (
              <TouchableOpacity
                key={unit}
                style={[styles.unitButton, active && styles.unitButtonActive]}
                onPress={() => onChange({ unit })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[styles.unitButtonText, active && styles.unitButtonTextActive]}
                  numberOfLines={1}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={styles.label}>Quality</Text>
      <View style={styles.qualityGrid}>
        {QUALITY_OPTIONS.map((quality) => {
          const active = value.quality === quality.value;
          return (
            <TouchableOpacity
              key={quality.value}
              style={[styles.qualityChip, active && styles.qualityButtonActive]}
              onPress={() => onChange({ quality: quality.value })}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={styles.qualityEmoji}>{quality.emoji}</Text>
              <Text style={[styles.qualityChipText, active && styles.qualityButtonTextActive]}>
                {quality.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.notesWrapper, styles.notesWrapperMarginTop]}>
        <VoiceDictation
          value={value.notes}
          onChangeText={(text) => onChange({ notes: sanitizeAlphaNumericSpaces(text) })}
        />
        <FloatingLabelInput
          label="Storage / Notes"
          value={value.notes}
          onChangeText={(text) => onChange({ notes: sanitizeAlphaNumericSpaces(text) })}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        <Text style={styles.charCounter}>{value.notes.length}/500</Text>
      </View>

      {plantType === 'coconut_tree' && (
        <View style={[styles.notesWrapper, styles.notesWrapperMarginTop]}>
          <Text style={styles.label}>Tree no. (for groves, optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 3"
            placeholderTextColor={theme.inputPlaceholder}
            value={value.treeNumber}
            onChangeText={(text) => onChange({ treeNumber: text.replace(/[^0-9]/g, '') })}
            keyboardType="number-pad"
          />
        </View>
      )}
    </View>
  );
}
