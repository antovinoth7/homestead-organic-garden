import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { getPlantImage } from '@/config/referenceAssets';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { MAX_CATALOG_FONT_SCALE } from '@/styles/catalogMetrics';
import { tapFeedback } from '@/utils/haptics';
import { HABIT_LABELS } from '@/utils/plantLabels';
import type { PlantHabit, PlantType } from '@/types/database.types';

interface Props {
  plantName: string;
  /** Rendered beside the English name; absent for user-added entries. */
  tamilName?: string;
  plantType: PlantType;
  /**
   * Growth habit, shown inline in the subtitle. This is the axis the old
   * category pills conflated with purpose — a farmer needs to see that Drumstick
   * is a tree even though it is filed under Vegetables.
   */
  habit?: PlantHabit;
  /** Garden plants currently using this entry; the chip hides at zero. */
  count: number;
  /**
   * One-line description, or a variety count where the plant has no
   * description. The row keeps its fixed height whether or not this is set.
   */
  subtitle?: string;
  isFirst: boolean;
  isLast: boolean;
  /**
   * The scale the list measured with. Passed down rather than read per row:
   * `useWindowDimensions` would add a Dimensions listener for every mounted row.
   */
  fontScale?: number;
  onPress: (plantName: string, plantType: PlantType) => void;
}

function CatalogBrowseRowComponent({
  plantName,
  tamilName,
  plantType,
  habit,
  count,
  subtitle,
  isFirst,
  isLast,
  fontScale = 1,
  onPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  // The row's height is a contract with getItemLayout, so it has to be built at
  // the same scale the list measured with.
  const styles = useMemo(() => createStyles(theme, fontScale), [theme, fontScale]);

  const handlePress = useCallback(() => {
    tapFeedback();
    onPress(plantName, plantType);
  }, [onPress, plantName, plantType]);

  /**
   * Without this a screen reader reads four disconnected fragments — the name,
   * a Tamil word, a sentence, then a bare number.
   */
  const accessibilityLabel = [
    plantName,
    tamilName,
    habit ? HABIT_LABELS[habit] : undefined,
    subtitle,
    count > 0 ? `${count} in your garden` : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={[styles.listCard, isFirst && styles.listCardFirst, isLast && styles.listCardLast]}
    >
      <Pressable
        style={({ pressed }) => [styles.plantRowCompact, pressed && styles.plantRowPressed]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={styles.plantThumbWrap}>
          <ReferenceThumb
            source={getPlantImage(plantName)}
            variant="row"
            recyclingKey={`${plantType}:${plantName}`}
          />
        </View>
        <View style={styles.plantInfo}>
          <View style={styles.plantNameRow}>
            <Text
              style={styles.plantName}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_CATALOG_FONT_SCALE}
            >
              {plantName}
            </Text>
            {tamilName ? (
              <Text
                style={styles.plantTamil}
                numberOfLines={1}
                maxFontSizeMultiplier={MAX_CATALOG_FONT_SCALE}
              >
                {tamilName}
              </Text>
            ) : null}
          </View>
          {habit || subtitle ? (
            <Text
              style={styles.plantSubtitle}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_CATALOG_FONT_SCALE}
            >
              {habit ? <Text style={styles.plantHabit}>{HABIT_LABELS[habit]}</Text> : null}
              {habit && subtitle ? ' · ' : ''}
              {subtitle}
            </Text>
          ) : null}
        </View>
        {count > 0 && (
          <View style={styles.plantCountChip}>
            <Text style={styles.plantCountChipText}>{count}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </Pressable>
      {!isLast && <View style={styles.rowDivider} />}
    </View>
  );
}

export const CatalogBrowseRow = React.memo(CatalogBrowseRowComponent);
