import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import FloatingLabelInput from '../FloatingLabelInput';
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
}

const QUALITY_OPTIONS: { value: HarvestQuality; label: string; emoji: string }[] = [
  { value: 'excellent', label: 'Excellent', emoji: '🌟' },
  { value: 'good', label: 'Good', emoji: '👍' },
  { value: 'fair', label: 'Fair', emoji: '👌' },
  { value: 'poor', label: 'Poor', emoji: '👎' },
];

export function JournalHarvestSection({ value, onChange, plantType }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.harvestSection}>
      <Text style={styles.sectionTitle}>Harvest Details</Text>

      <View style={styles.quantityInput}>
        <Text style={styles.label}>Quantity *</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={theme.inputPlaceholder}
          value={value.quantity}
          onChangeText={(text) => onChange({ quantity: text })}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.unitInput}>
        <Text style={styles.label}>Unit</Text>
        <View style={styles.unitButtons}>
          {HARVEST_UNITS.map((unit) => {
            const active = value.unit === unit;
            return (
              <TouchableOpacity
                key={unit}
                style={[styles.unitButton, active && styles.unitButtonActive]}
                onPress={() => onChange({ unit })}
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
      <View style={styles.qualityButtons}>
        {QUALITY_OPTIONS.map((quality) => {
          const active = value.quality === quality.value;
          return (
            <TouchableOpacity
              key={quality.value}
              style={[styles.qualityButton, active && styles.qualityButtonActive]}
              onPress={() => onChange({ quality: quality.value })}
            >
              <Text style={styles.qualityEmoji}>{quality.emoji}</Text>
              <Text style={[styles.qualityButtonText, active && styles.qualityButtonTextActive]}>
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
