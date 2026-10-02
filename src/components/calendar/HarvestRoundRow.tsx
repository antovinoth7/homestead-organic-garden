import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/carePlanBandStyles';
import type { CarePlanRow } from '@/utils/carePlanSections';
import { getPlantImage } from '@/config/referenceAssets';
import { TASK_BEST_TIME } from '@/utils/taskTimeWindow';

type RoundRow = Extract<CarePlanRow, { kind: 'harvestRound' | 'harvest' | 'harvestSoonToggle' }>;

interface Props {
  row: RoundRow;
  onToggleRound: () => void;
  onToggleSoon: () => void;
  onLogHarvest: (plantId: string) => void;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "Pick before 9 AM" — the harvest window, from the same table the cards use. */
const PICK_BEFORE = `Pick ${(TASK_BEST_TIME.harvest?.label ?? 'Before 9 AM').replace(/^Before/, 'before')}`;

/**
 * One row of the harvest-round card: the folded head ("Harvest round · 17
 * ready"), a crop to check with its + Log action, or the "Harvest soon" toggle.
 * The rows stack into one green card; `first` / `last` round its corners.
 */
export function HarvestRoundRow({
  row,
  onToggleRound,
  onToggleSoon,
  onLogHarvest,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const frame = [
    styles.round,
    row.first ? styles.roundFirst : styles.roundDivider,
    row.last && styles.roundLast,
  ];

  if (row.kind === 'harvestRound') {
    const late =
      row.lateCount > 0
        ? ` · ${row.lateCount === 1 ? '1 is' : `${row.lateCount} are`} ${plural(row.maxLateDays, 'day')} late`
        : '';
    const title = `Harvest round · ${row.readyCount} ready`;
    return (
      <TouchableOpacity
        style={[...frame, styles.roundHead]}
        onPress={onToggleRound}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: row.expanded }}
        accessibilityLabel={`${title}. ${PICK_BEFORE}${late}`}
      >
        <View style={styles.roundHeadBody}>
          <Text style={styles.roundTitle}>{title}</Text>
          <Text style={styles.roundSubtitle} numberOfLines={1}>
            {`${PICK_BEFORE}${late}`}
          </Text>
        </View>
        <Ionicons
          name={row.expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.successDark}
        />
      </TouchableOpacity>
    );
  }

  if (row.kind === 'harvestSoonToggle') {
    const { count, fromDays, toDays } = row;
    const span = fromDays === toDays ? `in ${fromDays} days` : `in ${fromDays}–${toDays} days`;
    const summary = `Harvest soon · ${plural(count, 'crop')}`;
    return (
      <TouchableOpacity
        style={[...frame, styles.soonToggle]}
        onPress={onToggleSoon}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: row.expanded }}
        accessibilityLabel={`${summary}, ${span}`}
      >
        <Text style={styles.soonToggleText}>{summary}</Text>
        <Text style={styles.soonToggleMeta}>{span}</Text>
        <Ionicons
          name={row.expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textTertiary}
        />
      </TouchableOpacity>
    );
  }

  const harvest = row.item;
  const isLate = harvest.isReady && harvest.daysUntil < 0;
  const status = harvest.isReady
    ? isLate
      ? `Overdue by ${plural(-harvest.daysUntil, 'day')}`
      : 'Ready to check'
    : `Check in ${plural(harvest.daysUntil, 'day')}`;
  return (
    <View style={[...frame, styles.roundItem]}>
      <ReferenceThumb
        source={getPlantImage(harvest.plant.name)}
        fallbackIcon="general.plant"
        variant="row"
        accessibilityLabel={`${harvest.plant.name} reference image`}
      />
      <View style={styles.roundItemBody}>
        <Text style={styles.roundItemName} numberOfLines={1}>
          {harvest.plant.name}
        </Text>
        <Text
          style={[
            styles.roundItemStatus,
            isLate && styles.roundItemStatusLate,
            !harvest.isReady && styles.roundItemStatusSoon,
          ]}
          numberOfLines={1}
        >
          {status}
          <Text style={styles.roundItemSource}>
            {harvest.source === 'farmer_date' ? ' · Your date' : ' · Scheduled'}
          </Text>
        </Text>
      </View>
      <TouchableOpacity
        style={styles.roundLog}
        onPress={() => onLogHarvest(harvest.plant.id)}
        accessibilityRole="button"
        accessibilityLabel={`Log harvest for ${harvest.plant.name}`}
      >
        <Text style={styles.roundLogText}>+ Log</Text>
      </TouchableOpacity>
    </View>
  );
}
