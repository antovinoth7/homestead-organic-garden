import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { getPlantEmoji } from '@/utils/plantHelpers';

interface Props {
  plantName: string;
  /** Count of this variety the user is actively growing — drives the badge chip. */
  count: number;
  onPress: (plantName: string) => void;
}

export const PlantCatalogRow = React.memo(function PlantCatalogRow({
  plantName,
  count,
  onPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(() => onPress(plantName), [onPress, plantName]);

  return (
    <TouchableOpacity style={styles.plantRowCompact} onPress={handlePress} activeOpacity={0.7}>
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
  );
});
