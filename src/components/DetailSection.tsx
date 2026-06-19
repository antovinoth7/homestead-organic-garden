import React from 'react';
import { View, Text } from 'react-native';
import type { createStyles } from '@/styles/plantDetailStyles';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  title: string;
  children: React.ReactNode;
}

/**
 * Card wrapper for a plant detail section: the `careSection` container plus a
 * `sectionTitle` heading. Replaces the repeated `<View><Text/>…</View>` block.
 */
export function DetailSection({ styles, title, children }: Props): React.JSX.Element {
  return (
    <View style={styles.careSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
