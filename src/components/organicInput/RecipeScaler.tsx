import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/inputRecipesStyles';

interface Props {
  cents: number;
  canDecrement: boolean;
  canIncrement: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}

/**
 * Land-size control for the recipe calculator. Seeded from the farm's recorded
 * plot sizes, then adjustable so a grower can price out a different patch
 * without editing their farm profile.
 */
export function RecipeScaler({
  cents,
  canDecrement,
  canIncrement,
  onDecrement,
  onIncrement,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.scaler}>
      <View style={styles.scalerBody}>
        <Text style={styles.scalerLabel}>SCALED FOR YOUR FARM</Text>
        <Text style={styles.scalerValue}>
          {cents} cent{cents === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={styles.scalerButtons}>
        <TouchableOpacity
          style={[styles.scalerButton, !canDecrement && styles.scalerButtonDisabled]}
          onPress={onDecrement}
          disabled={!canDecrement}
          accessibilityRole="button"
          accessibilityLabel="Decrease farm size"
        >
          <Ionicons name="remove" size={18} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scalerButton, !canIncrement && styles.scalerButtonDisabled]}
          onPress={onIncrement}
          disabled={!canIncrement}
          accessibilityRole="button"
          accessibilityLabel="Increase farm size"
        >
          <Ionicons name="add" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
