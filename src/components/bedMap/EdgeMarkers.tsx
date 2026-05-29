import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedCreationWizardStyles';

interface EdgeRailProps {
  side: 'west' | 'east';
  edgeCm: number;
  height: number;
}

/**
 * A thin vertical rail flanking the canvas that marks the left/right (E-W) edge
 * setback — the gap from the bed's side wall to the first/last plant column. The
 * north/south path + edge gaps are shown by the pole rows in BedTopDownMap.
 */
export function EdgeRail({ side, edgeCm, height }: EdgeRailProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={[styles.tdmEdgeRail, { height }]}
      accessibilityLabel={`${side === 'west' ? 'West' : 'East'} edge gap ${edgeCm} centimetres`}
    >
      <Text style={styles.tdmEdgeRailLabel} numberOfLines={1}>
        ↔ {edgeCm} cm
      </Text>
    </View>
  );
}
