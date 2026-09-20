import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantSectionHeaderStyles';

export type SectionStatus = 'required_incomplete' | 'complete' | 'optional';

interface Props {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Marks the section as failing validation — reddens the title and adds a dot. */
  hasError?: boolean;
  /** Completion badge. Suppressed while `hasError` is set. */
  status?: SectionStatus;
  /** Right-aligned slot, e.g. an "Add" button. */
  action?: React.ReactNode;
}

/** Labelled title row marking the top of a plant section on the one-page layout. */
export function PlantSectionHeader({
  title,
  icon,
  hasError = false,
  status,
  action,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      <Ionicons name={icon} size={18} color={hasError ? theme.error : theme.primary} />
      <Text style={[styles.title, hasError && styles.titleError]}>{title}</Text>

      {hasError && <View style={styles.errorDot} />}
      {!hasError && status === 'complete' && (
        <View style={styles.statusCompleteBadge}>
          <Ionicons name="checkmark-circle" size={14} color={theme.textInverse} />
        </View>
      )}
      {!hasError && status === 'optional' && (
        <View style={styles.statusOptionalBadge}>
          <Text style={styles.statusOptionalText}>Optional</Text>
        </View>
      )}
      {!hasError && status === 'required_incomplete' && (
        <View style={styles.statusRequired}>
          <View style={styles.statusRequiredDot} />
          <Text style={styles.statusRequiredText}>Required</Text>
        </View>
      )}

      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}
