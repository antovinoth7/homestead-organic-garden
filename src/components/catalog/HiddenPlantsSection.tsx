import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/hiddenPlantsStyles';

interface RowProps {
  name: string;
  onRestore: (name: string) => void;
}

function HiddenPlantRow({ name, onRestore }: RowProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onRestore(name), [onRestore, name]);

  return (
    <View style={styles.row}>
      <Ionicons name="eye-off-outline" size={16} color={theme.textTertiary} />
      <Text style={styles.rowName} numberOfLines={1}>
        {name}
      </Text>
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Restore ${name}`}
      >
        <Ionicons name="arrow-undo-outline" size={13} color={theme.primary} />
        <Text style={styles.restoreText}>Restore</Text>
      </TouchableOpacity>
    </View>
  );
}

interface Props {
  names: readonly string[];
  onRestore: (name: string) => void;
}

/**
 * Deleting a plant the app ships with hides it rather than erasing it — the
 * name would otherwise come straight back from the bundled catalog. This is the
 * way back, kept collapsed so it stays out of the way until it is wanted.
 */
export function HiddenPlantsSection({ names, onRestore }: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  if (names.length === 0) return null;

  const label = `${names.length} hidden plant${names.length === 1 ? '' : 's'}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Ionicons name="eye-off-outline" size={16} color={theme.textSecondary} />
        <Text style={styles.toggleLabel}>{label}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textTertiary}
        />
      </TouchableOpacity>

      {expanded ? (
        <>
          <Text style={styles.hint}>
            These come with the app, so deleting hides them instead of removing them for good.
          </Text>
          {names.map((name) => (
            <HiddenPlantRow key={name} name={name} onRestore={onRestore} />
          ))}
        </>
      ) : null}
    </View>
  );
}
