import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantSectionHeaderStyles';

interface Props {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

/** Labelled title row marking the top of a plant-detail section on the one page. */
export function PlantSectionHeader({ title, icon }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
