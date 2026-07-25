import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import FloatingLabelInput from '../FloatingLabelInput';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { getPestByName } from '@/config/pests';
import { getDiseaseByName } from '@/config/diseases';
import { getPestImage, getDiseaseImage } from '@/config/referenceAssets';
import {
  IssueSeverity,
  PestDiseaseKind,
  PestStatus,
  PlantType,
  TreatmentEffectiveness,
} from '../../types/database.types';
import {
  getGroupedPests,
  getGroupedDiseases,
  getDefaultGroupedPests,
  getDefaultGroupedDiseases,
  getPestDiseaseEmoji,
  getGroupedTreatments,
  getTreatmentEffortDot,
} from '../../utils/plantHelpers';
import {
  AFFECTED_PARTS,
  PEST_SEVERITY_OPTIONS,
  PEST_STATUS_OPTIONS,
} from '../../utils/journalEntryOptions';
import { sanitizeAlphaNumericSpaces } from '../../utils/textSanitizer';
import { toLocalDateString, formatDateDisplay } from '../../utils/dateHelpers';
import { useTheme } from '../../theme';
import { createStyles } from '../../styles/journalFormStyles';

export interface PestDiseaseFields {
  kind: PestDiseaseKind;
  name: string;
  severity: IssueSeverity;
  status: PestStatus;
  occurredAt: string;
  affectedParts: string[];
  treatment: string;
  treatmentEffectiveness: TreatmentEffectiveness | null;
}

interface Props {
  value: PestDiseaseFields;
  onChange: (patch: Partial<PestDiseaseFields>) => void;
  plantType: PlantType | null;
  plantVariety: string | null;
  /** Inline validation message for the pest/disease name field. */
  errorText?: string;
}

const KIND_OPTIONS: {
  value: PestDiseaseKind;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { value: 'pest', label: 'Pest', icon: 'bug' },
  { value: 'disease', label: 'Disease', icon: 'medical' },
];

const EFFECTIVENESS_OPTIONS: {
  value: TreatmentEffectiveness;
  label: string;
  activeStyle: 'effChipEffectiveActive' | 'effChipPartialActive' | 'effChipIneffectiveActive';
}[] = [
  { value: 'effective', label: '✅ Effective', activeStyle: 'effChipEffectiveActive' },
  { value: 'partially_effective', label: '⚠️ Partially', activeStyle: 'effChipPartialActive' },
  { value: 'ineffective', label: '❌ Ineffective', activeStyle: 'effChipIneffectiveActive' },
];

export function JournalPestDiseaseSection({
  value,
  onChange,
  plantType,
  plantVariety,
  errorText,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customTreatmentMode, setCustomTreatmentMode] = useState(false);

  const plantGroups =
    value.kind === 'pest'
      ? getGroupedPests(plantType, plantVariety)
      : getGroupedDiseases(plantType, plantVariety);
  // Fall back to a generic garden set when no plant is linked (or the linked
  // plant yields no matches) so suggestions still appear.
  const groups =
    plantGroups.length > 0
      ? plantGroups
      : value.kind === 'pest'
        ? getDefaultGroupedPests()
        : getDefaultGroupedDiseases();

  const treatmentGroups = value.name.trim() !== '' ? getGroupedTreatments(value.name) : [];
  const allTreatmentNames = treatmentGroups.flatMap((g) => g.items.map((i) => i.name));
  const isCustom =
    customTreatmentMode || (value.treatment ? !allTreatmentNames.includes(value.treatment) : false);
  const showCustomInput = isCustom || (treatmentGroups.length === 0 && value.name.trim() !== '');

  const toggleAffectedPart = (part: string): void => {
    const next = value.affectedParts.includes(part)
      ? value.affectedParts.filter((p) => p !== part)
      : [...value.affectedParts, part];
    onChange({ affectedParts: next });
  };

  return (
    <View style={styles.harvestSection}>
      <Text style={styles.sectionTitle}>Pest / Disease Details</Text>

      {/* Kind toggle */}
      <View style={styles.pdKindRow}>
        {KIND_OPTIONS.map((opt) => {
          const active = value.kind === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pdKindChip, active && styles.pdKindChipActive]}
              onPress={() => {
                setCustomTreatmentMode(false);
                onChange({ kind: opt.value, name: '', treatment: '' });
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={active ? theme.primary : theme.textTertiary}
              />
              <Text style={[styles.pdKindChipText, active && styles.pdKindChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FloatingLabelInput
        label={`${value.kind === 'pest' ? 'Pest' : 'Disease'} Name`}
        value={value.name}
        onChangeText={(text) => onChange({ name: sanitizeAlphaNumericSpaces(text) })}
        errorText={errorText}
      />

      {/* Preset suggestions */}
      {groups.length > 0 && (
        <>
          <Text style={[styles.label, styles.notesWrapperMarginTop]}>
            Common {value.kind === 'pest' ? 'Pests' : 'Diseases'}:
          </Text>
          <View style={styles.suggestionGroupContainer}>
            {groups.map((group) => (
              <View key={group.category} style={styles.suggestionGroup}>
                <Text style={styles.suggestionGroupLabel}>
                  {group.emoji} {group.category}
                </Text>
                <View style={styles.suggestionGroupChips}>
                  {group.items.map((item) => {
                    const entry =
                      value.kind === 'pest' ? getPestByName(item) : getDiseaseByName(item);
                    const chipImage = entry
                      ? value.kind === 'pest'
                        ? getPestImage(entry.id, entry.imageAsset)
                        : getDiseaseImage(entry.id, entry.imageAsset)
                      : undefined;
                    const active = value.name === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[styles.suggestionChip, active && styles.suggestionChipActive]}
                        onPress={() => onChange({ name: item })}
                      >
                        <ReferenceThumb
                          source={chipImage}
                          emoji={getPestDiseaseEmoji(item, value.kind)}
                          variant="chip"
                        />
                        <Text
                          style={[
                            styles.suggestionChipText,
                            active && styles.suggestionChipTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Occurred date */}
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
        <Text style={value.occurredAt ? styles.dateButtonText : styles.datePlaceholder}>
          {value.occurredAt ? formatDateDisplay(value.occurredAt) : 'Occurred Date'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={value.occurredAt ? new Date(value.occurredAt) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              onChange({ occurredAt: toLocalDateString(selectedDate) });
            }
          }}
        />
      )}

      {/* Severity */}
      <Text style={styles.label}>Severity</Text>
      <View style={styles.qualityButtons}>
        {PEST_SEVERITY_OPTIONS.map((opt) => {
          const active = value.severity === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.qualityButton, active && styles.qualityButtonActive]}
              onPress={() => onChange({ severity: opt.value })}
            >
              <Text style={[styles.qualityButtonText, active && styles.qualityButtonTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Status */}
      <Text style={[styles.label, styles.notesWrapperMarginTop]}>Status</Text>
      <View style={styles.qualityButtons}>
        {PEST_STATUS_OPTIONS.map((opt) => {
          const active = value.status === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.qualityButton, active && styles.qualityButtonActive]}
              onPress={() => onChange({ status: opt.value })}
            >
              <Text style={[styles.qualityButtonText, active && styles.qualityButtonTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Affected parts */}
      <Text style={[styles.label, styles.notesWrapperMarginTop]}>Affected Parts</Text>
      <View style={styles.affectedPartChips}>
        {AFFECTED_PARTS.map((part) => {
          const active = value.affectedParts.includes(part);
          return (
            <TouchableOpacity
              key={part}
              style={[styles.affectedPartChip, active && styles.affectedPartChipActive]}
              onPress={() => toggleAffectedPart(part)}
            >
              <Text
                style={[styles.affectedPartChipText, active && styles.affectedPartChipTextActive]}
              >
                {part}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recommended treatments */}
      {treatmentGroups.length > 0 && (
        <>
          <Text style={styles.label}>Recommended Treatments</Text>
          <Text style={styles.helperText}>🟢 Easy 🟡 Moderate 🔴 Advanced</Text>
          <View style={styles.treatmentGroupContainer}>
            {treatmentGroups.map((group) => (
              <View key={group.method} style={styles.treatmentGroup}>
                <Text style={styles.treatmentGroupLabel}>
                  {group.emoji} {group.label}
                </Text>
                <View style={styles.treatmentGroupChips}>
                  {group.items.map((item) => {
                    const active = value.treatment === item.name;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[styles.treatmentChip, active && styles.treatmentChipActive]}
                        onPress={() => {
                          setCustomTreatmentMode(false);
                          onChange({ treatment: active ? '' : item.name });
                        }}
                      >
                        <Text
                          style={[
                            styles.treatmentChipText,
                            active && styles.treatmentChipTextActive,
                          ]}
                        >
                          {getTreatmentEffortDot(item.effort)} {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.treatmentChip, isCustom && styles.treatmentChipActive]}
            onPress={() => {
              setCustomTreatmentMode(true);
              onChange({ treatment: '' });
            }}
          >
            <Text style={[styles.treatmentChipText, showCustomInput && styles.treatmentChipTextActive]}>
              ✏️ Custom treatment...
            </Text>
          </TouchableOpacity>
        </>
      )}
      {showCustomInput && (
        <View style={styles.notesWrapperMarginTop}>
          <FloatingLabelInput
            label="Custom Treatment"
            value={value.treatment}
            onChangeText={(text) => onChange({ treatment: sanitizeAlphaNumericSpaces(text) })}
            maxLength={500}
          />
          <Text style={styles.charCounter}>{value.treatment.length}/500</Text>
        </View>
      )}

      {/* Treatment effectiveness */}
      {value.treatment.trim() !== '' && (
        <>
          <Text style={[styles.label, styles.notesWrapperMarginTop]}>Treatment Effectiveness</Text>
          <View style={styles.affectedPartChips}>
            {EFFECTIVENESS_OPTIONS.map((opt) => {
              const active = value.treatmentEffectiveness === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.affectedPartChip, active && styles[opt.activeStyle]]}
                  onPress={() =>
                    onChange({ treatmentEffectiveness: active ? null : opt.value })
                  }
                >
                  <Text
                    style={[styles.affectedPartChipText, active && styles.effChipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
