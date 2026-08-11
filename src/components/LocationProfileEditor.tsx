import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStyles } from '@/styles/plotEditStyles';
import { useTheme } from '@/theme';
import {
  DrainageQuality,
  LocationProfile,
  MoistureRetention,
  NutrientLevel,
  WindExposure,
  WaterSource,
} from '@/types/database.types';
import { LOCATION_SOIL_TYPES, SOIL_LABELS } from '@/utils/plantLabels';
import type { EditModalState } from '@/hooks/useLocationManager';

interface Props {
  editModal: EditModalState;
  updateProfile: (patch: Partial<LocationProfile>) => void;
}

const PH_VALUES = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

const DRAINAGE_OPTIONS: { value: DrainageQuality; label: string }[] = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
];

const MOISTURE_OPTIONS: { value: MoistureRetention; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const NPK_OPTIONS: { value: NutrientLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'High' },
];

const WIND_OPTIONS: { value: WindExposure; label: string }[] = [
  { value: 'sheltered', label: 'Sheltered' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'exposed', label: 'Exposed' },
];

const WATER_SOURCE_OPTIONS: { value: WaterSource; label: string }[] = [
  { value: 'rain_fed', label: 'Rain-fed' },
  { value: 'borewell', label: 'Borewell' },
  { value: 'tap', label: 'Tap' },
  { value: 'pond_canal', label: 'Pond/Canal' },
  { value: 'drip', label: 'Drip' },
  { value: 'mixed', label: 'Mixed' },
];

const NPK_FIELDS = [
  { field: 'nitrogenLevel', letter: 'N' },
  { field: 'phosphorusLevel', letter: 'P' },
  { field: 'potassiumLevel', letter: 'K' },
] as const;

/**
 * The soil card of the plot editor: pH and soil type as wrapping pills, the
 * ordinal scales (drainage, moisture, wind, NPK) as full-width segmented
 * controls so the order reads left-to-right.
 *
 * Renders inside `PlotEditModal`'s scroll view — it owns no scroll of its own.
 */
export function LocationProfileEditor({
  editModal,
  updateProfile,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (editModal.type !== 'parent') return null;
  const profile = editModal.profile ?? {};

  return (
    <View style={styles.card}>
      {/* pH */}
      <Text style={styles.groupLabel}>Soil pH</Text>
      <View style={styles.chipWrap}>
        {PH_VALUES.map((ph) => {
          const selected = profile.soilPH === ph;
          return (
            <TouchableOpacity
              key={ph}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => updateProfile({ soilPH: selected ? null : ph })}
            >
              <Text
                style={[
                  styles.chipText,
                  styles.chipTextMono,
                  selected && styles.chipTextSelected,
                ]}
              >
                {ph.toFixed(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Soil type */}
      <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>Soil type</Text>
      <View style={styles.chipWrap}>
        {LOCATION_SOIL_TYPES.map((st) => {
          const selected = profile.soilType === st;
          return (
            <TouchableOpacity
              key={st}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => updateProfile({ soilType: selected ? null : st })}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {SOIL_LABELS[st]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Drainage */}
      <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>Drainage</Text>
      <View style={styles.segmentRow}>
        {DRAINAGE_OPTIONS.map(({ value, label }) => {
          const selected = profile.drainageQuality === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, selected && styles.segmentSelected]}
              onPress={() => updateProfile({ drainageQuality: selected ? null : value })}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Moisture retention */}
      <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>Moisture retention</Text>
      <View style={styles.segmentRow}>
        {MOISTURE_OPTIONS.map(({ value, label }) => {
          const selected = profile.moistureRetention === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, selected && styles.segmentSelected]}
              onPress={() => updateProfile({ moistureRetention: selected ? null : value })}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NPK */}
      <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>NPK levels</Text>
      {NPK_FIELDS.map(({ field, letter }, i) => (
        <View
          key={field}
          style={[styles.npkRow, i === NPK_FIELDS.length - 1 && styles.npkRowLast]}
        >
          <Text style={styles.npkLetter}>{letter}</Text>
          <View style={styles.npkSegments}>
            {NPK_OPTIONS.map(({ value, label }) => {
              const selected = profile[field] === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.segment, selected && styles.segmentSelected]}
                  onPress={() => updateProfile({ [field]: selected ? null : value })}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Wind exposure */}
      <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>Wind exposure</Text>
      <View style={styles.segmentRow}>
        {WIND_OPTIONS.map(({ value, label }) => {
          const selected = profile.windExposure === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, selected && styles.segmentSelected]}
              onPress={() => updateProfile({ windExposure: selected ? null : value })}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Water source */}
      <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>Water source</Text>
      <View style={styles.chipWrap}>
        {WATER_SOURCE_OPTIONS.map(({ value, label }) => {
          const selected = profile.waterSource === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => updateProfile({ waterSource: selected ? null : value })}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
