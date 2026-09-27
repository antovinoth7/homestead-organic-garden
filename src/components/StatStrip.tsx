import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';
import { createStyles } from '@/styles/statStripStyles';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type StatTone = 'primary' | 'success' | 'warning' | 'error';

export interface StatStripItem {
  key: string;
  icon: IoniconName;
  value: number;
  /**
   * Shown in place of `value` — e.g. "—" where a zero would mislead ("0 pcs"
   * before anything was harvested). Muting still follows `value`.
   */
  display?: string;
  /** Rendered as a smaller suffix after the value, e.g. `kg`. Hidden with `display`. */
  unit?: string;
  label: string;
  /** Accent for the icon (and, for `error`, the value) once the value is non-zero. */
  tone?: StatTone;
  selected?: boolean;
  /** The cell is pressable only when provided. */
  onPress?: () => void;
}

interface Props {
  items: StatStripItem[];
}

function toneColor(theme: Theme, tone: StatTone): string {
  switch (tone) {
    case 'success':
      return theme.success;
    case 'warning':
      return theme.warning;
    case 'error':
      return theme.error;
    default:
      return theme.primary;
  }
}

/**
 * Row of summary figures in one bordered card. A zero value is muted so the
 * strip only draws colour where there is something to look at.
 */
export function StatStrip({ items }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.strip}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'primary';
        const isZero = item.value === 0;
        const unit = item.display === undefined ? item.unit : undefined;
        const cellStyle = [
          styles.cell,
          index > 0 && styles.cellDivider,
          item.selected && styles.cellSelected,
        ];
        const content = (
          <>
            <View style={styles.topRow}>
              <View style={styles.valueRow}>
                <Text
                  style={[
                    styles.value,
                    isZero ? styles.valueMuted : tone === 'error' && styles.valueError,
                  ]}
                  numberOfLines={1}
                >
                  {item.display ?? item.value}
                </Text>
                {unit ? <Text style={styles.unit}>{unit}</Text> : null}
              </View>
              <Ionicons
                name={item.icon}
                size={14}
                color={isZero ? theme.textTertiary : toneColor(theme, tone)}
              />
            </View>
            <Text
              style={[styles.label, item.selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </>
        );
        const accessibilityLabel =
          item.display === undefined
            ? `${item.value}${unit ? ` ${unit}` : ''} ${item.label}`
            : `${item.label}: none`;

        return item.onPress ? (
          <TouchableOpacity
            key={item.key}
            style={cellStyle}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: item.selected ?? false }}
            accessibilityLabel={accessibilityLabel}
          >
            {content}
          </TouchableOpacity>
        ) : (
          <View key={item.key} style={cellStyle} accessibilityLabel={accessibilityLabel}>
            {content}
          </View>
        );
      })}
    </View>
  );
}
