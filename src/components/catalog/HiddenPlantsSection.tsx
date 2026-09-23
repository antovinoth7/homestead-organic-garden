import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/hiddenPlantsStyles';
import type { PlantType } from '@/types/database.types';

/** A hidden entry and the care model it was filed under. */
export interface HiddenPlant {
  name: string;
  plantType: PlantType;
}

interface RowProps extends HiddenPlant {
  onRestore: (name: string, plantType: PlantType) => void;
}

function HiddenPlantRow({ name, plantType, onRestore }: RowProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handleRestore = useCallback(() => onRestore(name, plantType), [onRestore, name, plantType]);

  return (
    <View style={styles.row}>
      <Ionicons name="eye-off-outline" size={16} color={theme.textTertiary} />
      <Text style={styles.rowName} numberOfLines={1}>
        {name}
      </Text>
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
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
  /**
   * Each entry carries its own `plantType`: a browse group spans several care
   * models, so restoring needs the type the entry was filed under rather than
   * whatever the active pill happens to be.
   */
  plants: readonly HiddenPlant[];
  onRestore: (name: string, plantType: PlantType) => void;
}

/**
 * Deleting a plant the app ships with hides it rather than erasing it — the
 * name would otherwise come straight back from the bundled catalog. This is the
 * way back. It lives in the filter sheet, reachable in two taps, rather than
 * at the foot of a ~145-row list where nobody found it.
 *
 * Restore is the only action. A "remove permanently" that only took an
 * already-hidden plant off this list read as a second, scarier delete.
 */
export function HiddenPlantsSection({ plants, onRestore }: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  if (plants.length === 0) return null;

  const label = `${plants.length} hidden plant${plants.length === 1 ? '' : 's'}`;

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
            Restore one to bring it back to the catalog.
          </Text>
          {plants.map(({ name, plantType }) => (
            <HiddenPlantRow
              key={`${plantType}:${name}`}
              name={name}
              plantType={plantType}
              onRestore={onRestore}
            />
          ))}
        </>
      ) : null}
    </View>
  );
}
