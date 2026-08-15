/**
 * BedsQuickScroll (Phase C, C.12).
 *
 * Horizontal rail of bed cards ending in a ghost "New bed" tile. Each card
 * leads with a grid-paper tile carrying the bed's own plant emoji, so the row
 * reads as a glance at the garden rather than a list of counts; the name,
 * status chip and plant count sit beneath it.
 *
 * Reuses getBedStatus for the lifecycle and bedPreview for the pins and the
 * stage-aware chip label.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { getPlantImage } from '@/config/referenceAssets';
import { BedWithCoverage } from '@/hooks/useBedData';
import { BED_TYPE_ICON_KEYS } from '@/config/iconRegistry';
import { SectionHeader } from '@/components/SectionHeader';
import {
  getBedStatus,
  LIFECYCLE_PILL_BG_TOKEN,
  LIFECYCLE_PILL_TEXT_TOKEN,
} from '@/utils/bedStatus';
import { bedCardStatusLabel } from '@/utils/bedPreview';
import { useTheme } from '@/theme';
import {
  createStyles,
  BED_PREVIEW_CELL,
  BED_PREVIEW_HEIGHT,
  BED_PREVIEW_WIDTH,
} from '@/styles/bedsQuickScrollStyles';

interface Props {
  beds: BedWithCoverage[];
  onPressBed: (bed: BedWithCoverage) => void;
  onNewBed: () => void;
  onPressAllBeds: () => void;
}

/**
 * Grid-line offsets. The preview is a fixed size, so these are computed once at
 * module scope — no onLayout pass and no SVG for what is a handful of hairlines.
 */
const GRID_X = buildOffsets(BED_PREVIEW_WIDTH);
const GRID_Y = buildOffsets(BED_PREVIEW_HEIGHT);

function buildOffsets(extent: number): number[] {
  const offsets: number[] = [];
  for (let at = BED_PREVIEW_CELL; at < extent; at += BED_PREVIEW_CELL) offsets.push(at);
  return offsets;
}

export const BedsQuickScroll = React.memo(function BedsQuickScroll({
  beds,
  onPressBed,
  onNewBed,
  onPressAllBeds,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (beds.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Beds" actionLabel="All beds" onPressAction={onPressAllBeds} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {beds.map((bed) => (
          <BedMiniCard key={bed.id} bed={bed} styles={styles} theme={theme} onPress={onPressBed} />
        ))}
        <TouchableOpacity
          style={styles.ghostCard}
          activeOpacity={0.75}
          onPress={onNewBed}
          accessibilityRole="button"
          accessibilityLabel="Create a new bed"
        >
          <Ionicons name="add-outline" size={20} color={theme.primary} />
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
  const chipBg = theme[LIFECYCLE_PILL_BG_TOKEN[status.lifecycle]];
  const chipText = theme[LIFECYCLE_PILL_TEXT_TOKEN[status.lifecycle]];
  const statusLabel = bedCardStatusLabel(bed, status, bed.dominant_stage);

  // An empty bed still gets a pin — a faded bed-type emoji — so the tile never
  // reads as a failed render.
  const pins = bed.preview_plant_names;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${bed.name}, ${statusLabel}, ${bed.active_plant_count} planted`}
    >
      <View style={styles.preview}>
        {GRID_X.map((x) => (
          <View key={`x${x}`} style={[styles.gridLineV, { left: x }]} />
        ))}
        {GRID_Y.map((y) => (
          <View key={`y${y}`} style={[styles.gridLineH, { top: y }]} />
        ))}
        <View style={styles.pinRow}>
          {pins.length > 0 ? (
            pins.map((plantName, i) => (
              <ReferenceThumb
                key={`${plantName}-${i}`}
                source={getPlantImage(plantName)}
                variant="chip"
                recyclingKey={`${bed.id}:${plantName}:${i}`}
              />
            ))
          ) : (
            <View style={styles.pinPlaceholder}>
              <GardenIcon name={BED_TYPE_ICON_KEYS[bed.type]} size={18} color={theme.primary} />
            </View>
          )}
        </View>
      </View>

      <Text style={styles.bedName} numberOfLines={1}>
        {bed.name}
      </Text>

      <View style={styles.metaRow}>
        <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
          <Text style={[styles.statusChipText, { color: chipText }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.plantCount} numberOfLines={1}>
          {bed.active_plant_count} planted
        </Text>
      </View>
    </TouchableOpacity>
  );
}
