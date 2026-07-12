import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createCarePlanSummaryStyles } from '@/styles/carePlanSummaryStyles';
import type { CarePlanRow } from '@/utils/carePlanDisplay';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  rows: CarePlanRow[];
  title?: string;
  subtitle?: string;
  /** Header icon shown next to the title (defaults to sparkles). */
  icon?: IoniconName;
  /** Tighter paddings for embedding inside another section (edit form). */
  compact?: boolean;
}

/** Read-only care-plan card: icon | label | value rows, DetailCard visual language. */
export function CarePlanSummary({
  rows,
  title,
  subtitle,
  icon = 'sparkles-outline',
  compact,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createCarePlanSummaryStyles(theme), [theme]);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {title && (
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name={icon} size={16} color={theme.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {rows.map((row, i) => (
        <View key={row.key} style={[styles.row, i === rows.length - 1 && styles.rowLast]}>
          <View style={styles.rowIconWrap}>
            <Ionicons name={row.icon} size={16} color={theme.primary} />
          </View>
          <Text style={styles.rowLabel}>{row.label}</Text>
          <View style={styles.rowValueWrap}>
            <Text style={styles.rowValue}>{row.value}</Text>
            {row.detail && <Text style={styles.rowDetail}>{row.detail}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}
