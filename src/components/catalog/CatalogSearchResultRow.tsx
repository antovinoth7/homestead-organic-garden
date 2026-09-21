import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { getPlantImage } from '@/config/referenceAssets';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { splitAtSpan } from '@/utils/catalogSearch';
import type { CatalogSearchResult } from '@/utils/catalogSearch';
import { CATALOG_GROUP_LABELS } from '@/utils/plantLabels';
import { getTaxonomy } from '@/config/plants/catalogTaxonomy';
import type { PlantType } from '@/types/database.types';

interface Props {
  result: CatalogSearchResult;
  isFirst: boolean;
  isLast: boolean;
  onPress: (plantName: string, plantType: PlantType) => void;
}
/** "ladies finger" → "Ladies Finger" — aliases are stored as lookup keys. */
function titleCase(value: string): string {
  // The literal here was a stray backspace byte (0x08) followed by w, which
  // matched nothing, so alias notes rendered entirely lower-case.
  return value.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function CatalogSearchResultRowComponent({
  result,
  isFirst,
  isLast,
  onPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(
    () => onPress(result.name, result.plantType),
    [onPress, result.name, result.plantType]
  );

  const [nameBefore, nameMatch, nameAfter] = splitAtSpan(result.name, result.nameSpan);
  const [tamilBefore, tamilMatch, tamilAfter] = splitAtSpan(
    result.tamilName ?? '',
    result.tamilSpan
  );

  // Sub-line names the category and whether the plant is already growing, so a
  // cross-category result carries enough context to pick between near-duplicates.
  const usage = result.gardenCount > 0 ? `${result.gardenCount} in garden` : 'Not in garden';

  // An alias or tag hit shows the canonical name, so without this the row looks
  // unrelated to what was typed — say what actually matched. A tag match is why
  // "keerai" reaches the greens and "green manure" reaches Agathi.
  const aliasNote =
    result.matchedField === 'alias' && result.matchedAlias
      ? titleCase(result.matchedAlias)
      : result.matchedField === 'tag' && result.matchedTag
        ? result.matchedTag
        : null;

  return (
    <View style={[styles.listCard, isFirst && styles.listCardFirst, isLast && styles.listCardLast]}>
      <TouchableOpacity style={styles.plantRowCompact} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.plantThumbWrap}>
          <ReferenceThumb
            source={getPlantImage(result.name)}
            variant="row"
            recyclingKey={`${result.plantType}:${result.name}`}
          />
        </View>
        <View style={styles.plantInfo}>
          <Text style={styles.plantName} numberOfLines={1}>
            {nameBefore}
            <Text style={styles.resultHighlight}>{nameMatch}</Text>
            {nameAfter}
          </Text>
          <Text style={styles.resultSub} numberOfLines={1}>
            {result.tamilName ? (
              <>
                {tamilBefore}
                <Text style={styles.resultHighlight}>{tamilMatch}</Text>
                {tamilAfter}
                {' • '}
              </>
            ) : null}
            {aliasNote ? (
              <>
                <Text style={styles.resultHighlight}>{aliasNote}</Text>
                {' • '}
              </>
            ) : null}
            {CATALOG_GROUP_LABELS[getTaxonomy(result.name, result.plantType).group]}
            {' • '}
            {usage}
          </Text>
        </View>
        {result.gardenCount > 0 && (
          <View style={styles.plantCountChip}>
            <Text style={styles.plantCountChipText}>{result.gardenCount}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </TouchableOpacity>
      {!isLast && <View style={styles.rowDivider} />}
    </View>
  );
}

export const CatalogSearchResultRow = React.memo(CatalogSearchResultRowComponent);
