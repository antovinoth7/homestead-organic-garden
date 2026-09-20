import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from './GardenIcon';
import { SheetHandle } from './SheetHandle';
import { TAB_BAR_HEIGHT } from './FloatingTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { createStyles } from '../styles/calendarStyles';
import { TASK_ICON_KEYS } from '../config/iconRegistry';
import {
  TASK_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_ORDER,
  taskPriorityColor,
} from '../utils/taskConstants';
import {
  TASK_DUE_STATUS_LABELS,
  TASK_DUE_STATUS_ORDER,
  TASK_PRIORITY_ORDER,
  TASK_SORT_LABELS,
  TASK_TIME_OF_DAY_LABELS,
  TASK_TIME_OF_DAY_ORDER,
  type CareTaskFacetCounts,
  type CareTaskFilters,
  type TaskDueStatus,
  type TaskPriority,
  type TaskSortOption,
  type TaskTimeOfDay,
} from '../utils/careTaskFilters';
import type { Bed, TaskType } from '../types/database.types';
import type { PlotGroup } from '../utils/plotGrouping';

export type CareGroupByOption = 'none' | 'location' | 'type' | 'plant';
type Styles = ReturnType<typeof createStyles>;

const SORT_OPTIONS: readonly {
  value: TaskSortOption;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { value: 'due', icon: 'calendar-outline' },
  { value: 'priority', icon: 'alert-circle-outline' },
  { value: 'plant', icon: 'leaf-outline' },
];

const GROUP_OPTIONS: readonly { value: CareGroupByOption; label: string }[] = [
  { value: 'none', label: 'No Grouping' },
  { value: 'location', label: 'Location' },
  { value: 'type', label: 'Type' },
  { value: 'plant', label: 'Plant' },
];

/** Overdue draws the warning GardenIcon instead, matching the Overdue section. */
const DUE_STATUS_ICONS: Record<
  Exclude<TaskDueStatus, 'overdue'>,
  React.ComponentProps<typeof Ionicons>['name']
> = {
  today: 'today-outline',
  upcoming: 'calendar-outline',
};

const TIME_ICONS: Record<TaskTimeOfDay, React.ComponentProps<typeof Ionicons>['name']> = {
  morning: 'sunny-outline',
  afternoon: 'sunny',
  evening: 'moon-outline',
  unset: 'ellipsis-horizontal',
};

/** A facet count, dimmed at zero so an unavailable option still reads as one. */
function FacetCount({ count, styles }: { count: number; styles: Styles }): React.JSX.Element {
  return <Text style={count === 0 ? styles.sheetChipCountZero : undefined}> ({count})</Text>;
}

export interface CareTaskFilterSheetProps {
  filters: CareTaskFilters;
  facetCounts: CareTaskFacetCounts;
  groupBy: CareGroupByOption;
  sortBy: TaskSortOption;
  /** Plots that actually hold tasks, in configured order. */
  plotGroups: PlotGroup[];
  /** Beds offered by the bed filter — empty outside the Beds segment. */
  beds: Bed[];
  /** False when nothing on the plan names a time, so the section is pointless. */
  showTimeFilter: boolean;
  hasActiveFilters: boolean;
  onToggleTaskType: (type: TaskType) => void;
  onToggleDueStatus: (status: TaskDueStatus) => void;
  onTogglePlot: (plotId: string) => void;
  onToggleBed: (bedId: string) => void;
  onTogglePriority: (priority: TaskPriority) => void;
  onToggleTime: (time: TaskTimeOfDay) => void;
  onChangeGroupBy: (value: CareGroupByOption) => void;
  onChangeSortBy: (value: TaskSortOption) => void;
  onClearAll: () => void;
  onClose: () => void;
}

/**
 * The Care Plan's View Options sheet.
 *
 * Lifted out of CalendarScreen when the filter set grew past task type and
 * "overdue only" — the screen was already 2,500 lines, and the Plants and Beds
 * screens both keep their sheet in its own component. Every chip reuses the
 * sheetChip* styles the screen already shares with its other sheets, so nothing
 * here defines a look of its own.
 *
 * Presentational: it holds no filter state and decides nothing about what the
 * list shows. Selection lives in the screen; the meaning lives in
 * `careTaskFilters.ts`.
 */
export function CareTaskFilterSheet({
  filters,
  facetCounts,
  groupBy,
  sortBy,
  plotGroups,
  beds,
  showTimeFilter,
  hasActiveFilters,
  onToggleTaskType,
  onToggleDueStatus,
  onTogglePlot,
  onToggleBed,
  onTogglePriority,
  onToggleTime,
  onChangeGroupBy,
  onChangeSortBy,
  onClearAll,
  onClose,
}: CareTaskFilterSheetProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.sheetContainer,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) },
        ]}
      >
        <SheetHandle onClose={onClose} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>View Options</Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={onClearAll} style={styles.sheetClearBtn}>
              <Text style={styles.sheetClearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          bounces={false}
          nestedScrollEnabled
        >
          {/* Status — the same three-way split the list already renders as its
              Overdue, Today and upcoming sections. Multi-select like Priority
              below, so Overdue + Due today reads as "everything owed now". */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="flag" size={14} color={theme.textSecondary} /> Status
          </Text>
          <View style={styles.sheetChipWrap}>
            {TASK_DUE_STATUS_ORDER.map((status) => {
              const isActive = filters.dueStatuses.has(status);
              return (
                <TouchableOpacity
                  key={status}
                  testID={`care-filter-status-${status}`}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => onToggleDueStatus(status)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  {status === 'overdue' ? (
                    <GardenIcon
                      name="general.warning"
                      size={15}
                      color={isActive ? theme.primary : theme.textSecondary}
                    />
                  ) : (
                    <Ionicons
                      name={DUE_STATUS_ICONS[status]}
                      size={14}
                      color={isActive ? theme.primary : theme.textSecondary}
                    />
                  )}
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {TASK_DUE_STATUS_LABELS[status]}
                    <FacetCount count={facetCounts.dueStatuses[status]} styles={styles} />
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location — main location (plot) only. Sub-locations are deliberately
              not offered: they splinter a plan into one-task slivers, and the Bed
              section below is the finer breakdown that earns its place. A single
              plot needs no chips, so the section only appears from two up. */}
          {plotGroups.length > 1 && (
            <>
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="location" size={14} color={theme.textSecondary} /> Location
              </Text>
              <View style={styles.sheetChipWrap}>
                {plotGroups.map((group) => {
                  const isActive = filters.plotIds.has(group.id);
                  return (
                    <TouchableOpacity
                      key={group.id}
                      testID={`care-filter-plot-${group.id}`}
                      style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                      onPress={() => onTogglePlot(group.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={isActive ? theme.primary : theme.textSecondary}
                      />
                      <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                        {group.name}
                        <FacetCount count={facetCounts.plotIds[group.id] ?? 0} styles={styles} />
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Priority */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="alert-circle" size={14} color={theme.textSecondary} /> Priority
          </Text>
          <View style={styles.sheetChipWrap}>
            {TASK_PRIORITY_ORDER.map((priority) => {
              const isActive = filters.priorities.has(priority);
              return (
                <TouchableOpacity
                  key={priority}
                  testID={`care-filter-priority-${priority}`}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => onTogglePriority(priority)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons name="ellipse" size={10} color={taskPriorityColor(theme, priority)} />
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {TASK_PRIORITY_LABELS[priority]}
                    <FacetCount count={facetCounts.priorities[priority]} styles={styles} />
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time of day — hidden entirely when no task names one, which is the
              norm: every synced template is created with a null preferred_time,
              so only hand-created tasks populate this. */}
          {showTimeFilter && (
            <>
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="time" size={14} color={theme.textSecondary} /> Time of Day
              </Text>
              <View style={styles.sheetChipWrap}>
                {TASK_TIME_OF_DAY_ORDER.map((time) => {
                  const isActive = filters.times.has(time);
                  return (
                    <TouchableOpacity
                      key={time}
                      testID={`care-filter-time-${time}`}
                      style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                      onPress={() => onToggleTime(time)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Ionicons
                        name={TIME_ICONS[time]}
                        size={14}
                        color={isActive ? theme.primary : theme.textSecondary}
                      />
                      <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                        {TASK_TIME_OF_DAY_LABELS[time]}
                        <FacetCount count={facetCounts.times[time]} styles={styles} />
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Bed — only supplied in the Beds segment, where every task has one. */}
          {beds.length > 0 && (
            <>
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="grid" size={14} color={theme.textSecondary} /> Bed
              </Text>
              <View style={styles.sheetChipWrap}>
                {beds.map((bed) => {
                  const isActive = filters.bedIds.has(bed.id);
                  return (
                    <TouchableOpacity
                      key={bed.id}
                      testID={`care-filter-bed-${bed.id}`}
                      style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                      onPress={() => onToggleBed(bed.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <GardenIcon
                        name="general.bed"
                        size={14}
                        color={isActive ? theme.primary : theme.textSecondary}
                      />
                      <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                        {bed.name}
                        <FacetCount count={facetCounts.bedIds[bed.id] ?? 0} styles={styles} />
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Task type */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="apps" size={14} color={theme.textSecondary} /> Task Type
          </Text>
          <View style={styles.sheetChipWrap}>
            {TASK_TYPE_ORDER.map((type) => {
              const isActive = filters.taskTypes.has(type);
              return (
                <TouchableOpacity
                  key={type}
                  testID={`care-filter-type-${type}`}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => onToggleTaskType(type)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <GardenIcon
                    name={TASK_ICON_KEYS[type]}
                    size={15}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {TASK_LABELS[type]}
                    <FacetCount count={facetCounts.taskTypes[type] ?? 0} styles={styles} />
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Group By */}
          <Text style={styles.sheetSectionTitle}>Group By</Text>
          <View style={styles.sheetChipWrap}>
            {GROUP_OPTIONS.map((option) => {
              const isActive = groupBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  testID={`care-group-${option.value}`}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => onChangeGroupBy(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sort By */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="swap-vertical" size={14} color={theme.textSecondary} /> Sort By
          </Text>
          <View style={styles.sheetChipWrap}>
            {SORT_OPTIONS.map(({ value, icon }) => {
              const isActive = sortBy === value;
              return (
                <TouchableOpacity
                  key={value}
                  testID={`care-sort-${value}`}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => onChangeSortBy(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons
                    name={icon}
                    size={14}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {TASK_SORT_LABELS[value]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

export default CareTaskFilterSheet;
