import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/detailCardStyles';

interface Props {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Optional right-aligned header content (e.g. a pin or record button). */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Consistent card wrapper for a plant-detail subsection: icon + title header. */
export function DetailCard({ title, icon, action, children }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={16} color={theme.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}
