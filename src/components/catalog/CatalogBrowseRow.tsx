import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { getPlantImage } from '@/config/referenceAssets';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { getPlantEmoji } from '@/utils/plantHelpers';
import type { PlantType } from '@/types/database.types';

interface Props {
  plantName: string;
  plantType: PlantType;
  /** Garden plants currently using this entry; the chip hides at zero. */
  count: number;
  isFirst: boolean;
  isLast: boolean;
  onPress: (plantName: string, plantType: PlantType) => void;
}

function CatalogBrowseRowComponent({
  plantName,
  plantType,
  count,
  isFirst,
  isLast,
  onPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(
    () => onPress(plantName, plantType),
    [onPress, plantName, plantType]
  );

  return (
    <View
      style={[styles.listCard, isFirst && styles.listCardFirst, isLast && styles.listCardLast]}
    >
      <TouchableOpacity style={styles.plantRowCompact} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.plantThumbWrap}>
          <ReferenceThumb
            source={getPlantImage(plantName)}
            emoji={getPlantEmoji(plantName)}
            variant="row"
            recyclingKey={`${plantType}:${plantName}`}
          />
        </View>
        <View style={styles.plantInfo}>
          <Text style={styles.plantName} numberOfLines={1}>
            {plantName}
          </Text>
        </View>
        {count > 0 && (
          <View style={styles.plantCountChip}>
            <Text style={styles.plantCountChipText}>{count}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </TouchableOpacity>
      {!isLast && <View style={styles.rowDivider} />}
    </View>
  );
}

export const CatalogBrowseRow = React.memo(CatalogBrowseRowComponent);
