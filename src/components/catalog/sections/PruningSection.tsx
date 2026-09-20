import React, { useCallback } from 'react';
import { View } from 'react-native';
import { CatalogDetailRow } from '@/components/catalog/CatalogDetailRow';
import { CatalogTextBlock } from '@/components/catalog/CatalogTextBlock';
import type { CatalogEditor } from '@/components/catalog/catalogEditor';
import { sanitizeNum } from '@/utils/catalogDraft';
import { CATALOG_FIELD_HELP } from '@/utils/catalogFieldHelp';

interface Props {
  editor: CatalogEditor;
}

export function PruningSection({ editor }: Props): React.JSX.Element {
  const { careForm, setForm, openText } = editor;

  const onFrequency = useCallback(
    () =>
      openText({
        title: 'Pruning frequency (days)',
        value: careForm.pruningFrequencyDays,
        onCommit: (pruningFrequencyDays) => setForm({ pruningFrequencyDays }),
        keyboardType: 'numeric',
        sanitize: sanitizeNum,
        helpText: CATALOG_FIELD_HELP.pruningFrequencyDays,
      }),
    [openText, careForm.pruningFrequencyDays, setForm]
  );

  const onTips = useCallback((pruningTips: string) => setForm({ pruningTips }), [setForm]);
  const onShapeTip = useCallback(
    (shapePruningTip: string) => setForm({ shapePruningTip }),
    [setForm]
  );
  const onFlowerTip = useCallback(
    (flowerPruningTip: string) => setForm({ flowerPruningTip }),
    [setForm]
  );

  const onShapeMonths = useCallback(
    () =>
      openText({
        title: 'Shape pruning — best months',
        value: careForm.shapePruningMonths,
        onCommit: (shapePruningMonths) => setForm({ shapePruningMonths }),
        placeholder: 'e.g. Jan–Feb',
        helpText: CATALOG_FIELD_HELP.shapePruningMonths,
      }),
    [openText, careForm.shapePruningMonths, setForm]
  );

  const onFlowerMonths = useCallback(
    () =>
      openText({
        title: 'Flower pruning — best months',
        value: careForm.flowerPruningMonths,
        onCommit: (flowerPruningMonths) => setForm({ flowerPruningMonths }),
        placeholder: 'e.g. Year-round',
        helpText: CATALOG_FIELD_HELP.flowerPruningMonths,
      }),
    [openText, careForm.flowerPruningMonths, setForm]
  );

  // A months window is only meaningful next to the tip it qualifies, so each
  // one appears once its tip has content.
  const hasShapeTip = careForm.shapePruningTip.trim().length > 0;
  const hasFlowerTip = careForm.flowerPruningTip.trim().length > 0;

  return (
    <View>
      <CatalogDetailRow
        kind="text"
        label="Pruning frequency"
        value={careForm.pruningFrequencyDays ? `${careForm.pruningFrequencyDays} days` : ''}
        helpText={CATALOG_FIELD_HELP.pruningFrequencyDays}
        onPress={onFrequency}
      />
      <CatalogTextBlock
        label="Tips (one per line)"
        value={careForm.pruningTips}
        onChangeText={onTips}
        placeholder="e.g. Remove yellowing lower leaves"
        helpText={CATALOG_FIELD_HELP.pruningTips}
        dictation
      />
      <CatalogTextBlock
        label="Shape pruning tip"
        value={careForm.shapePruningTip}
        onChangeText={onShapeTip}
        placeholder="How to prune for structure and airflow"
        helpText={CATALOG_FIELD_HELP.shapePruningTip}
        dictation
        numberOfLines={2}
      />
      {/* Sits directly under the shape-pruning tip, so the label needs no
          qualifier; the sheet title carries one, since the row is out of view
          once the editor opens. */}
      {hasShapeTip && (
        <CatalogDetailRow
          kind="text"
          label="Best months"
          value={careForm.shapePruningMonths}
          helpText={CATALOG_FIELD_HELP.shapePruningMonths}
          onPress={onShapeMonths}
        />
      )}
      <CatalogTextBlock
        label="Flower pruning tip"
        value={careForm.flowerPruningTip}
        onChangeText={onFlowerTip}
        placeholder="How to prune to support flowering"
        helpText={CATALOG_FIELD_HELP.flowerPruningTip}
        dictation
        numberOfLines={2}
        isLast={!hasFlowerTip}
      />
      {hasFlowerTip && (
        <CatalogDetailRow
          kind="text"
          label="Best months"
          value={careForm.flowerPruningMonths}
          helpText={CATALOG_FIELD_HELP.flowerPruningMonths}
          onPress={onFlowerMonths}
          isLast
        />
      )}
    </View>
  );
}
