import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { PlantType } from '@/types/database.types';
import { getPlantEmoji } from '@/utils/plantHelpers';

interface Props {
  plantNames: string[];
  activeCategory: PlantType;
  counts: Record<string, number>;
  onPlantPress: (plantName: string) => void;
}

export function PlantCatalogList({
  plantNames,
  activeCategory: _activeCategory,
  counts,
  onPlantPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (plantNames.length === 0) {
    return <Text style={styles.emptyText}>No plants yet. Tap + to add one.</Text>;
  }

  return (
    <View style={styles.listCard}>
      {plantNames.map((plantName, index) => {
        const count = counts[plantName] || 0;
        const isLast = index === plantNames.length - 1;
        return (
          <React.Fragment key={plantName}>
            <TouchableOpacity
              style={styles.plantRowCompact}
              onPress={() => onPlantPress(plantName)}
              activeOpacity={0.7}
            >
              <Text style={styles.plantEmoji}>{getPlantEmoji(plantName)}</Text>
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
          </React.Fragment>
        );
      })}
    </View>
  );
}
