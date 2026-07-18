import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantFormStyles';

interface Props {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Tints the icon wrap red and shows an error dot in the title row. */
  hasError?: boolean;
  /** Shows the "Optional" badge in the title row. */
  optional?: boolean;
  children: React.ReactNode;
}

/**
 * Icon-headed card section for the plant forms — the add-form's sectionCard
 * idiom, shared with the edit tabs so both forms speak one design language.
 */
export function FormSectionCard({
  title,
  icon,
  hasError = false,
  optional = false,
  children,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardTitleRow}>
        <View style={[styles.sectionCardIconWrap, hasError && styles.sectionCardIconWrapError]}>
          <Ionicons name={icon} size={15} color={hasError ? theme.error : theme.primary} />
        </View>
        <Text style={styles.sectionCardTitle}>{title}</Text>
        {optional && (
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalBadgeText}>Optional</Text>
          </View>
        )}
        {hasError && <View style={styles.sectionCardErrorDot} />}
      </View>
      {children}
    </View>
  );
}
