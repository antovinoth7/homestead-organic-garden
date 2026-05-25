import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { Step2Data, Step3Data } from '@/hooks/useBedCreationWizard';
import { BedType } from '@/types/database.types';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import { getSoilPrepSteps } from '@/config/beds/soilPrepEngine';

const M_TO_FT = 3.28084;

function toFt(m: number): number {
  return parseFloat((m * M_TO_FT).toFixed(1));
}

function toM(ft: number): number {
  return parseFloat((ft / M_TO_FT).toFixed(2));
}

interface Props {
  data: Step3Data;
  onChange: (data: Partial<Step3Data>) => void;
  bedType?: BedType | null;
  step2?: Step2Data;
}

const BED_TYPE_SHORT: Record<string, string> = {
  leafy: 'Leafy',
  fruiting: 'Fruiting',
  spice: 'Spice',
  root_legume: 'Root/Legume',
  climber_trellis: 'Climber',
  coconut_intercrop: 'Coconut',
  three_sisters: 'Three Sisters',
  medicinal_guild: 'Medicinal',
};
const SOIL_SHORT: Record<string, string> = {
  garden_soil: 'Garden soil',
  laterite: 'Laterite',
  red_loam: 'Red loam',
  black_cotton: 'Black cotton',
  coastal_sandy: 'Sandy',
  clay_loam: 'Clay',
  sandy_loam: 'Sandy loam',
};
const SLOPE_SHORT: Record<string, string> = {
  flat: 'Flat',
  gentle: 'Gentle',
  moderate: 'Moderate',
  steep: 'Steep',
};

interface SizePreset {
  label: string;
  width_m: number;
  length_m: number;
  landHint: string;
}

const COMPACT_PRESET: SizePreset = {
  label: 'Compact',
  width_m: 1.0,
  length_m: 3.0,
  landHint: '5c land',
};
const EXTENDED_PRESET: SizePreset = {
  label: 'Extended',
  width_m: 1.2,
  length_m: 5.0,
  landHint: '25c+',
};

function CircleStepper({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const canDec = value > min;
  const canInc = value < max;
  return (
    <View style={styles.szStepperRow}>
      <Text style={styles.szStepperLabel}>{label}</Text>
      <View style={styles.szStepperControls}>
        <TouchableOpacity
          onPress={() => canDec && onChange(parseFloat((value - step).toFixed(1)))}
          style={[
            styles.szCircleBtn,
            styles.szCircleBtnMinus,
            !canDec && styles.szCircleBtnDisabled,
          ]}
          activeOpacity={canDec ? 0.7 : 1}
        >
          <Text style={[styles.szCircleBtnText, !canDec && styles.szCircleBtnTextDisabled]}>−</Text>
        </TouchableOpacity>
        <Text style={styles.szStepperValue}>
          {value} <Text style={styles.szStepperUnit}>{unit}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => canInc && onChange(parseFloat((value + step).toFixed(1)))}
          style={[
            styles.szCircleBtn,
            styles.szCircleBtnPlus,
            !canInc && styles.szCircleBtnDisabled,
          ]}
          activeOpacity={canInc ? 0.7 : 1}
        >
          <Text
            style={[
              styles.szCircleBtnText,
              styles.szCircleBtnTextPlus,
              !canInc && styles.szCircleBtnTextDisabled,
            ]}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BedSizeStep({ data, onChange, bedType, step2 }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [useFeet, setUseFeet] = useState(false);

  const displayWidth = useFeet ? toFt(data.width_m) : data.width_m;
  const displayLength = useFeet ? toFt(data.length_m) : data.length_m;
  const displayUnit = useFeet ? 'ft' : 'm';
  const widthStep = useFeet ? 0.5 : 0.1;
  const lengthStep = useFeet ? 0.5 : 0.5;
  const widthMin = useFeet ? toFt(0.6) : 0.6;
  const widthMax = useFeet ? toFt(3) : 3;
  const lengthMin = useFeet ? toFt(1) : 1;
  const lengthMax = useFeet ? toFt(10) : 10;

  const conditionTags = useMemo(() => {
    const tags: string[] = [];
    if (bedType) tags.push(BED_TYPE_SHORT[bedType] ?? bedType);
    if (step2?.soil_type) tags.push(SOIL_SHORT[step2.soil_type] ?? step2.soil_type);
    if (step2?.slope) tags.push(SLOPE_SHORT[step2.slope] ?? step2.slope);
    return tags;
  }, [bedType, step2]);

  const plantsMin = Math.round(data.area_sqm * 2);
  const plantsMax = Math.round(data.area_sqm * 2.5);
  const harvestKg = (Math.round(data.area_sqm * 0.6 * 10) / 10).toFixed(1);

  const updateDimension = (field: 'width_m' | 'length_m', value: number): void => {
    const updated = { ...data, [field]: value };
    onChange({ ...updated, area_sqm: parseFloat((updated.width_m * updated.length_m).toFixed(2)) });
  };

  const handleWidthChange = (displayVal: number): void => {
    const m = useFeet ? toM(displayVal) : displayVal;
    updateDimension('width_m', m);
  };
  const handleLengthChange = (displayVal: number): void => {
    const m = useFeet ? toM(displayVal) : displayVal;
    updateDimension('length_m', m);
  };

  const applyPreset = (preset: SizePreset): void => {
    onChange({
      width_m: preset.width_m,
      length_m: preset.length_m,
      area_sqm: parseFloat((preset.width_m * preset.length_m).toFixed(2)),
    });
  };

  const isPresetSelected = (preset: SizePreset): boolean =>
    data.width_m === preset.width_m && data.length_m === preset.length_m;

  const prepSteps = useMemo(() => {
    if (!step2) return [];
    return getSoilPrepSteps({
      soil_type: step2.soil_type,
      prev_crop_family: step2.prev_crop_family,
      prev_crop_season: step2.prev_crop_season,
      pest_history: step2.pest_history,
      currentMonth: new Date().getMonth() + 1,
    });
  }, [step2]);

  const rec = data.sizeRecommendation;

  const sizePresets = useMemo(
    (): SizePreset[] => [
      COMPACT_PRESET,
      {
        label: 'Recommended',
        width_m: rec?.width_m ?? 1.2,
        length_m: rec?.length_m ?? 3.5,
        landHint: '10–25c',
      },
      EXTENDED_PRESET,
    ],
    [rec]
  );

  return (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      {/* Recommendation card */}
      {rec && (
        <View style={styles.szRecCard}>
          <View style={styles.szRecHeader}>
            <Text style={styles.szRecTitle}>Recommended for your conditions</Text>
            {conditionTags.length > 0 && (
              <Text style={styles.szRecTags} numberOfLines={2}>
                {conditionTags.join(' · ')}
              </Text>
            )}
          </View>

          <Text style={styles.szOptimalLabel}>OPTIMAL SIZE</Text>
          <View style={styles.szSizeRow}>
            <Text style={styles.szSizeValue}>
              {useFeet ? toFt(rec.width_m) : rec.width_m}
            </Text>
            <Text style={styles.szSizeSep}> × </Text>
            <Text style={styles.szSizeValue}>
              {useFeet ? toFt(rec.length_m) : rec.length_m}
            </Text>
            <Text style={styles.szSizeUnit}> {displayUnit}</Text>
          </View>

          <Text style={styles.szRationale}>{rec.rationale}</Text>

          <View style={styles.szMetricsRow}>
            <View style={styles.szMetricChip}>
              <Text style={styles.szMetricValue}>{data.area_sqm}</Text>
              <Text style={styles.szMetricLabel}>sq metres</Text>
            </View>
            <View style={styles.szMetricDivider} />
            <View style={styles.szMetricChip}>
              <Text style={styles.szMetricValue}>
                {plantsMin}–{plantsMax}
              </Text>
              <Text style={styles.szMetricLabel}>plants fit</Text>
            </View>
            <View style={styles.szMetricDivider} />
            <View style={styles.szMetricChip}>
              <Text style={styles.szMetricValue}>~{harvestKg} kg</Text>
              <Text style={styles.szMetricLabel}>harvest/wk</Text>
            </View>
          </View>
        </View>
      )}

      {/* Size presets */}
      <Text style={styles.szSectionLabelSpaced}>SIZE OPTIONS</Text>
      <View style={styles.szPresetRow}>
        {sizePresets.map((preset) => {
          const selected = isPresetSelected(preset);
          return (
            <TouchableOpacity
              key={preset.label}
              style={[styles.szPresetChip, selected && styles.szPresetChipSelected]}
              onPress={() => applyPreset(preset)}
              activeOpacity={0.7}
            >
              <Text style={[styles.szPresetChipSize, selected && styles.szPresetChipSizeSelected]}>
                {useFeet
                  ? `${toFt(preset.width_m)} × ${toFt(preset.length_m)} ft`
                  : `${preset.width_m} × ${preset.length_m}m`}
              </Text>
              <Text style={[styles.szPresetChipName, selected && styles.szPresetChipNameSelected]}>
                {preset.label}
                {selected ? ' ✓' : ''}
              </Text>
              <Text style={[styles.szPresetChipHint, selected && styles.szPresetChipHintSelected]}>
                {preset.landHint}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom size controls */}
      <View style={styles.szCustomHeader}>
        <Text style={styles.szSectionLabel}>CUSTOM SIZE</Text>
        <View style={styles.szUnitToggle}>
          <TouchableOpacity
            style={[styles.szUnitBtn, !useFeet && styles.szUnitBtnActive]}
            onPress={() => setUseFeet(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.szUnitBtnText, !useFeet && styles.szUnitBtnTextActive]}>m</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.szUnitBtn, useFeet && styles.szUnitBtnActive]}
            onPress={() => setUseFeet(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.szUnitBtnText, useFeet && styles.szUnitBtnTextActive]}>ft</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.szArmReachHint}>
        <Text style={styles.szArmReachText}>
          💡 Keep width ≤ {useFeet ? '4 ft' : '1.2 m'} — reach the centre without stepping in
        </Text>
      </View>

      <CircleStepper
        label={`Width (${displayUnit})`}
        value={displayWidth}
        unit={displayUnit}
        min={widthMin}
        max={widthMax}
        step={widthStep}
        onChange={handleWidthChange}
      />
      <CircleStepper
        label={`Length (${displayUnit})`}
        value={displayLength}
        unit={displayUnit}
        min={lengthMin}
        max={lengthMax}
        step={lengthStep}
        onChange={handleLengthChange}
      />

      {/* Before planting prep card */}
      {prepSteps.length > 0 && (
        <View style={styles.szPrepCard}>
          <Text style={styles.szPrepCardTitle}>Before planting — prep for your conditions</Text>
          {prepSteps.map((s, i) => (
            <View key={i} style={styles.szPrepStepRow}>
              <View style={styles.szPrepStepNumber}>
                <Text style={styles.szPrepStepNumberText}>{s.number}</Text>
              </View>
              <View style={styles.szPrepStepContent}>
                <Text style={styles.szPrepStepText}>{s.text}</Text>
                <Text style={styles.szPrepStepDetail}>{s.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
