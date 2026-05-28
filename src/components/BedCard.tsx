import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { BedWithCoverage } from '@/hooks/useBedData';
import { createStyles } from '@/styles/bedListStyles';

interface Props {
  bed: BedWithCoverage;
  onPress: () => void;
}

const BED_TYPE_EMOJI: Record<string, string> = {
  leafy: '🥬',
  fruiting: '🍅',
  spice: '🌿',
  root_legume: '🥕',
  climber_trellis: '🌱',
  three_sisters: '🌽',
  medicinal_guild: '🌾',
};

export function BedCard({ bed, onPress }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const occupancyPct =
    bed.plant_count > 0 ? Math.min(100, Math.round((bed.plant_count / 8) * 100)) : 0;
  const emoji = BED_TYPE_EMOJI[bed.type] ?? '🌿';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardName}>{bed.name}</Text>
          <Text style={styles.cardType}>{bed.type.replace(/_/g, ' ')}</Text>
        </View>
        <View style={styles.cardMetaBlock}>
          <Text style={styles.cardArea}>{bed.dimensions.area_sqm} sqm</Text>
          {bed.is_raised_bed && <Text style={styles.raisedTag}>Raised</Text>}
        </View>
      </View>

      {/* Occupancy bar */}
      <View style={styles.barContainer}>
        <Text style={styles.barLabel}>Occupancy</Text>
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, { width: `${occupancyPct}%`, backgroundColor: theme.primary }]}
          />
        </View>
        <Text style={styles.barValue}>{occupancyPct}%</Text>
      </View>

      {/* Legume coverage */}
      <View style={styles.barContainer}>
        <Text style={styles.barLabel}>Legumes</Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${bed.legume_coverage_pct}%`,
                backgroundColor:
                  bed.legume_coverage_pct < 20
                    ? theme.warning ?? '#f59e0b'
                    : theme.success ?? '#22c55e',
              },
            ]}
          />
        </View>
        <Text style={styles.barValue}>{bed.legume_coverage_pct}%</Text>
      </View>
    </TouchableOpacity>
  );
}
