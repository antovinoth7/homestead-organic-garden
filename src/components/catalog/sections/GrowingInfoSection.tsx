import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { CatalogDetailRow } from '@/components/catalog/CatalogDetailRow';
import { CatalogRangeRow } from '@/components/catalog/CatalogRangeRow';
import type { CatalogEditor } from '@/components/catalog/catalogEditor';
import { sanitizeDecimal, sanitizeNum } from '@/utils/catalogDraft';
import { CATALOG_FIELD_HELP } from '@/utils/catalogFieldHelp';
import { GROWING_SEASON_OPTIONS } from '@/utils/plantLabels';

interface Props {
  editor: CatalogEditor;
}

export function GrowingInfoSection({ editor }: Props): React.JSX.Element {
  const { careForm, setForm, errors, showErrors, openText, openPicker, openRange } = editor;

  // Already {label, value} — the stored value is the short form, the label the
  // long one, so they must not be collapsed into each other.
  const seasonOptions = GROWING_SEASON_OPTIONS;
  const seasonLabel = useMemo(
    () => GROWING_SEASON_OPTIONS.find((o) => o.value === careForm.growingSeason)?.label ?? '',
    [careForm.growingSeason]
  );

  const onGrowingSeason = useCallback(
    () =>
      openPicker({
        title: 'Growing season',
        options: seasonOptions,
        selectedValue: careForm.growingSeason,
        onSelect: (growingSeason) => setForm({ growingSeason }),
        allowClear: true,
      }),
    [openPicker, seasonOptions, careForm.growingSeason, setForm]
  );

  const onDaysToHarvest = useCallback(
    () =>
      openRange({
        title: 'Days to harvest',
        min: careForm.daysToHarvestMin,
        max: careForm.daysToHarvestMax,
        minLabel: 'Min days',
        maxLabel: 'Max days',
        helpText: CATALOG_FIELD_HELP.daysToHarvest,
        onCommit: (daysToHarvestMin, daysToHarvestMax) =>
          setForm({ daysToHarvestMin, daysToHarvestMax }),
      }),
    [openRange, careForm.daysToHarvestMin, careForm.daysToHarvestMax, setForm]
  );

  const onYearsToFirstHarvest = useCallback(
    () =>
      openText({
        title: 'Years to first harvest',
        value: careForm.yearsToFirstHarvest,
        onCommit: (yearsToFirstHarvest) => setForm({ yearsToFirstHarvest }),
        keyboardType: 'numeric',
        sanitize: sanitizeNum,
        helpText: CATALOG_FIELD_HELP.yearsToFirstHarvest,
      }),
    [openText, careForm.yearsToFirstHarvest, setForm]
  );

  const onHeight = useCallback(
    () =>
      openRange({
        title: 'Height (cm)',
        min: careForm.heightCmMin,
        max: careForm.heightCmMax,
        minLabel: 'Min cm',
        maxLabel: 'Max cm',
        helpText: CATALOG_FIELD_HELP.heightCm,
        onCommit: (heightCmMin, heightCmMax) => setForm({ heightCmMin, heightCmMax }),
      }),
    [openRange, careForm.heightCmMin, careForm.heightCmMax, setForm]
  );

  const onSpacing = useCallback(
    () =>
      openText({
        title: 'Spacing (cm)',
        value: careForm.spacingCm,
        onCommit: (spacingCm) => setForm({ spacingCm }),
        keyboardType: 'numeric',
        sanitize: sanitizeNum,
        helpText: CATALOG_FIELD_HELP.spacingCm,
      }),
    [openText, careForm.spacingCm, setForm]
  );

  const onPlantingDepth = useCallback(
    () =>
      openText({
        title: 'Planting depth (cm)',
        value: careForm.plantingDepthCm,
        onCommit: (plantingDepthCm) => setForm({ plantingDepthCm }),
        keyboardType: 'decimal-pad',
        sanitize: sanitizeDecimal,
        helpText: CATALOG_FIELD_HELP.plantingDepthCm,
      }),
    [openText, careForm.plantingDepthCm, setForm]
  );

  const onGerminationDays = useCallback(
    () =>
      openRange({
        title: 'Germination days',
        min: careForm.germinationDaysMin,
        max: careForm.germinationDaysMax,
        minLabel: 'Min days',
        maxLabel: 'Max days',
        helpText: CATALOG_FIELD_HELP.germinationDays,
        onCommit: (germinationDaysMin, germinationDaysMax) =>
          setForm({ germinationDaysMin, germinationDaysMax }),
      }),
    [openRange, careForm.germinationDaysMin, careForm.germinationDaysMax, setForm]
  );

  const onGerminationTemp = useCallback(
    () =>
      openRange({
        title: 'Germination temp (°C)',
        min: careForm.germinationTempMin,
        max: careForm.germinationTempMax,
        minLabel: 'Min °C',
        maxLabel: 'Max °C',
        decimal: true,
        helpText: CATALOG_FIELD_HELP.germinationTempC,
        onCommit: (germinationTempMin, germinationTempMax) =>
          setForm({ germinationTempMin, germinationTempMax }),
      }),
    [openRange, careForm.germinationTempMin, careForm.germinationTempMax, setForm]
  );

  const onSoilPh = useCallback(
    () =>
      openRange({
        title: 'Soil pH range',
        min: careForm.soilPhMin,
        max: careForm.soilPhMax,
        minLabel: 'Min pH',
        maxLabel: 'Max pH',
        decimal: true,
        helpText: CATALOG_FIELD_HELP.soilPhRange,
        onCommit: (soilPhMin, soilPhMax) => setForm({ soilPhMin, soilPhMax }),
      }),
    [openRange, careForm.soilPhMin, careForm.soilPhMax, setForm]
  );

  return (
    <View>
      <CatalogDetailRow
        kind="picker"
        label="Growing season"
        value={seasonLabel}
        helpText={CATALOG_FIELD_HELP.growingSeason}
        onPress={onGrowingSeason}
      />
      <CatalogRangeRow
        label="Days to harvest"
        min={careForm.daysToHarvestMin}
        max={careForm.daysToHarvestMax}
        unit="days"
        helpText={CATALOG_FIELD_HELP.daysToHarvest}
        onPress={onDaysToHarvest}
        errorText={showErrors ? errors.daysToHarvest : undefined}
      />
      <CatalogDetailRow
        kind="text"
        label="Years to first harvest"
        value={careForm.yearsToFirstHarvest}
        mono
        helpText={CATALOG_FIELD_HELP.yearsToFirstHarvest}
        onPress={onYearsToFirstHarvest}
      />
      <CatalogRangeRow
        label="Height"
        min={careForm.heightCmMin}
        max={careForm.heightCmMax}
        unit="cm"
        helpText={CATALOG_FIELD_HELP.heightCm}
        onPress={onHeight}
        errorText={showErrors ? errors.heightCm : undefined}
      />
      <CatalogDetailRow
        kind="text"
        label="Spacing"
        value={careForm.spacingCm ? `${careForm.spacingCm} cm` : ''}
        mono
        helpText={CATALOG_FIELD_HELP.spacingCm}
        onPress={onSpacing}
      />
      <CatalogDetailRow
        kind="text"
        label="Planting depth"
        value={careForm.plantingDepthCm ? `${careForm.plantingDepthCm} cm` : ''}
        mono
        helpText={CATALOG_FIELD_HELP.plantingDepthCm}
        onPress={onPlantingDepth}
      />
      <CatalogRangeRow
        label="Germination days"
        min={careForm.germinationDaysMin}
        max={careForm.germinationDaysMax}
        unit="days"
        helpText={CATALOG_FIELD_HELP.germinationDays}
        onPress={onGerminationDays}
        errorText={showErrors ? errors.germinationDays : undefined}
      />
      <CatalogRangeRow
        label="Germination temp"
        min={careForm.germinationTempMin}
        max={careForm.germinationTempMax}
        unit="°C"
        helpText={CATALOG_FIELD_HELP.germinationTempC}
        onPress={onGerminationTemp}
        errorText={showErrors ? errors.germinationTempC : undefined}
      />
      <CatalogRangeRow
        label="Soil pH range"
        min={careForm.soilPhMin}
        max={careForm.soilPhMax}
        helpText={CATALOG_FIELD_HELP.soilPhRange}
        onPress={onSoilPh}
        errorText={showErrors ? errors.soilPhRange : undefined}
        isLast
      />
    </View>
  );
}
