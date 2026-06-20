/**
 * TaskListSection (Phase C, C.15).
 *
 * On-dashboard checkable task list — overdue rows sorted to the top, each
 * completable inline via `onComplete`. "See all" jumps to the Care Plan.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskTemplate } from '@/types/database.types';
import { TASK_EMOJIS, TASK_LABELS } from '@/utils/taskConstants';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/taskListSectionStyles';

const MAX_ROWS = 6;

interface Props {
  overdue: TaskTemplate[];
  today: TaskTemplate[];
  /** Map of plant/bed id → display name for the row subtitle. */
  targetNames: Record<string, string>;
  onComplete: (template: TaskTemplate) => void;
  onSeeAll: () => void;
}

function dueTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const TaskListSection = React.memo(function TaskListSection({
  overdue,
  today,
  targetNames,
  onComplete,
  onSeeAll,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const rows = useMemo(
    () =>
      [...overdue.map((t) => ({ t, isOverdue: true })), ...today.map((t) => ({ t, isOverdue: false }))].slice(
        0,
        MAX_ROWS
      ),
    [overdue, today]
  );

  if (rows.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>✅ Today&apos;s Tasks</Text>
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      {rows.map(({ t, isOverdue }) => (
        <TaskRow
          key={t.id}
          template={t}
          isOverdue={isOverdue}
          targetName={
            (t.plant_id && targetNames[t.plant_id]) ||
            (t.bed_id && targetNames[t.bed_id]) ||
            undefined
          }
          styles={styles}
          theme={theme}
          onComplete={onComplete}
        />
      ))}
    </View>
  );
});

interface RowProps {
  template: TaskTemplate;
  isOverdue: boolean;
  targetName?: string;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>;
  onComplete: (template: TaskTemplate) => void;
}

function TaskRow({
  template,
  isOverdue,
  targetName,
  styles,
  theme,
  onComplete,
}: RowProps): React.JSX.Element {
  const handleComplete = useCallback(() => onComplete(template), [onComplete, template]);
  const label = TASK_LABELS[template.task_type];
  const emoji = TASK_EMOJIS[template.task_type];

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={handleComplete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="checkmark" size={16} color={theme.border} />
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {emoji} {label}
          {targetName ? ` · ${targetName}` : ''}
        </Text>
        {!isOverdue && template.next_due_at && (
          <Text style={styles.rowSub}>Due {dueTime(template.next_due_at)}</Text>
        )}
      </View>
      {isOverdue && (
        <View style={styles.overdueBadge}>
          <Text style={styles.overdueBadgeText}>Overdue</Text>
        </View>
      )}
    </View>
  );
}
