import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalStatTilesStyles';

export type JournalStatTone = 'neutral' | 'harvest' | 'issues';

export interface JournalStatTile {
  key: string;
  /** Already formatted — "12", "5.8", or "—" when there is nothing yet. */
  value: string;
  unit?: string;
  label: string;
  tone: JournalStatTone;
  /** Muted colour for a zero or empty figure. */
  muted?: boolean;
  selected?: boolean;
  onPress: () => void;
}

interface Props {
  tiles: readonly JournalStatTile[];
}

const TONE_STYLE: Record<JournalStatTone, 'toneNeutral' | 'toneHarvest' | 'toneIssues'> = {
  neutral: 'toneNeutral',
  harvest: 'toneHarvest',
  issues: 'toneIssues',
};

/**
 * The Journal's summary row: Entries, Harvest, Open issues. Each tile toggles
 * the matching filter; the selected one takes a primary border.
 */
export function JournalStatTiles({ tiles }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {tiles.map((tile) => {
        const colour = tile.muted ? styles.toneZero : styles[TONE_STYLE[tile.tone]];
        return (
          <TouchableOpacity
            key={tile.key}
            style={[styles.tile, tile.selected && styles.tileSelected]}
            onPress={tile.onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: tile.selected ?? false }}
            accessibilityLabel={`${tile.value}${tile.unit ? ` ${tile.unit}` : ''} ${tile.label}`}
          >
            <View style={styles.valueRow}>
              <Text style={[styles.value, colour]} numberOfLines={1}>
                {tile.value}
              </Text>
              {tile.unit ? <Text style={[styles.unit, colour]}>{tile.unit}</Text> : null}
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {tile.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
