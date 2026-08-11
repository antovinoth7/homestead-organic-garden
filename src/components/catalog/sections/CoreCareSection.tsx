import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { CatalogDetailRow } from '@/components/catalog/CatalogDetailRow';
import { optionsFromLabels } from '@/components/catalog/catalogEditor';
import type { CatalogEditor } from '@/components/catalog/catalogEditor';
import { sanitizeNum } from '@/utils/catalogDraft';
import type { CareFormState } from '@/utils/catalogDraft';
import { CATALOG_FIELD_HELP } from '@/utils/catalogFieldHelp';
import {
  FEEDING_INTENSITY_LABELS,
  FEEDING_INTENSITY_SUGGESTED_DAYS,
  FERTILISER_LABELS,
  SOIL_LABELS,
  SUNLIGHT_LABELS,
  WATER_REQUIREMENT_LABELS,
} from '@/utils/plantLabels';
import type {
  FeedingIntensity,
  FertiliserType,
  SoilType,
  SunlightLevel,
  WaterRequirement,
} from '@/types/database.types';

interface Props {
  editor: CatalogEditor;
}

export function CoreCareSection({ editor }: Props): React.JSX.Element {
  const { careForm, setForm, errors, showErrors, openText, openPicker } = editor;

  const waterOptions = useMemo(() => optionsFromLabels(WATER_REQUIREMENT_LABELS), []);
  const feedingOptions = useMemo(() => optionsFromLabels(FEEDING_INTENSITY_LABELS), []);
  const sunlightOptions = useMemo(() => optionsFromLabels(SUNLIGHT_LABELS), []);
  const soilOptions = useMemo(() => optionsFromLabels(SOIL_LABELS), []);
  const fertiliserOptions = useMemo(() => optionsFromLabels(FERTILISER_LABELS), []);

  const openFrequency = useCallback(
    (title: string, key: 'wateringFrequencyDays' | 'fertilisingFrequencyDays', help: string) =>
      openText({
        title,
        value: careForm[key],
        onCommit: (next) => setForm({ [key]: next } as Partial<CareFormState>),
        keyboardType: 'numeric',
        sanitize: sanitizeNum,
        helpText: help,
      }),
    [openText, careForm, setForm]
  );

  const onWaterRequirement = useCallback(
    () =>
      openPicker({
        title: 'Water requirement',
        options: waterOptions,
        selectedValue: careForm.waterRequirement,
        onSelect: (value) => setForm({ waterRequirement: value as WaterRequirement }),
      }),
    [openPicker, waterOptions, careForm.waterRequirement, setForm]
  );

  const onWateringFrequency = useCallback(
    () =>
      openFrequency(
        'Watering frequency (days)',
        'wateringFrequencyDays',
        CATALOG_FIELD_HELP.wateringFrequencyDays
      ),
    [openFrequency]
  );

  // Picking an intensity also rewrites the fertilising interval — the two are
  // two views of the same decision, and leaving them out of step is a bug
  // report waiting to happen.
  const onFeedingIntensity = useCallback(
    () =>
      openPicker({
        title: 'Feeding intensity',
        options: feedingOptions,
        selectedValue: careForm.feedingIntensity,
        onSelect: (value) => {
          const intensity = value as FeedingIntensity | '';
          setForm({
            feedingIntensity: intensity,
            ...(intensity
              ? {
                  fertilisingFrequencyDays: String(FEEDING_INTENSITY_SUGGESTED_DAYS[intensity]),
                }
              : {}),
          });
        },
        allowClear: true,
      }),
    [openPicker, feedingOptions, careForm.feedingIntensity, setForm]
  );

  const onFertilisingFrequency = useCallback(
    () =>
      openFrequency(
        'Fertilising frequency (days)',
        'fertilisingFrequencyDays',
        CATALOG_FIELD_HELP.fertilisingFrequencyDays
      ),
    [openFrequency]
  );

  const onSunlight = useCallback(
    () =>
      openPicker({
        title: 'Sunlight',
        options: sunlightOptions,
        selectedValue: careForm.sunlight,
        onSelect: (value) => setForm({ sunlight: value as SunlightLevel }),
      }),
    [openPicker, sunlightOptions, careForm.sunlight, setForm]
  );

  const onSoilType = useCallback(
    () =>
      openPicker({
        title: 'Soil type',
        options: soilOptions,
        selectedValue: careForm.soilType,
        onSelect: (value) => setForm({ soilType: value as SoilType }),
        searchable: true,
      }),
    [openPicker, soilOptions, careForm.soilType, setForm]
  );

  const onPreferredFertiliser = useCallback(
    () =>
      openPicker({
        title: 'Preferred fertiliser',
        options: fertiliserOptions,
        selectedValue: careForm.preferredFertiliser,
        onSelect: (value) => setForm({ preferredFertiliser: value as FertiliserType }),
        searchable: true,
      }),
    [openPicker, fertiliserOptions, careForm.preferredFertiliser, setForm]
  );

  const feedingHint = careForm.feedingIntensity
    ? `Suggested: ${FEEDING_INTENSITY_SUGGESTED_DAYS[careForm.feedingIntensity]} days for ${FEEDING_INTENSITY_LABELS[careForm.feedingIntensity].toLowerCase()} feeders`
    : undefined;

  return (
    <View>
      <CatalogDetailRow
        kind="picker"
        label="Water requirement"
        value={WATER_REQUIREMENT_LABELS[careForm.waterRequirement]}
        helpText={CATALOG_FIELD_HELP.waterRequirement}
        onPress={onWaterRequirement}
      />
      <CatalogDetailRow
        kind="text"
        label="Watering frequency"
        value={careForm.wateringFrequencyDays ? `${careForm.wateringFrequencyDays} days` : ''}
        mono
        helpText={CATALOG_FIELD_HELP.wateringFrequencyDays}
        onPress={onWateringFrequency}
        errorText={showErrors ? errors.wateringFrequencyDays : undefined}
      />
      <CatalogDetailRow
        kind="picker"
        label="Feeding intensity"
        value={
          careForm.feedingIntensity ? FEEDING_INTENSITY_LABELS[careForm.feedingIntensity] : ''
        }
        helpText={CATALOG_FIELD_HELP.feedingIntensity}
        onPress={onFeedingIntensity}
      />
      <CatalogDetailRow
        kind="text"
        label="Fertilising frequency"
        value={
          careForm.fertilisingFrequencyDays ? `${careForm.fertilisingFrequencyDays} days` : ''
        }
        mono
        helpText={CATALOG_FIELD_HELP.fertilisingFrequencyDays}
        onPress={onFertilisingFrequency}
        errorText={showErrors ? errors.fertilisingFrequencyDays : undefined}
        hint={feedingHint}
      />
      <CatalogDetailRow
        kind="picker"
        label="Sunlight"
        value={SUNLIGHT_LABELS[careForm.sunlight]}
        helpText={CATALOG_FIELD_HELP.sunlight}
        onPress={onSunlight}
      />
      <CatalogDetailRow
        kind="picker"
        label="Soil type"
        value={SOIL_LABELS[careForm.soilType]}
        helpText={CATALOG_FIELD_HELP.soilType}
        onPress={onSoilType}
      />
      <CatalogDetailRow
        kind="picker"
        label="Preferred fertiliser"
        value={FERTILISER_LABELS[careForm.preferredFertiliser]}
        helpText={CATALOG_FIELD_HELP.preferredFertiliser}
        onPress={onPreferredFertiliser}
        isLast
      />
    </View>
  );
}
