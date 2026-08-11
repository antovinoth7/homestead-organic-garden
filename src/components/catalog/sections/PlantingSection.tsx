import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { CatalogDetailRow } from '@/components/catalog/CatalogDetailRow';
import { optionsFromLabels } from '@/components/catalog/catalogEditor';
import type { CatalogEditor } from '@/components/catalog/catalogEditor';
import { CATALOG_FIELD_HELP } from '@/utils/catalogFieldHelp';
import { GROWTH_STAGE_DESCRIPTIONS, GROWTH_STAGE_LABELS } from '@/utils/plantLabels';
import type { GrowthStage } from '@/types/database.types';

interface Props {
  editor: CatalogEditor;
}

export function PlantingSection({ editor }: Props): React.JSX.Element {
  const { careForm, setForm, openPicker } = editor;

  const stageOptions = useMemo(
    () => optionsFromLabels(GROWTH_STAGE_LABELS, GROWTH_STAGE_DESCRIPTIONS),
    []
  );

  const onStage = useCallback(
    () =>
      openPicker({
        title: 'Initial growth stage',
        options: stageOptions,
        selectedValue: careForm.initialGrowthStage,
        onSelect: (value) => setForm({ initialGrowthStage: value as GrowthStage }),
      }),
    [openPicker, stageOptions, careForm.initialGrowthStage, setForm]
  );

  return (
    <View>
      <CatalogDetailRow
        kind="picker"
        label="Initial growth stage"
        value={GROWTH_STAGE_LABELS[careForm.initialGrowthStage]}
        helpText={CATALOG_FIELD_HELP.initialGrowthStage}
        onPress={onStage}
        isLast
      />
    </View>
  );
}
