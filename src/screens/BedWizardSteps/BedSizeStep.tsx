import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { Step2Data, Step3Data } from '@/hooks/useBedCreationWizard';
import { BedType } from '@/types/database.types';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import { BED_TYPE_LABEL } from '@/utils/bedNameGenerator';
import { SOIL_LABELS } from '@/utils/plantLabels';
import { estimatePlantCapacity } from '@/utils/plantCapacity';

const M_TO_FT = 3.28084;
const M_TO_CM = 100;

function toFt(m: number): number {
  return parseFloat((m * M_TO_FT).toFixed(1));
}

function toM(ft: number): number {
  return parseFloat((ft / M_TO_FT).toFixed(2));
}

function toCm(m: number): number {
  return parseFloat((m * M_TO_CM).toFixed(0));
}

function fromCm(cm: number): number {
  return parseFloat((cm / M_TO_CM).toFixed(2));
}

const HARVEST_COEFF: Record<BedType, number> = {
  leafy: 0.8,
  fruiting: 0.6,
  root_legume: 0.5,
  climber_trellis: 0.5,
  three_sisters: 0.6,
  spice: 0.3,
  medicinal_guild: 0.2,
};
const DEFAULT_HARVEST_COEFF = 0.5;

interface Props {
  data: Step3Data;
  onChange: (data: Partial<Step3Data>) => void;
  bedType?: BedType | null;
  step2?: Step2Data;
}

const SLOPE_SHORT: Record<string, string> = {
  flat: 'Flat',
  gentle: 'Gentle',
  moderate: 'Moderate',
  steep: 'Steep',
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
  const [unit, setUnit] = useState<'m' | 'cm' | 'ft'>('m');

  const displayWidth =
    unit === 'ft' ? toFt(data.width_m) : unit === 'cm' ? toCm(data.width_m) : data.width_m;
  const displayLength =
    unit === 'ft' ? toFt(data.length_m) : unit === 'cm' ? toCm(data.length_m) : data.length_m;
  const displayUnit = unit;
  const widthStep = unit === 'ft' ? 0.5 : unit === 'cm' ? 10 : 0.1;
  const lengthStep = unit === 'cm' ? 50 : 0.5;
  const widthMin = unit === 'ft' ? toFt(0.6) : unit === 'cm' ? 60 : 0.6;
  const widthMax = unit === 'ft' ? toFt(3) : unit === 'cm' ? 300 : 3;
  const lengthMin = unit === 'ft' ? toFt(1) : unit === 'cm' ? 100 : 1;
  const lengthMax = unit === 'ft' ? toFt(10) : unit === 'cm' ? 1000 : 10;

  const conditionTags = useMemo(() => {
    const tags: string[] = [];
    if (bedType) tags.push(BED_TYPE_LABEL[bedType] ?? bedType);
    if (step2?.soil_type) tags.push(SOIL_LABELS[step2.soil_type]);
    if (step2?.slope) tags.push(SLOPE_SHORT[step2.slope] ?? step2.slope);
    return tags;
  }, [bedType, step2]);

  const { min: plantsMin, max: plantsMax } = estimatePlantCapacity(
    bedType ?? null,
    data.width_m,
    data.length_m,
  );
  const coeff = bedType ? (HARVEST_COEFF[bedType] ?? DEFAULT_HARVEST_COEFF) : DEFAULT_HARVEST_COEFF;
  const harvestKg = (Math.round(data.area_sqm * coeff * 10) / 10).toFixed(1);

  const updateDimension = (field: 'width_m' | 'length_m', value: number): void => {
    const updated = { ...data, [field]: value };
    onChange({ ...updated, area_sqm: parseFloat((updated.width_m * updated.length_m).toFixed(2)) });
  };

  const handleWidthChange = (displayVal: number): void => {
    const m = unit === 'ft' ? toM(displayVal) : unit === 'cm' ? fromCm(displayVal) : displayVal;
    updateDimension('width_m', m);
  };
  const handleLengthChange = (displayVal: number): void => {
    const m = unit === 'ft' ? toM(displayVal) : unit === 'cm' ? fromCm(displayVal) : displayVal;
    updateDimension('length_m', m);
  };

  const rec = data.sizeRecommendation;

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
              {unit === 'ft' ? toFt(rec.width_m) : unit === 'cm' ? toCm(rec.width_m) : rec.width_m}
            </Text>
            <Text style={styles.szSizeSep}> × </Text>
            <Text style={styles.szSizeValue}>
              {unit === 'ft' ? toFt(rec.length_m) : unit === 'cm' ? toCm(rec.length_m) : rec.length_m}
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
              <Text style={styles.szMetricLabel}>plants possible</Text>
            </View>
            <View style={styles.szMetricDivider} />
            <View style={styles.szMetricChip}>
              <Text style={styles.szMetricValue}>~{harvestKg} kg</Text>
              <Text style={styles.szMetricLabel}>harvest/wk</Text>
            </View>
          </View>
        </View>
      )}

      {/* Custom size controls */}
      <View style={styles.szCustomHeader}>
        <Text style={styles.szSectionLabel}>CUSTOM SIZE</Text>
        <View style={styles.szUnitToggle}>
          <TouchableOpacity
            style={[styles.szUnitBtn, unit === 'm' && styles.szUnitBtnActive]}
            onPress={() => setUnit('m')}
            activeOpacity={0.7}
          >
            <Text style={[styles.szUnitBtnText, unit === 'm' && styles.szUnitBtnTextActive]}>m</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.szUnitBtn, unit === 'cm' && styles.szUnitBtnActive]}
            onPress={() => setUnit('cm')}
            activeOpacity={0.7}
          >
            <Text style={[styles.szUnitBtnText, unit === 'cm' && styles.szUnitBtnTextActive]}>cm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.szUnitBtn, unit === 'ft' && styles.szUnitBtnActive]}
            onPress={() => setUnit('ft')}
            activeOpacity={0.7}
          >
            <Text style={[styles.szUnitBtnText, unit === 'ft' && styles.szUnitBtnTextActive]}>ft</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.szArmReachHint}>
        <Text style={styles.szArmReachText}>
          💡 Keep width ≤ {unit === 'ft' ? '4 ft' : unit === 'cm' ? '120 cm' : '1.2 m'} — reach the centre without stepping in
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
    </ScrollView>
  );
}
