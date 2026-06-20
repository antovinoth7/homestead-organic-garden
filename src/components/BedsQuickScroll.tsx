/**
 * BedsQuickScroll (Phase C, C.12).
 *
 * Horizontal scroll of bed mini-cards (type-colored badge, status dot + chip,
 * plant count) ending in a ghost "New bed" card. Replaces the aggregate
 * "Beds Overview" stat card. Reuses BED_TYPE_EMOJI + getBedStatus.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BedType } from '@/types/database.types';
import { BedWithCoverage } from '@/hooks/useBedData';
import { BED_TYPE_EMOJI } from '@/components/BedCard';
import {
  getBedStatus,
  LIFECYCLE_LABEL,
  LIFECYCLE_PILL_BG_TOKEN,
  LIFECYCLE_PILL_TEXT_TOKEN,
  LIFECYCLE_STRIPE_TOKEN,
} from '@/utils/bedStatus';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedsQuickScrollStyles';

interface Props {
  beds: BedWithCoverage[];
  onPressBed: (bed: BedWithCoverage) => void;
  onNewBed: () => void;
}

/** Bed type → theme color token for the badge tint. */
const BED_TYPE_TOKEN: Record<BedType, 'success' | 'warning' | 'info' | 'accent' | 'primary'> = {
  leafy: 'success',
  fruiting: 'warning',
  spice: 'info',
  root_legume: 'accent',
  climber_trellis: 'primary',
  three_sisters: 'warning',
  medicinal_guild: 'info',
};

export const BedsQuickScroll = React.memo(function BedsQuickScroll({
  beds,
  onPressBed,
  onNewBed,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (beds.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>🪴 Beds</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {beds.map((bed) => (
          <BedMiniCard key={bed.id} bed={bed} styles={styles} theme={theme} onPress={onPressBed} />
        ))}
        <TouchableOpacity style={styles.ghostCard} activeOpacity={0.75} onPress={onNewBed}>
          <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          <Text style={styles.ghostText}>New bed</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
});

interface CardProps {
  bed: BedWithCoverage;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>;
  onPress: (bed: BedWithCoverage) => void;
}

function BedMiniCard({ bed, styles, theme, onPress }: CardProps): React.JSX.Element {
  const handlePress = useCallback(() => onPress(bed), [onPress, bed]);
  const status = useMemo(() => getBedStatus(bed), [bed]);
  const tint = theme[BED_TYPE_TOKEN[bed.type] ?? 'primary'];
  const dotColor = theme[LIFECYCLE_STRIPE_TOKEN[status.lifecycle]];
  const chipBg = theme[LIFECYCLE_PILL_BG_TOKEN[status.lifecycle]];
  const chipText = theme[LIFECYCLE_PILL_TEXT_TOKEN[status.lifecycle]];

  const statusLabel = bed.water_overdue
    ? 'Due water'
    : status.lifecycle === 'resting'
      ? status.restComplete
        ? 'Rest done'
        : `Resting · ${status.restDaysRemaining ?? 0}d`
      : LIFECYCLE_LABEL[status.lifecycle];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={handlePress}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: tint + '22' }]}>
          <Text style={styles.typeBadgeText}>{BED_TYPE_EMOJI[bed.type] ?? '🌿'}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      </View>
      <Text style={styles.bedName} numberOfLines={1}>
        {bed.name}
      </Text>
      <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
        <Text style={[styles.statusChipText, { color: chipText }]}>{statusLabel}</Text>
      </View>
      <Text style={styles.plantCount}>🌱 {bed.active_plant_count} planted</Text>
    </TouchableOpacity>
  );
}
