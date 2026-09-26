import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { CatalogDetailRow } from '@/components/catalog/CatalogDetailRow';
import { CatalogTextBlock } from '@/components/catalog/CatalogTextBlock';
import { optionsFromLabels } from '@/components/catalog/catalogEditor';
import type { CatalogEditor } from '@/components/catalog/catalogEditor';
import { sanitizeLandmarkText } from '@/utils/textSanitizer';
import { CATALOG_FIELD_HELP } from '@/utils/catalogFieldHelp';
import {
  CATALOG_GROUP_DESCRIPTIONS,
  CATALOG_GROUP_LABELS,
  LIFECYCLE_DESCRIPTIONS,
  LIFECYCLE_LABELS,
} from '@/utils/plantLabels';
import { CATALOG_GROUP_ORDER } from '@/config/plants/catalogTaxonomy';
import type { PickerOption } from '@/components/OptionPickerSheet';
import type { CatalogGroup, PlantType } from '@/types/database.types';

interface Props {
  editor: CatalogEditor;
  name: string;
  setName: (next: string) => void;
  isCreating: boolean;
  /** Bundled plants keep their name; see `useCatalogEntryForm.nameLocked`. */
  nameLocked: boolean;
  /**
   * The care model being created, and a setter. Offered only while creating,
   * because it decides which growth-stage model, pest set and task cadence the
   * entry gets, and changing it afterwards would strand the saved profile.
   *
   * The Category sets it; the setter is only for Fruits' "Grows as" row, since
   * a fruit that is not a tree is cared for as a seasonal crop.
   */
  plantType?: PlantType;
  onPlantTypeChange?: (next: PlantType) => void;
  /** Where the new entry is filed in the catalog — the same groups as the pills. */
  group?: CatalogGroup;
  onGroupChange?: (next: CatalogGroup) => void;
}

const CATEGORY_PICKER_OPTIONS: readonly PickerOption[] = CATALOG_GROUP_ORDER.map((value) => ({
  value,
  label: CATALOG_GROUP_LABELS[value],
  description: CATALOG_GROUP_DESCRIPTIONS[value],
}));

/** Fruits is the one group whose plants are cared for two different ways. */
const GROWS_AS_OPTIONS: readonly PickerOption[] = [
  {
    value: 'fruit_tree',
    label: 'Tree',
    description: 'Takes years to first fruit; pruned and fed as a tree',
  },
  {
    value: 'vegetable',
    label: 'Not a tree',
    description: 'Short-lived fruit plant, cared for like a seasonal crop',
  },
];

const GROWS_AS_LABELS: Partial<Record<PlantType, string>> = {
  fruit_tree: 'Tree',
  vegetable: 'Not a tree',
};

export function PlantInfoSection({
  editor,
  name,
  setName,
  isCreating,
  nameLocked,
  plantType,
  onPlantTypeChange,
  group,
  onGroupChange,
}: Props): React.JSX.Element {
  const { careForm, setForm, errors, showErrors, openText, openPicker } = editor;

  const lifecycleOptions = useMemo(
    () => optionsFromLabels(LIFECYCLE_LABELS, LIFECYCLE_DESCRIPTIONS),
    []
  );

  const onName = useCallback(
    () =>
      openText({
        title: 'Name',
        value: name,
        onCommit: setName,
        // Per keystroke, so no trim: trimming here ate every space as it was
        // typed ("Long Brinjal" became "LongBrinjal"). Save trims.
        sanitize: sanitizeLandmarkText,
        helpText: CATALOG_FIELD_HELP.name,
        autoCapitalize: 'words',
        dictation: true,
      }),
    [openText, name, setName]
  );

  const onTamilName = useCallback(
    () =>
      openText({
        title: 'Tamil name',
        value: careForm.tamilName,
        onCommit: (tamilName) => setForm({ tamilName }),
        helpText: CATALOG_FIELD_HELP.tamilName,
        autoCapitalize: 'none',
        dictation: true,
      }),
    [openText, careForm.tamilName, setForm]
  );

  const onScientificName = useCallback(
    () =>
      openText({
        title: 'Scientific name',
        value: careForm.scientificName,
        onCommit: (scientificName) => setForm({ scientificName }),
        helpText: CATALOG_FIELD_HELP.scientificName,
        autoCapitalize: 'words',
      }),
    [openText, careForm.scientificName, setForm]
  );

  const onTaxonomicFamily = useCallback(
    () =>
      openText({
        title: 'Plant family',
        value: careForm.taxonomicFamily,
        onCommit: (taxonomicFamily) => setForm({ taxonomicFamily }),
        helpText: CATALOG_FIELD_HELP.taxonomicFamily,
        autoCapitalize: 'words',
      }),
    [openText, careForm.taxonomicFamily, setForm]
  );

  const onLifecycle = useCallback(
    () =>
      openPicker({
        title: 'Lifecycle',
        options: lifecycleOptions,
        selectedValue: careForm.lifecycle,
        onSelect: (value) => setForm({ lifecycle: value as CareFormLifecycle }),
        allowClear: true,
      }),
    [openPicker, lifecycleOptions, careForm.lifecycle, setForm]
  );

  const onCategory = useCallback(
    () =>
      openPicker({
        title: 'Category',
        options: CATEGORY_PICKER_OPTIONS,
        selectedValue: group ?? '',
        onSelect: (value) => onGroupChange?.(value as CatalogGroup),
      }),
    [openPicker, group, onGroupChange]
  );

  const onGrowsAs = useCallback(
    () =>
      openPicker({
        title: 'Grows as',
        options: GROWS_AS_OPTIONS,
        selectedValue: plantType ?? '',
        onSelect: (value) => onPlantTypeChange?.(value as PlantType),
      }),
    [openPicker, plantType, onPlantTypeChange]
  );

  const onDescription = useCallback((description: string) => setForm({ description }), [setForm]);

  // The selected lifecycle's own explanation is more useful than the generic
  // help once a choice has been made.
  const lifecycleHelp = careForm.lifecycle
    ? `${CATALOG_FIELD_HELP.lifecycle} ${LIFECYCLE_DESCRIPTIONS[careForm.lifecycle]}`
    : CATALOG_FIELD_HELP.lifecycle;

  // Farmer-facing first; the botanical identity is reference detail, last.
  return (
    <View>
      <CatalogDetailRow
        kind="text"
        label="Name"
        value={name}
        helpText={CATALOG_FIELD_HELP.name}
        onPress={onName}
        disabled={nameLocked}
        hint={nameLocked ? 'Built-in plant — add your local name under Tamil name.' : undefined}
        errorText={showErrors ? errors.name : undefined}
      />
      <CatalogDetailRow
        kind="text"
        label="Tamil name"
        value={careForm.tamilName}
        helpText={CATALOG_FIELD_HELP.tamilName}
        onPress={onTamilName}
      />
      {isCreating && group && onGroupChange ? (
        <CatalogDetailRow
          kind="picker"
          label="Category"
          value={CATALOG_GROUP_LABELS[group]}
          helpText={CATALOG_FIELD_HELP.category}
          helpTitle="Category"
          onPress={onCategory}
        />
      ) : null}
      {isCreating && group === 'fruits' && plantType && onPlantTypeChange ? (
        <CatalogDetailRow
          kind="picker"
          label="Grows as"
          value={GROWS_AS_LABELS[plantType] ?? ''}
          helpText={CATALOG_FIELD_HELP.growsAs}
          helpTitle="Grows as"
          onPress={onGrowsAs}
        />
      ) : null}

      <CatalogTextBlock
        label="Description"
        value={careForm.description}
        onChangeText={onDescription}
        placeholder="Brief description of this plant"
        helpText={CATALOG_FIELD_HELP.description}
        dictation
      />

      <CatalogDetailRow
        kind="picker"
        label="Lifecycle"
        value={careForm.lifecycle ? LIFECYCLE_LABELS[careForm.lifecycle] : ''}
        helpText={lifecycleHelp}
        helpTitle="Lifecycle"
        onPress={onLifecycle}
      />
      <CatalogDetailRow
        kind="text"
        label="Scientific name"
        value={careForm.scientificName}
        helpText={CATALOG_FIELD_HELP.scientificName}
        onPress={onScientificName}
      />
      <CatalogDetailRow
        kind="text"
        label="Plant family"
        value={careForm.taxonomicFamily}
        helpText={CATALOG_FIELD_HELP.taxonomicFamily}
        helpTitle="Plant family"
        onPress={onTaxonomicFamily}
        isLast
      />
    </View>
  );
}

type CareFormLifecycle = CatalogEditor['careForm']['lifecycle'];
