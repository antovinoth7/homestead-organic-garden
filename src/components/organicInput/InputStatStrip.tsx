import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/organicInputDetailStyles';

interface Props {
  rate?: string;
  timing?: string;
  idealForCount: number;
}

const EMPTY = '—';

/** Three-up RATE / WHEN / IDEAL FOR readout under the detail hero. */
export function InputStatStrip({ rate, timing, idealForCount }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const idealForLabel =
    idealForCount === 0 ? EMPTY : `${idealForCount} group${idealForCount === 1 ? '' : 's'}`;

  return (
    <View style={styles.statStrip}>
      <View style={styles.statCell}>
        <Text style={styles.statLabel}>RATE</Text>
        <Text style={styles.statValue} numberOfLines={3}>
          {rate ?? EMPTY}
        </Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.statLabel}>WHEN</Text>
        <Text style={styles.statValue} numberOfLines={3}>
          {timing ?? EMPTY}
        </Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.statLabel}>IDEAL FOR</Text>
        <Text style={styles.statValue} numberOfLines={3}>
          {idealForLabel}
        </Text>
      </View>
    </View>
  );
}
