/**
 * SeasonPanel. One collapsible card answering "what does this time of year
 * need?" — merging the former season-rhythm card (inline in TodayScreen) and
 * AlmanacHighlight (C.4), which duplicated each other's calendar framing.
 *
 * Order: month headline + note → care rhythm rows → children (Jeevamrutha
 * strip, green-manure prompt) → link to the full 12-month almanac.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/seasonPanelStyles';
import { getMonthlyHighlight } from '@/config/almanac';
import { shortenSeasonLabel } from '@/utils/seasonHelpers';
import type { SeasonalFrequency } from '@/config/organicInputs/seasonalAdaptations';

interface Props {
  /** Current-season care cadences; the rhythm rows are hidden when null. */
  rhythm: SeasonalFrequency | null;
  /** Full season label, e.g. "SW Monsoon (Jun–Sep)". */
  seasonLabel: string;
  expanded: boolean;
  onToggle: () => void;
  onViewAlmanac: () => void;
  /** Rendered inside the card, below the rhythm rows. */
  children?: React.ReactNode;
}

export const SeasonPanel = React.memo(function SeasonPanel({
  rhythm,
  seasonLabel,
  expanded,
  onToggle,
  onViewAlmanac,
  children,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const month = useMemo(() => getMonthlyHighlight(), []);

  const handleToggle = useCallback(() => onToggle(), [onToggle]);
  const handleViewAlmanac = useCallback(() => onViewAlmanac(), [onViewAlmanac]);

  const rhythmRows = useMemo(
    () =>
      rhythm === null
        ? []
        : [
            { key: 'water', label: '💧 Water', value: rhythm.waterInterval },
            { key: 'mulch', label: '🍂 Mulch', value: rhythm.mulchCheck },
            { key: 'jeevamrutha', label: '🧪 Jeevamrutha', value: rhythm.jeevamruthaInterval },
          ],
    [rhythm]
  );

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? 'Collapse seasonal guidance' : 'Expand seasonal guidance'
        }
      >
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>
            {month.icon} {month.label} · {shortenSeasonLabel(seasonLabel)}
          </Text>
          {!expanded && <Text style={styles.headerSubtitle}>{month.highlight}</Text>}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.highlight}>{month.highlight}</Text>
          <Text style={styles.note}>{month.note}</Text>

          {rhythmRows.length > 0 && (
            <>
              <View style={styles.divider} />
              {rhythmRows.map((row) => (
                <View key={row.key} style={styles.rhythmRow}>
                  <Text style={styles.rhythmLabel}>{row.label}</Text>
                  <Text style={styles.rhythmValue}>{row.value}</Text>
                </View>
              ))}
            </>
          )}

          {children}

          <TouchableOpacity style={styles.link} onPress={handleViewAlmanac} activeOpacity={0.7}>
            <Text style={styles.linkText}>All 12 months</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});
