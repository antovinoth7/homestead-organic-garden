import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import type { BedRow } from '@/utils/rowLayoutEngine';

interface RowGutterProps {
  rows: BedRow[];
  lengthCm: number;
  lengthM: number;
  height: number;
  warningByRow: Map<number, string>;
}

/**
 * Left-hand gutter that shows each row's number ("R1…Rn") OUTSIDE the bed margin,
 * aligned to the row centreline, plus faint half-metre tick lines for scale. Lives
 * outside the canvas zoom/pan transform so labels stay readable and stable.
 */
export function RowGutter({
  rows,
  lengthCm,
  lengthM,
  height,
  warningByRow,
}: RowGutterProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const ticks = useMemo<number[]>(() => {
    const out: number[] = [];
    for (let m = 0.5; m < lengthM - 1e-6; m += 0.5) {
      out.push(Math.round(m * 10) / 10);
    }
    return out;
  }, [lengthM]);

  return (
    <View style={[styles.tdmGutter, { height }]}>
      {ticks.map((m) => (
        <View key={`tick-${m}`} style={[styles.tdmGutterTick, { top: `${(m / lengthM) * 100}%` }]} />
      ))}
      {rows.map((row) => {
        const warning = warningByRow.get(row.rowIndex);
        return (
          <View
            key={`gutter-${row.rowIndex}`}
            style={[styles.tdmGutterRow, { top: `${(row.northEdgeCm / lengthCm) * 100}%` }]}
            accessibilityLabel={`Row ${row.rowIndex}${warning ? `, warning: ${warning}` : ''}`}
          >
            <Text style={styles.tdmGutterRowText}>R{row.rowIndex}</Text>
            {warning ? <Text style={styles.tdmGutterRowWarn}>⚠</Text> : null}
          </View>
        );
      })}
    </View>
  );
}
