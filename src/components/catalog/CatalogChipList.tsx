import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogRowStyles';

export interface CatalogChip {
  key: string;
  label: string;
  emoji?: string;
  /** Secondary line inside the chip, e.g. a variety's days/season/source. */
  sub?: string;
  /** Small accent dot — varieties that carry saved detail. */
  dot?: boolean;
  /** Inherited entries are shown but cannot be removed. */
  removable?: boolean;
}

interface ChipProps {
  chip: CatalogChip;
  onPress?: (key: string) => void;
  onRemove?: (key: string) => void;
}

function Chip({ chip, onPress, onRemove }: ChipProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(() => onPress?.(chip.key), [onPress, chip.key]);
  const handleRemove = useCallback(() => onRemove?.(chip.key), [onRemove, chip.key]);

  const body = (
    <>
      {chip.emoji ? <Text style={styles.chipText}>{chip.emoji}</Text> : null}
      <View style={styles.chipBody}>
        <Text style={styles.chipText} numberOfLines={1}>
          {chip.label}
        </Text>
        {chip.sub ? (
          <Text style={styles.chipSub} numberOfLines={1}>
            {chip.sub}
          </Text>
        ) : null}
      </View>
      {chip.dot ? <View style={styles.chipDot} /> : null}
    </>
  );

  return (
    <View style={styles.chip}>
      {onPress ? (
        <TouchableOpacity
          style={styles.chipInner}
          onPress={handlePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={chip.label}
        >
          {body}
        </TouchableOpacity>
      ) : (
        body
      )}
      {chip.removable && onRemove ? (
        <TouchableOpacity
          onPress={handleRemove}
          hitSlop={8}
          accessibilityLabel={`Remove ${chip.label}`}
        >
          <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface Props {
  chips: readonly CatalogChip[];
  emptyText: string;
  onChipPress?: (key: string) => void;
  onRemove?: (key: string) => void;
}

/** Wrap-chip list used for linked pests, diseases and varieties. */
export function CatalogChipList({
  chips,
  emptyText,
  onChipPress,
  onRemove,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (chips.length === 0) {
    return <Text style={styles.chipEmpty}>{emptyText}</Text>;
  }

  return (
    <View style={styles.chipRow}>
      {chips.map((chip) => (
        <Chip key={chip.key} chip={chip} onPress={onChipPress} onRemove={onRemove} />
      ))}
    </View>
  );
}
