import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, type ListRenderItemInfo } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { GardenIcon } from '@/components/GardenIcon';
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
  getGroupedTreatments,
} from '../../utils/plantHelpers';
import { TREATMENT_ICON_KEYS } from '@/config/iconRegistry';
import type { VisualIconKey } from '@/types/visual.types';
import {
  AFFECTED_PARTS,
  PEST_SEVERITY_OPTIONS,
  PEST_STATUS_OPTIONS,
  filterSuggestionGroups,
  flattenSuggestionGroups,
} from '../../utils/journalEntryOptions';
import { JournalMoreDetails } from './JournalMoreDetails';
import { sanitizeAlphaNumericSpaces, sanitizeFreeText } from '../../utils/textSanitizer';
import { useTheme } from '../../theme';
import { createStyles } from '../../styles/journalFormStyles';

export interface PestDiseaseFields {
  kind: PestDiseaseKind;
  name: string;
  severity: IssueSeverity;
  status: PestStatus;
  /** YYYY-MM-DD. Follows the entry date — the form owns it, not this section. */
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
  iconKey: VisualIconKey;
  activeStyle: 'effChipEffectiveActive' | 'effChipPartialActive' | 'effChipIneffectiveActive';
}[] = [
  {
    value: 'effective',
    label: 'Effective',
    iconKey: 'general.success',
    activeStyle: 'effChipEffectiveActive',
  },
  {
    value: 'partially_effective',
    label: 'Partially',
    iconKey: 'general.partial',
    activeStyle: 'effChipPartialActive',
  },
  {
    value: 'ineffective',
    label: 'Ineffective',
    iconKey: 'general.error',
    activeStyle: 'effChipIneffectiveActive',
  },
];

const keyExtractor = (name: string): string => name;

interface SuggestionTileProps {
  name: string;
  kind: PestDiseaseKind;
  onSelect: (name: string) => void;
  styles: ReturnType<typeof createStyles>;
  /** Gradient stop colour; SVG stops take props, not styles. */
  scrimColor: string;
}

/**
 * Square reference photo with the preset name laid over a green gradient at
 * its foot; tapping fills the name field.
 */
const SuggestionTile = React.memo(function SuggestionTile({
  name,
  kind,
  onSelect,
  styles,
  scrimColor,
}: SuggestionTileProps): React.JSX.Element {
  const handlePress = useCallback(() => onSelect(name), [onSelect, name]);
  const entry = kind === 'pest' ? getPestByName(name) : getDiseaseByName(name);
  const image = entry
    ? kind === 'pest'
      ? getPestImage(entry.id, entry.imageAsset)
      : getDiseaseImage(entry.id, entry.imageAsset)
    : undefined;

  return (
    <TouchableOpacity
      style={styles.suggestionTile}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <ReferenceThumb
        source={image}
        fallbackIcon={kind === 'pest' ? 'general.pest' : 'general.disease'}
        variant="square"
        recyclingKey={name}
      />
      <View style={styles.suggestionTileScrim} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <SvgLinearGradient id="suggestionTileScrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={scrimColor} stopOpacity="0" />
              <Stop offset="0.45" stopColor={scrimColor} stopOpacity="0.55" />
              <Stop offset="1" stopColor={scrimColor} stopOpacity="0.9" />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#suggestionTileScrim)" />
        </Svg>
      </View>
      <Text style={styles.suggestionTileName} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
});

export function JournalPestDiseaseSection({
  value,
  onChange,
  plantType,
  plantVariety,
  errorText,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  // Narrow the presets to the typed name; hidden once a preset is picked, so
  // the row never needs a selected state. One ungrouped row: the farmer
  // matches what they saw by photo and name, not by pest category.
  const suggestions = flattenSuggestionGroups(filterSuggestionGroups(groups, value.name));

  const handleSelectSuggestion = useCallback(
    (name: string): void => onChange({ name }),
    [onChange]
  );
  const renderSuggestion = useCallback(
    ({ item }: ListRenderItemInfo<string>): React.JSX.Element => (
      <SuggestionTile
        name={item}
        kind={value.kind}
        onSelect={handleSelectSuggestion}
        styles={styles}
        scrimColor={theme.scrim}
      />
    ),
    [value.kind, handleSelectSuggestion, styles, theme.scrim]
  );

  const treatmentGroups = value.name.trim() !== '' ? getGroupedTreatments(value.name) : [];
  const allTreatmentNames = treatmentGroups.flatMap((g) => g.items.map((i) => i.name));
  const isCustom =
    customTreatmentMode || (value.treatment ? !allTreatmentNames.includes(value.treatment) : false);
  const showCustomInput = isCustom || (treatmentGroups.length === 0 && value.name.trim() !== '');

  // Folded extras open on their own when any of them already holds a value.
  const hasExtras =
    value.affectedParts.length > 0 ||
    value.treatment.trim() !== '' ||
    value.treatmentEffectiveness !== null;
  const partsCount = value.affectedParts.length;
  const moreSummary = [
    partsCount > 0 ? `${partsCount} ${partsCount === 1 ? 'part' : 'parts'}` : '',
    value.treatment.trim(),
  ]
    .filter(Boolean)
    .join(' · ');

  const toggleAffectedPart = (part: string): void => {
    const next = value.affectedParts.includes(part)
      ? value.affectedParts.filter((p) => p !== part)
      : [...value.affectedParts, part];
    onChange({ affectedParts: next });
  };

  return (
    <View style={styles.sectionCard}>
      {/* Kind toggle */}
      <View style={styles.segmentTrack}>
        {KIND_OPTIONS.map((opt) => {
          const active = value.kind === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.segment, active && styles.segmentActive]}
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
                color={active ? theme.text : theme.textTertiary}
              />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
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
      {suggestions.length > 0 && (
        <>
          <Text style={styles.suggestionHeading}>
            Common {value.kind === 'pest' ? 'pests' : 'diseases'}
          </Text>
          <FlatList
            data={suggestions}
            horizontal
            keyExtractor={keyExtractor}
            renderItem={renderSuggestion}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionRow}
            contentContainerStyle={styles.suggestionRowContent}
          />
        </>
      )}

      {/* Severity */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Severity</Text>
        <View style={styles.optionGrid}>
          {PEST_SEVERITY_OPTIONS.map((opt) => {
            const active = value.severity === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionTile, active && styles.optionTileActive]}
                onPress={() => onChange({ severity: opt.value })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.optionTileText, active && styles.optionTileTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Status */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.optionGrid}>
          {PEST_STATUS_OPTIONS.map((opt) => {
            const active = value.status === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionTile, active && styles.optionTileActive]}
                onPress={() => onChange({ status: opt.value })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.optionTileText, active && styles.optionTileTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <JournalMoreDetails initiallyExpanded={hasExtras} summary={moreSummary}>
        {/* Affected parts */}
        <Text style={styles.label}>Affected parts</Text>
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
            <View style={styles.treatmentHeader}>
              <Text style={styles.label}>Treatment</Text>
              <View style={styles.effortLegend}>
                <View style={[styles.effortDot, styles.effortEasy]} />
                <Text style={styles.effortLegendText}>Easy</Text>
                <View style={[styles.effortDot, styles.effortModerate]} />
                <Text style={styles.effortLegendText}>Moderate</Text>
                <View style={[styles.effortDot, styles.effortAdvanced]} />
                <Text style={styles.effortLegendText}>Advanced</Text>
              </View>
            </View>
            <View style={styles.treatmentGroupContainer}>
              {treatmentGroups.map((group) => (
                <View key={group.method} style={styles.treatmentGroup}>
                  <View style={styles.groupLabelRow}>
                    <GardenIcon
                      name={TREATMENT_ICON_KEYS[group.method]}
                      size={14}
                      color={theme.textSecondary}
                    />
                    <Text style={styles.treatmentGroupLabel}>{group.label}</Text>
                  </View>
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
                          <View style={styles.treatmentChipContent}>
                            <View
                              style={[
                                styles.effortDot,
                                item.effort === 'easy'
                                  ? styles.effortEasy
                                  : item.effort === 'moderate'
                                    ? styles.effortModerate
                                    : styles.effortAdvanced,
                              ]}
                            />
                            <Text
                              style={[
                                styles.treatmentChipText,
                                active && styles.treatmentChipTextActive,
                              ]}
                            >
                              {item.name}
                            </Text>
                          </View>
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
              <GardenIcon
                name="general.edit"
                size={14}
                color={showCustomInput ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.treatmentChipText,
                  showCustomInput && styles.treatmentChipTextActive,
                ]}
              >
                Custom treatment...
              </Text>
            </TouchableOpacity>
          </>
        )}
        {showCustomInput && (
          <View style={styles.notesWrapperMarginTop}>
            <FloatingLabelInput
              label="Custom Treatment"
              value={value.treatment}
              onChangeText={(text) => onChange({ treatment: sanitizeFreeText(text) })}
              maxLength={500}
            />
            <Text style={styles.charCounter}>{value.treatment.length}/500</Text>
          </View>
        )}

        {/* Treatment effectiveness */}
        {value.treatment.trim() !== '' && (
          <>
            <Text style={[styles.label, styles.notesWrapperMarginTop]}>Did it work?</Text>
            <View style={styles.affectedPartChips}>
              {EFFECTIVENESS_OPTIONS.map((opt) => {
                const active = value.treatmentEffectiveness === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.affectedPartChip, active && styles[opt.activeStyle]]}
                    onPress={() => onChange({ treatmentEffectiveness: active ? null : opt.value })}
                  >
                    <GardenIcon
                      name={opt.iconKey}
                      size={15}
                      color={active ? theme.textInverse : theme.textSecondary}
                    />
                    <Text style={[styles.affectedPartChipText, active && styles.effChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </JournalMoreDetails>
    </View>
  );
}
