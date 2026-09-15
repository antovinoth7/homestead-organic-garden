import React, { useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogRowStyles';
import { CatalogDetailRow } from '@/components/catalog/CatalogDetailRow';
import { CatalogTextBlock } from '@/components/catalog/CatalogTextBlock';
import { optionsFromLabels } from '@/components/catalog/catalogEditor';
import type { CatalogEditor } from '@/components/catalog/catalogEditor';
import { sanitizeName } from '@/utils/catalogDraft';
import { CATALOG_FIELD_HELP } from '@/utils/catalogFieldHelp';
import {
  CATEGORY_FULL_LABELS,
  CATEGORY_OPTIONS,
  LIFECYCLE_DESCRIPTIONS,
  LIFECYCLE_LABELS,
} from '@/utils/plantLabels';
import type { PlantType } from '@/types/database.types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  editor: CatalogEditor;
  name: string;
  setName: (next: string) => void;
  /** Care-status strip is meaningless before an entry exists. */
  isCreating: boolean;
  hasOverride: boolean;
  /**
   * The care model being created, and a setter — offered only while creating,
   * because it decides which growth-stage model, pest set and task cadence the
   * entry gets, and changing it afterwards would strand the saved profile.
   *
   * It exists as a field at all because browsing and caring came apart: the
   * group's default is a starting guess (Fruits starts at `fruit_tree`), so a
   * herbaceous quick fruit like Pineapple needs a way to say otherwise.
   */
  plantType?: PlantType;
  onPlantTypeChange?: (next: PlantType) => void;
}

export function PlantInfoSection({
  editor,
  name,
  setName,
  isCreating,
  hasOverride,
  plantType,
  onPlantTypeChange,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
        sanitize: sanitizeName,
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
        title: 'Taxonomic family',
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

  const onCareModel = useCallback(
    () =>
      openPicker({
        title: 'Care model',
        options: CATEGORY_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
        selectedValue: plantType ?? '',
        onSelect: (value) => onPlantTypeChange?.(value as PlantType),
      }),
    [openPicker, plantType, onPlantTypeChange]
  );

  const onDescription = useCallback(
    (description: string) => setForm({ description }),
    [setForm]
  );

  // The selected lifecycle's own explanation is more useful than the generic
  // help once a choice has been made.
  const lifecycleHelp = careForm.lifecycle
    ? `${CATALOG_FIELD_HELP.lifecycle} ${LIFECYCLE_DESCRIPTIONS[careForm.lifecycle]}`
    : CATALOG_FIELD_HELP.lifecycle;

  return (
    <View>
      <CatalogDetailRow
        kind="text"
        label="Name"
        value={name}
        helpText={CATALOG_FIELD_HELP.name}
        onPress={onName}
        errorText={showErrors ? errors.name : undefined}
      />
      <CatalogDetailRow
        kind="text"
        label="Tamil name"
        value={careForm.tamilName}
        helpText={CATALOG_FIELD_HELP.tamilName}
        onPress={onTamilName}
      />

      {!isCreating && (
        <View style={styles.statusStrip}>
          <View style={styles.statusStripRow}>
            <Ionicons
              name={hasOverride ? 'settings-outline' : 'leaf-outline'}
              size={16}
              color={theme.primary}
            />
            <Text style={styles.statusStripTitle}>
              {hasOverride ? 'Custom defaults active' : 'Using shared app defaults'}
            </Text>
          </View>
          <Text style={styles.statusStripNote}>
            New garden plants created from this catalog entry will inherit these values.
          </Text>
        </View>
      )}

      <CatalogTextBlock
        label="Description"
        value={careForm.description}
        onChangeText={onDescription}
        placeholder="Brief description of this plant"
        helpText={CATALOG_FIELD_HELP.description}
        dictation
      />

      <CatalogDetailRow
        kind="text"
        label="Scientific name"
        value={careForm.scientificName}
        helpText={CATALOG_FIELD_HELP.scientificName}
        onPress={onScientificName}
      />
      {isCreating && plantType && onPlantTypeChange ? (
        <CatalogDetailRow
          kind="picker"
          label="Care model"
          value={CATEGORY_FULL_LABELS[plantType]}
          helpText={CATALOG_FIELD_HELP.careModel}
          helpTitle="Care model"
          onPress={onCareModel}
        />
      ) : null}
      <CatalogDetailRow
        kind="text"
        label="Taxonomic family"
        value={careForm.taxonomicFamily}
        helpText={CATALOG_FIELD_HELP.taxonomicFamily}
        onPress={onTaxonomicFamily}
      />
      <CatalogDetailRow
        kind="picker"
        label="Lifecycle"
        value={careForm.lifecycle ? LIFECYCLE_LABELS[careForm.lifecycle] : ''}
        helpText={lifecycleHelp}
        helpTitle="Lifecycle"
        onPress={onLifecycle}
        isLast
      />
    </View>
  );
}

type CareFormLifecycle = CatalogEditor['careForm']['lifecycle'];
