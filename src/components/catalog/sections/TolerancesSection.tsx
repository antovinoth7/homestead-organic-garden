import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { CatalogDetailRow } from '@/components/catalog/CatalogDetailRow';
import { optionsFromLabels } from '@/components/catalog/catalogEditor';
import type { CatalogEditor } from '@/components/catalog/catalogEditor';
import { CATALOG_FIELD_HELP } from '@/utils/catalogFieldHelp';
import { TOLERANCE_LABELS } from '@/utils/plantLabels';
import type { ToleranceLevel } from '@/types/database.types';

interface Props {
  editor: CatalogEditor;
  /** From the bundled profile — undefined when the data has no verdict. */
  petToxicity?: boolean;
}

export function TolerancesSection({ editor, petToxicity }: Props): React.JSX.Element {
  const { careForm, setForm, openPicker } = editor;

  const toleranceOptions = useMemo(() => optionsFromLabels(TOLERANCE_LABELS), []);

  const onHeat = useCallback(
    () =>
      openPicker({
        title: 'Heat tolerance',
        options: toleranceOptions,
        selectedValue: careForm.heatTolerance,
        onSelect: (value) => setForm({ heatTolerance: value as ToleranceLevel | '' }),
        allowClear: true,
      }),
    [openPicker, toleranceOptions, careForm.heatTolerance, setForm]
  );

  const onDrought = useCallback(
    () =>
      openPicker({
        title: 'Drought tolerance',
        options: toleranceOptions,
        selectedValue: careForm.droughtTolerance,
        onSelect: (value) => setForm({ droughtTolerance: value as ToleranceLevel | '' }),
        allowClear: true,
      }),
    [openPicker, toleranceOptions, careForm.droughtTolerance, setForm]
  );

  return (
    <View>
      <CatalogDetailRow
        kind="picker"
        label="Heat tolerance"
        value={careForm.heatTolerance ? TOLERANCE_LABELS[careForm.heatTolerance] : ''}
        helpText={CATALOG_FIELD_HELP.heatTolerance}
        onPress={onHeat}
      />
      <CatalogDetailRow
        kind="picker"
        label="Drought tolerance"
        value={careForm.droughtTolerance ? TOLERANCE_LABELS[careForm.droughtTolerance] : ''}
        helpText={CATALOG_FIELD_HELP.droughtTolerance}
        onPress={onDrought}
        isLast={petToxicity === undefined}
      />
      {/* Read-only: sourced from the bundled reference data, not user-editable. */}
      {petToxicity !== undefined && (
        <CatalogDetailRow
          kind="badge"
          label="Animal safety"
          value={petToxicity ? 'Pet Toxic' : 'Pet Safe'}
          badgeTone={petToxicity ? 'error' : 'success'}
          badgeIcon={petToxicity ? 'general.warning' : 'general.success'}
          helpText={CATALOG_FIELD_HELP.petToxicity}
          isLast
        />
      )}
    </View>
  );
}
