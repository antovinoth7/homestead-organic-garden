import React, { useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { GardenIcon } from '@/components/GardenIcon';
import { JournalMoreDetails } from './JournalMoreDetails';
import FieldErrorText from '../FieldErrorText';
import VoiceDictation from '@/components/VoiceDictation';
import { HARVEST_UNITS } from '../../utils/journalEntryOptions';
import { PlantType } from '../../types/database.types';
import { sanitizeAlphaNumericSpaces } from '../../utils/textSanitizer';
import { useTheme } from '../../theme';
import { createStyles } from '../../styles/journalFormStyles';
import { QUALITY_ICON_KEYS } from '@/config/iconRegistry';
import type { VisualIconKey } from '@/types/visual.types';

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

const QUALITY_OPTIONS: { value: HarvestQuality; label: string; iconKey: VisualIconKey }[] = [
  { value: 'excellent', label: 'Excellent', iconKey: QUALITY_ICON_KEYS.excellent },
  { value: 'good', label: 'Good', iconKey: QUALITY_ICON_KEYS.good },
  { value: 'fair', label: 'Fair', iconKey: QUALITY_ICON_KEYS.fair },
  { value: 'poor', label: 'Poor', iconKey: QUALITY_ICON_KEYS.poor },
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
  const handleNotesChange = useCallback(
    (text: string) => onChange({ notes: sanitizeAlphaNumericSpaces(text) }),
    [onChange]
  );

  const isCoconut = plantType === 'coconut_tree';
  // Summary for the folded extras, so a filled field is visible while collapsed.
  const moreSummary = [
    value.notes.trim() ? 'Notes' : '',
    value.treeNumber ? `Tree ${value.treeNumber}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.harvestSection}>
      <Text style={styles.sectionTitle}>Harvest Details</Text>

      {/* Amount is the one thing every harvest entry needs; its unit sits on the
          same row so the whole measurement reads as one line. */}
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
      <FieldErrorText message={errorText} />

      <Text style={[styles.label, styles.labelSpaced]}>Quality</Text>
      <View style={styles.qualityRow}>
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
              <GardenIcon
                name={quality.iconKey}
                size={16}
                color={active ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[styles.qualityChipText, active && styles.qualityButtonTextActive]}
                numberOfLines={1}
              >
                {quality.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <JournalMoreDetails
        initiallyExpanded={!!value.notes.trim() || !!value.treeNumber}
        summary={moreSummary}
      >
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>Storage / Notes</Text>
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

        {isCoconut && (
          <>
            <Text style={[styles.label, styles.labelSpaced]}>Tree no. (for groves, optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3"
              placeholderTextColor={theme.inputPlaceholder}
              value={value.treeNumber}
              onChangeText={(text) => onChange({ treeNumber: text.replace(/[^0-9]/g, '') })}
              keyboardType="number-pad"
            />
          </>
        )}
      </JournalMoreDetails>
    </View>
  );
}
