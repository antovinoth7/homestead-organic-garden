import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';
import { createStyles } from '@/styles/plantHistoryTabStyles';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import type { SegmentedTab } from '@/components/SegmentedTabs';
import { usePlantHistory } from '@/hooks/usePlantHistory';
import { filterHistoryItems } from '@/utils/plantHistory';
import type { PlantHistoryItem, HistoryFilter } from '@/utils/plantHistory';
import { JournalEntryType } from '@/types/database.types';
import type { Plant, JournalEntry, TaskType } from '@/types/database.types';

interface Props {
  plant: Plant;
  journalEntries: JournalEntry[];
  enabled: boolean;
}

const FILTERS: readonly SegmentedTab<HistoryFilter>[] = [
  { key: 'all', label: 'All' },
  { key: 'journal', label: 'Journal' },
  { key: 'task_log', label: 'Care' },
  { key: 'pest_disease', label: 'Pests & Disease' },
  { key: 'growth_stage', label: 'Growth' },
];

const TASK_LABELS: Record<TaskType, string> = {
  water: 'Watered',
  fertilise: 'Fertilised',
  prune: 'Pruned',
  repot: 'Repotted',
  spray: 'Sprayed',
  mulch: 'Mulched',
  harvest: 'Harvested',
  harvest_leaves: 'Harvested leaves',
  weeding: 'Weeded',
  transplanting: 'Transplanted',
  cultivating: 'Cultivated',
};

const EMPTY_COPY: Record<HistoryFilter, string> = {
  all: 'Journal entries, completed tasks, pest records and growth changes will appear here.',
  journal: 'No journal entries for this plant yet.',
  task_log: 'No completed care tasks yet.',
  pest_disease: 'No pest or disease records yet.',
  growth_stage: 'No growth-stage changes recorded yet.',
};

interface RowVisual {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  detail?: string;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function describeItem(item: PlantHistoryItem, theme: Theme): RowVisual {
  switch (item.kind) {
    case 'journal': {
      const iconByType: Record<JournalEntryType, React.ComponentProps<typeof Ionicons>['name']> = {
        [JournalEntryType.Observation]: 'eye',
        [JournalEntryType.Harvest]: 'basket',
        [JournalEntryType.PestDisease]: 'bug',
        [JournalEntryType.Issue]: 'alert-circle',
        [JournalEntryType.Milestone]: 'flag',
        [JournalEntryType.Other]: 'document-text',
      };
      return {
        icon: iconByType[item.entry.entry_type] ?? 'document-text',
        color: theme.primary,
        title: capitalize(item.entry.entry_type),
        detail: item.entry.content || undefined,
      };
    }
    case 'pest_disease': {
      const parts = [
        item.record.severity ? `${capitalize(item.record.severity)} severity` : null,
        item.record.treatment ? `Treatment: ${item.record.treatment}` : null,
        item.record.resolved ? 'Resolved' : null,
      ].filter(Boolean);
      return {
        icon: item.record.type === 'pest' ? 'bug' : 'medical',
        color: item.record.resolved ? theme.success : theme.error,
        title: item.record.name,
        detail: parts.length > 0 ? parts.join(' · ') : undefined,
      };
    }
    case 'growth_stage':
      return {
        icon: 'trending-up',
        color: theme.info,
        title: `Growth stage: ${capitalize(item.entry.stage)}`,
      };
    case 'task_log': {
      const notes = [item.log.product_used, item.log.notes].filter(Boolean).join(' · ');
      return {
        icon: 'checkmark-circle',
        color: theme.success,
        title: TASK_LABELS[item.log.task_type] ?? capitalize(item.log.task_type),
        detail: notes || undefined,
      };
    }
  }
}

/** Merged, filterable chronological history for a plant. */
export function PlantHistorySection({ plant, journalEntries, enabled }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { items, loading, error } = usePlantHistory({ plant, journalEntries, enabled });
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const filtered = useMemo(() => filterHistoryItems(items, filter), [items, filter]);

  const renderRow = useCallback(
    (item: PlantHistoryItem) => {
      const visual = describeItem(item, theme);
      const date = new Date(item.date);
      const dateLabel = Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      return (
        <View key={item.id} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name={visual.icon} size={18} color={visual.color} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{visual.title}</Text>
            {visual.detail && (
              <Text style={styles.rowDetail} numberOfLines={2}>
                {visual.detail}
              </Text>
            )}
            {dateLabel !== '' && <Text style={styles.rowDate}>{dateLabel}</Text>}
          </View>
          {/* Right accessory slot reserved for future inline task completion. */}
        </View>
      );
    },
    [styles, theme]
  );

  return (
    <View style={styles.container}>
      <SegmentedTabs tabs={FILTERS} activeKey={filter} onChange={setFilter} />
      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="time-outline" size={44} color={theme.textTertiary} />
          <Text style={styles.emptyText}>{error ?? EMPTY_COPY[filter]}</Text>
        </View>
      ) : (
        <View style={styles.list}>{filtered.map(renderRow)}</View>
      )}
    </View>
  );
}
