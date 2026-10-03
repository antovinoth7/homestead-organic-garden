import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Easing,
  Platform,
  RefreshControl,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { markTaskDone, skipTaskTemplate, updateTaskTemplate } from '../services/tasks';
import {
  calendarDaysOverdue,
  computeSkipDate,
  isEarlyCompletionBlocked,
  isFutureTask,
  isSkipBlocked,
} from '../services/taskSchedulingLogic';
import { JournalEntryType, TaskTemplate, TaskType, WeatherForecast } from '../types/database.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GardenIcon } from '@/components/GardenIcon';
import {
  TASK_LABELS,
  TASK_TYPE_ORDER,
  EARLY_COMPLETION_BLOCK_REASON,
} from '../utils/taskConstants';
import { useFocusEffect, useIsFocused, useRoute, useNavigation } from '@react-navigation/native';
import { CalendarScreenRouteProp, CalendarScreenNavigationProp } from '../types/navigation.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { createStyles } from '../styles/calendarStyles';
import { sanitizeAlphaNumericSpaces } from '../utils/textSanitizer';
import { useCalendarData } from '../hooks/useCalendarData';
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from '../components/FloatingTabBar';
import { useBedOptions } from '@/hooks/useBedOptions';
import { useWeatherLocations } from '@/hooks/useWeatherLocations';
import { useWeatherByPlot } from '@/hooks/useWeatherByPlot';
import { calculateExpectedHarvestDate } from '../utils/plantHelpers';
import { getDaysToHarvestRange, isTreeLikePlant } from '@/utils/timelineHarvest';
import { hasVarietyCareProfile } from '@/utils/plantCareDefaults';
import { describeWateringCycle } from '../utils/plantWatering';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import TaskCompletionModal from '../components/modals/TaskCompletionModal';
import SkipTaskModal from '../components/modals/SkipTaskModal';
import { AlertDialog, type AlertDialogAction } from '../components/modals/AlertDialog';
import { MonthCalendarSheet } from '@/components/calendar/MonthCalendarSheet';
import { CarePlanDateNav } from '@/components/calendar/CarePlanDateNav';
import { CarePlanProgressCard } from '@/components/calendar/CarePlanProgressCard';
import {
  CarePlanBandFooter,
  CarePlanBandFrame,
  CarePlanBandHeader,
} from '@/components/calendar/CarePlanBand';
import { HarvestRoundRow } from '@/components/calendar/HarvestRoundRow';
import { useMinuteClock } from '@/hooks/useMinuteClock';
import {
  CarePlanTaskCard,
  type CarePlanCardDoneState,
} from '@/components/calendar/CarePlanTaskCard';
import { TaskDetailSheet } from '@/components/calendar/TaskDetailSheet';
import type { HarvestReadyItem } from '@/utils/harvestStats';
import { UndoToast } from '@/components/UndoToast';
import { usePendingCompletions, type CompletionSaveResult } from '@/hooks/usePendingCompletions';
import { getErrorMessage } from '../utils/errorLogging';
import { logger } from '../utils/logger';
import { tapFeedback } from '../utils/haptics';
import {
  addCalendarDays,
  addDaysToDateKey,
  calendarDateFromKey,
  calendarDateKey,
  farmDateKey,
  farmToday,
  formatFarmDate,
} from '@/utils/farmDate';
import CareTaskFilterSheet, { type CareGroupByOption } from '@/components/CareTaskFilterSheet';
import {
  countActiveCareFilters,
  emptyCareTaskFilters,
  taskTimeOfDay,
  toggleSetValue,
  type CareTaskFilters,
  type TaskDueStatus,
  type TaskPriority,
  type TaskSortOption,
  type TaskTimeOfDay,
} from '@/utils/careTaskFilters';
import { getTaskWeatherAdvisory, resolveTaskForecast } from '@/utils/taskWeatherAdvisory';
import { buildPlotRainBanner, RAIN_MOVE_DAYS, type PlotRainBanner } from '@/utils/plotRainMove';
import { locationKey } from '@/utils/locationHelpers';
import { createStyles as createSectionStyles } from '@/styles/carePlanSectionStyles';
import { createStyles as createBandStyles } from '@/styles/carePlanBandStyles';
import {
  HARVEST_ROUND_KEY,
  OVERDUE_SECTION_KEY,
  buildCarePlanSections,
  groupTasksBy,
  summarizeToday,
  type CarePlanDoneItem,
  type CarePlanRow,
  type CarePlanSection,
  type CarePlanTaskGroup,
} from '@/utils/carePlanSections';
import {
  TIME_BANDS,
  TIME_BAND_ORDER,
  currentTimeBand,
  farmClockLabel,
  taskTimeBand,
  type TimeBand,
} from '@/utils/taskTimeWindow';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Virtualized task list model ────────────────────────────────────────────
// The task area renders through a SectionList so long schedules stay windowed
// instead of mounting every task card at once.

type CalendarRow = CarePlanRow;
type CalendarListSection = CarePlanSection;

/**
 * A section another screen can send the plan to. The value is a section `key`
 * from `listSections`, so a new destination costs one member here and nothing
 * else — see the Today plot card's overdue count, which is the only caller.
 */
type CarePlanScrollTarget = 'overdue';

/**
 * How long a requested section is waited for before the request is dropped. The
 * plan may simply not have that section — a farm with no overdue work at all —
 * and a request left armed would jump the list minutes later.
 */
const SCROLL_TARGET_WAIT_MS = 4000;

/**
 * A section scroll in flight. `attempts` counts the times React Native has told
 * us the target was past its measured window (see `handleScrollToIndexFailed`).
 */
interface ScrollRequest {
  target: CarePlanScrollTarget;
  /** When this was armed — the wait is bounded from here, not from each retry. */
  since: number;
  attempts: number;
}

/** Retries past `scrollToLocation`'s measured window before giving up. */
const SCROLL_MAX_ATTEMPTS = 4;

/** Breathing room between a measuring nudge and the retry that follows it. */
const SCROLL_RETRY_DELAY_MS = 120;

/** How long a scroll is given to land before the request is considered done. */
const SCROLL_SETTLE_MS = 600;

/**
 * The "Not due yet" dialog covers three situations, all sharing one surface:
 * `blocked` (water / fertilise / spray, where early completion is refused
 * outright), `confirmEarly` (every other type, where it is allowed but
 * reschedules the cycle from today), and `skipBlocked` (any not-yet-due task —
 * there is nothing to defer until it comes due).
 */
type NotDueDialog = {
  kind: 'blocked' | 'confirmEarly' | 'skipBlocked';
  /** Subjects. For `confirmEarly` in bulk, only the not-yet-due tasks. */
  tasks: TaskTemplate[];
  /** Bulk only: how many of the batch were selected in total. */
  selectedTotal?: number;
  /** Bulk `confirmEarly` only: what Mark done should complete. */
  completeTargets?: TaskTemplate[];
} | null;

/** How the plan is grouped until the farmer picks otherwise in View Options. */
const DEFAULT_GROUP_BY: CareGroupByOption = 'time';

/** Today's band that carries the harvest round — picking is a cool-hours job. */
const HARVEST_HOST_BAND: TimeBand = 'morning';

/** Priority order for Catch up: the band shows the head of this list folded. */
const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * A finished one-off is disabled by its own completion and no longer loads, so
 * its Done today row is drawn from the log: enough to name the job and subject.
 */
const doneStandIn = (item: CarePlanDoneItem): TaskTemplate => ({
  id: item.taskId,
  user_id: '',
  plant_id: item.plantId,
  task_type: item.taskType,
  frequency_days: 0,
  preferred_time: null,
  enabled: false,
  next_due_at: new Date().toISOString(),
  created_at: '',
});

const sanitizeDecimalText = (value: string): string => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [whole = '', ...fractionParts] = cleaned.split('.');
  return fractionParts.length > 0 ? `${whole}.${fractionParts.join('')}` : whole;
};

const optionalNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

export default function CalendarScreen(): React.JSX.Element {
  const route = useRoute<CalendarScreenRouteProp>();
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const sectionStyles = React.useMemo(() => createSectionStyles(theme), [theme]);
  const bandStyles = React.useMemo(() => createBandStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  // Drives the NOW marker on today's time band; idle while another tab is up.
  const isFocused = useIsFocused();
  const now = useMinuteClock(isFocused);
  const scrollViewRef = useRef<SectionList<CalendarRow, CalendarListSection>>(null);
  // A section the plan was asked to open at, held until that section exists.
  // The request lives in a ref because callbacks read it (`scrollToTop` parks
  // itself while one is in flight, the retry handler advances it) and a ref
  // keeps their identity; the counter beside it is what makes the effect run,
  // since a ref set during focus would otherwise sit there unread.
  const scrollRequestRef = useRef<ScrollRequest | null>(null);
  const [scrollArm, setScrollArm] = useState(0);
  /** The scheduled attempt, so a re-render can't schedule a second. */
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Releases the request once the scroll has settled — see `scrollToSection`. */
  const scrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [skipBulkTasks, setSkipBulkTasks] = useState<TaskTemplate[] | null>(null);
  const [showMonthSheet, setShowMonthSheet] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [createTaskInitialDate, setCreateTaskInitialDate] = useState<Date | undefined>(undefined);
  // Set when a plant deep-links here to create a task (from Plant Detail Quick Actions).
  const [createTaskPrefillPlantId, setCreateTaskPrefillPlantId] = useState<string | undefined>(
    undefined
  );
  // Set when a pest/disease action-plan step deep-links here to spray something.
  const [createTaskPrefillType, setCreateTaskPrefillType] = useState<TaskType | undefined>(
    undefined
  );
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [productUsed, setProductUsed] = useState('');
  const [completionReason, setCompletionReason] = useState('');
  const [inputQuantity, setInputQuantity] = useState('');
  const [inputUnit, setInputUnit] = useState('');
  const [treatedArea, setTreatedArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('');
  const [labourMinutes, setLabourMinutes] = useState('');
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<CareGroupByOption>(DEFAULT_GROUP_BY);
  const [sortBy, setSortBy] = useState<TaskSortOption>('due');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  // Every dimension the plan is narrowed by, in one object — the sheet and the
  // hook read the same shape, so neither can drift from the other.
  const [filters, setFilters] = useState<CareTaskFilters>(emptyCareTaskFilters);
  const { beds: bedList } = useBedOptions();
  const bedMap = useMemo(() => new Map(bedList.map((b) => [b.id, b.name])), [bedList]);
  // The calendar's rain markers have to be the farm's, not a hardcoded default.
  // `useWeatherLocations` resolves plot GPS → district → default and both of its
  // reads are cached, so this shares a cache key with the Today screen rather
  // than costing a second fetch. One forecast covers the whole calendar; a farm
  // with several parent locations gets its first one.
  const { plots: weatherPlots } = useWeatherLocations();
  const { byPlotName: weatherByPlotName } = useWeatherByPlot(weatherPlots);
  // Plot names for the task -> plot join. Same source the weather card uses, so
  // the Care Plan's location headers and chips name plots identically.
  const parentLocations = useMemo(() => weatherPlots.map((plot) => plot.name), [weatherPlots]);
  const fallbackPlotName = weatherPlots[0]?.name ?? 'My Farm';
  const effectiveGroupBy = groupBy;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTask, setSkipTask] = useState<TaskTemplate | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [skippingTask, setSkippingTask] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [skipDays, setSkipDays] = useState(1);
  const [scheduleMode, setScheduleMode] = useState<'skip' | 'reschedule'>('skip');
  // Look-ahead harvests start folded away. Deliberately not reset on focus:
  // re-collapsing it under the farmer every time they return to the tab would
  // be more surprising than remembering that they opened it.
  const [harvestSoonExpanded, setHarvestSoonExpanded] = useState(false);
  // Later days and Done today start folded; opened ones stay open across focus.
  const [openSections, setOpenSections] = useState<ReadonlySet<string>>(() => new Set());
  // Per plot (by `locationKey`): the waterings moved past coming rain, with
  // their old due dates so Undo can put them back. Session-only — cleared on focus.
  const [rainMoves, setRainMoves] = useState<Record<string, Record<string, string>>>({});
  const [rainMoveBusy, setRainMoveBusy] = useState<string | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskTemplate | null>(null);
  const [notDueDialog, setNotDueDialog] = useState<NotDueDialog>(null);
  /** Not-yet-due tasks dropped from the current skip batch, reported in the sheet. */
  const [skipExcludedCount, setSkipExcludedCount] = useState(0);
  // Selection pill entrance/exit. `selectionBarMounted` outlives an empty
  // selection just long enough for the exit animation to finish — unmounting on
  // the state change alone would make the pill vanish rather than slide away.
  const [selectionBarMounted, setSelectionBarMounted] = useState(false);
  const selectionBarAnim = useAnimatedValue(0);
  const searchInputRef = React.useRef<TextInput>(null);
  const normalizeSearchText = (value: string): string =>
    sanitizeAlphaNumericSpaces(value).trim().toLowerCase();
  const normalizedSearchQuery = normalizeSearchText(searchQuery);

  const {
    tasks,
    plants,
    initialLoading,
    refreshing,
    error: loadError,
    isStale,
    lastUpdatedAt,
    isMountedRef,
    loadData,
    handleRefresh,
    plantMap,
    filteredTasks,
    harvestsReadyNow: allHarvestsReadyNow,
    harvestsSoon: allHarvestsSoon,
    todayTasks,
    tasksForDisplay,
    facetCounts,
    plotResolution,
    overdueTasks,
    isSearching,
    getTasksForDate,
    getRawTasksForDate,
    getPlantDetails,
    getTaskPriority,
    sortTasks,
    todayLogs,
    templatesById,
  } = useCalendarData({
    normalizedSearchQuery,
    normalizeSearchText,
    selectedDate,
    sortBy,
    filters,
    beds: bedList,
    parentLocations,
    fallbackPlotName,
  });

  const getForecastForTask = useCallback(
    (task: TaskTemplate): WeatherForecast | null =>
      resolveTaskForecast(task, weatherByPlotName, plotResolution.resolveTaskPlotId),
    [weatherByPlotName, plotResolution]
  );

  const activeFilterCount = countActiveCareFilters(filters);
  const isFilterActive = activeFilterCount > 0;

  const clearFilters = useCallback(() => {
    setSelectedTaskIds(new Set());
    setFilters(emptyCareTaskFilters());
  }, []);

  const handleToggleDueStatus = useCallback((status: TaskDueStatus) => {
    setFilters((prev) => ({ ...prev, dueStatuses: toggleSetValue(prev.dueStatuses, status) }));
  }, []);

  const handleToggleTaskType = useCallback((type: TaskType) => {
    setFilters((prev) => ({ ...prev, taskTypes: toggleSetValue(prev.taskTypes, type) }));
  }, []);

  const handleTogglePlot = useCallback((plotId: string) => {
    setFilters((prev) => ({ ...prev, plotIds: toggleSetValue(prev.plotIds, plotId) }));
  }, []);

  const handleToggleBed = useCallback((bedId: string) => {
    setFilters((prev) => ({ ...prev, bedIds: toggleSetValue(prev.bedIds, bedId) }));
  }, []);

  const handleTogglePriority = useCallback((priority: TaskPriority) => {
    setFilters((prev) => ({ ...prev, priorities: toggleSetValue(prev.priorities, priority) }));
  }, []);

  const handleToggleTime = useCallback((time: TaskTimeOfDay) => {
    setFilters((prev) => ({ ...prev, times: toggleSetValue(prev.times, time) }));
  }, []);

  const handleChangeGroupBy = useCallback((value: CareGroupByOption) => {
    setGroupBy(value);
    setShowGroupMenu(false);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedTaskIds(new Set());
    setFilters(emptyCareTaskFilters());
    setGroupBy(DEFAULT_GROUP_BY);
    setSortBy('due');
  }, []);

  // Only beds that actually carry a task are worth a chip.
  const bedFilterOptions = useMemo(
    () =>
      bedList
        .filter((bed) => (facetCounts.bedIds[bed.id] ?? 0) > 0 || filters.bedIds.has(bed.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [bedList, facetCounts, filters.bedIds]
  );

  // Every synced template is created with a null `preferred_time`, so on most
  // farms nothing names a time and the section would only ever offer "Any time".
  const showTimeFilter = useMemo(
    () => tasks.some((task) => taskTimeOfDay(task) !== 'unset'),
    [tasks]
  );

  useEffect(() => {
    // Bail when nothing is selected: these deps include Date objects and the
    // filters object, so this runs on most renders, and an unconditional
    // `new Set()` would re-render the list every time.
    setSelectedTaskIds((previous) => (previous.size === 0 ? previous : new Set()));
  }, [selectedDate, groupBy, sortBy, normalizedSearchQuery, filters]);

  // Drop selected tasks that left the plan. A picked day's tasks count as
  // visible: `tasksForDisplay` leaves them out because they head the list.
  useEffect(() => {
    const visibleIds = new Set(
      [
        ...tasksForDisplay,
        ...overdueTasks,
        ...todayTasks,
        ...(selectedDate ? getTasksForDate(selectedDate) : []),
      ].map((task) => task.id)
    );
    setSelectedTaskIds((previous) => {
      const next = new Set([...previous].filter((id) => visibleIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [tasksForDisplay, overdueTasks, todayTasks, selectedDate, getTasksForDate]);

  // No day picked is "today": the plan is laid out band by band, which a
  // picked "Today" would flatten into one section.
  const setTodayView = React.useCallback(() => {
    setSelectedDate(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData({ force: true });
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData, isMountedRef]);

  // Slide the selection pill in on first selection and out on the last
  // deselection. Unmount happens in the exit callback, not on the state change,
  // so the pill animates away instead of disappearing.
  const hasSelection = selectedTaskIds.size > 0;
  useEffect(() => {
    if (hasSelection) setSelectionBarMounted(true);
    const animation = Animated.timing(selectionBarAnim, {
      toValue: hasSelection ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished && !hasSelection) setSelectionBarMounted(false);
    });
    return () => animation.stop();
  }, [hasSelection, selectionBarAnim]);

  const listContentStyle = useMemo(
    () => ({ paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 }),
    [insets.bottom]
  );

  // A section scroll waits for this: before the first layout nothing is
  // measured, and `scrollToLocation` would quietly do nothing.
  const [listLaidOut, setListLaidOut] = useState(false);
  const handleListLayout = useCallback(() => setListLaidOut(true), []);

  // Parks itself while a section scroll is in flight. Arming one changes the
  // route params, which re-runs the focus effect below — and that effect opens
  // by returning to the top, which would undo the scroll it just asked for.
  // Reads the ref rather than state so this keeps its identity either way.
  const scrollToTop = useCallback((animated: boolean) => {
    if (scrollRequestRef.current !== null) return;
    scrollViewRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated });
  }, []);

  // Reset view and refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      scrollToTop(false);
      resetTabBar();
      // Back to today with no day picked.
      setSelectedDate(null);
      setRainMoves({});
      setSelectedTaskIds(new Set());
      if (route.params?.resetFilters) {
        setFilters(emptyCareTaskFilters());
        setGroupBy(DEFAULT_GROUP_BY);
        setSortBy('due');
      } else if (route.params?.filterOverdue) {
        setFilters({ ...emptyCareTaskFilters(), dueStatuses: new Set(['overdue']) });
      }
      // Armed here, fired by the scroll effect once the section is in the model.
      // Consumed like the other one-shots so returning to the tab later — from
      // the tab bar, or back out of a task — does not scroll the plan again.
      if (route.params?.scrollTo) {
        const target = route.params.scrollTo;
        // Arrive with Catch up open: the farmer came here for all of it.
        if (target === OVERDUE_SECTION_KEY) {
          setOpenSections((prev) =>
            prev.has(OVERDUE_SECTION_KEY) ? prev : new Set(prev).add(OVERDUE_SECTION_KEY)
          );
        }
        scrollRequestRef.current = {
          target,
          since: Date.now(),
          attempts: 0,
        };
        setScrollArm((count) => count + 1);
        navigation.setParams({ scrollTo: undefined });
        logger.debug('Care plan asked to open at a section', {
          tags: ['calendar', 'scroll'],
          metadata: { target },
        });
      }
      if (route.params?.openCreateTask) {
        setCreateTaskInitialDate(undefined);
        setCreateTaskPrefillPlantId(route.params.prefillPlantId);
        setCreateTaskPrefillType(route.params.prefillTaskType);
        setShowModal(true);
        // Consume the one-shot params so returning to this tab doesn't re-open the modal.
        navigation.setParams({
          openCreateTask: undefined,
          prefillPlantId: undefined,
          prefillTaskType: undefined,
        });
      }
      void loadData(); // debounced — skips if loaded recently
      return () => setSelectedTaskIds(new Set());
    }, [loadData, resetTabBar, route, navigation, scrollToTop])
  );

  const openCompletionSheet = useCallback((task: TaskTemplate) => {
    setSelectedTask(task);
    setTaskNotes('');
    setProductUsed('');
    setCompletionReason('');
    setInputQuantity('');
    setInputUnit('');
    setTreatedArea('');
    setAreaUnit('');
    setLabourMinutes('');
    setShowNotesModal(true);
  }, []);

  const formatDueDate = useCallback(
    (task: TaskTemplate): string =>
      formatFarmDate(new Date(task.next_due_at), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

  // What the task is *about*, for every surface that names its subject: the
  // plant, or for bed-level tasks (which have no plant) the bed. Without the bed
  // fallback these read a bare "General" while the card right behind them says
  // "Bed 3" — so the sheets, the detail view and the dialogs all share this.
  const taskSubjectLabel = useCallback(
    (task: TaskTemplate): string => {
      const bedLabel = task.bed_id != null ? bedMap.get(task.bed_id) : undefined;
      return task.plant_id ? getPlantDetails(task.plant_id).name : (bedLabel ?? 'General');
    },
    [bedMap, getPlantDetails]
  );

  const handleBlockedComplete = useCallback((task: TaskTemplate) => {
    setNotDueDialog({ kind: 'blocked', tasks: [task] });
  }, []);

  // ─── One-tap completion ────────────────────────────────────────────────────
  // A tick shows as done at once and is saved when its Undo window closes (or
  // the farmer leaves the tab), so Undo never has to reverse a write.
  const handleCompletionsSaved = useCallback(
    async ({ succeeded, failed }: CompletionSaveResult): Promise<void> => {
      await loadData({ force: true });
      if (failed > 0 && isMountedRef.current) {
        Alert.alert(
          failed === 1 && succeeded === 0 ? 'Already Completed' : 'Partial Completion',
          failed === 1 && succeeded === 0
            ? 'This task was already marked as done for today.'
            : `${failed} task(s) were not saved. You can retry them individually.`
        );
      }
    },
    [loadData, isMountedRef]
  );

  const handleCompletionError = useCallback(
    (_tasks: TaskTemplate[], error: unknown) => {
      if (isMountedRef.current) Alert.alert('Not saved', getErrorMessage(error));
      void loadData({ force: true });
    },
    [loadData, isMountedRef]
  );

  const completions = usePendingCompletions({
    onSaved: handleCompletionsSaved,
    onError: handleCompletionError,
  });
  const { complete: completeNow, flush: flushCompletions } = completions;

  // Ticked tasks leave the open lists straight away, saved or not.
  const completedIds = useMemo(
    () => new Set([...completions.pending, ...completions.saving].map((task) => task.id)),
    [completions.pending, completions.saving]
  );

  // Leaving the tab ends the Undo window: save what is waiting.
  useFocusEffect(
    useCallback(
      () => () => {
        void flushCompletions();
      },
      [flushCompletions]
    )
  );

  const handleTaskComplete = useCallback(
    (task: TaskTemplate) => {
      if (isEarlyCompletionBlocked(task)) {
        handleBlockedComplete(task);
        return;
      }

      // For every other type, completing early is allowed — the farmer may
      // genuinely have done the work — but it reschedules the whole cycle from
      // today and needs a field reason, so it goes through the full form.
      if (isFutureTask(task)) {
        setNotDueDialog({ kind: 'confirmEarly', tasks: [task] });
        return;
      }

      tapFeedback();
      completeNow([task]);

      // Completing a harvest records the schedule but no yield. Save it now and
      // hand over to the journal harvest form — the one place yield is stored.
      if ((task.task_type === 'harvest' || task.task_type === 'harvest_leaves') && task.plant_id) {
        const plantId = task.plant_id;
        void flushCompletions();
        navigation.navigate('Journal', {
          screen: 'JournalForm',
          params: {
            initialEntryType: JournalEntryType.Harvest,
            initialPlantId: plantId,
          },
        });
      }
    },
    [handleBlockedComplete, completeNow, flushCompletions, navigation]
  );

  const confirmTaskComplete = async (): Promise<void> => {
    if (!selectedTask || isCompletingTask) return;
    const completingEarly = isFutureTask(selectedTask);
    if (completingEarly && !completionReason.trim()) {
      Alert.alert(
        'Field reason required',
        'Describe why this work was needed before the planned date.'
      );
      return;
    }

    setIsCompletingTask(true);
    try {
      const didMark = await markTaskDone(
        selectedTask,
        taskNotes || undefined,
        productUsed || undefined,
        {
          allowEarlyCompletion: completingEarly,
          completionReason: completionReason || undefined,
          farmDetails: {
            inputQuantity: optionalNumber(inputQuantity),
            inputUnit: inputUnit || undefined,
            treatedArea: optionalNumber(treatedArea),
            areaUnit: areaUnit || undefined,
            labourMinutes: optionalNumber(labourMinutes),
          },
        }
      );
      if (!didMark) {
        Alert.alert('Already Completed', 'This task is already marked as done for today.');
        setShowNotesModal(false);
        setSelectedTask(null);
        setTaskNotes('');
        setProductUsed('');
        loadData({ force: true });
        return;
      }
      setShowNotesModal(false);
      setSelectedTask(null);
      setTaskNotes('');
      setProductUsed('');
      loadData({ force: true });
      // Completing a harvest task records the schedule but no yield, so on its
      // own it loses what was actually picked. Hand straight over to the journal
      // harvest form — the same one the "Log harvest" card opens — so there is
      // one place yield is stored rather than two. Deferred a frame: this sheet
      // is an RN Modal, and navigating out from under it is unreliable on
      // Android until it has unmounted.
      if (
        (selectedTask.task_type === 'harvest' || selectedTask.task_type === 'harvest_leaves') &&
        selectedTask.plant_id
      ) {
        const plantId = selectedTask.plant_id;
        requestAnimationFrame(() => {
          navigation.navigate('Journal', {
            screen: 'JournalForm',
            params: {
              initialEntryType: JournalEntryType.Harvest,
              initialPlantId: plantId,
            },
          });
        });
      }
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsCompletingTask(false);
    }
  };

  const toggleTaskSelection = useCallback((taskId: string) => {
    tapFeedback();
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const completeSelected = useCallback(
    (selected: TaskTemplate[]) => {
      setSelectedTaskIds(new Set());
      completeNow(selected);
    },
    [completeNow]
  );

  const handleCompleteSelected = useCallback(() => {
    const raw = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (raw.length === 0) return;

    // Backstop against stale selection state — the card and the section
    // checkbox both refuse to select these in the first place.
    const selected = raw.filter((t) => !isEarlyCompletionBlocked(t));
    if (selected.length === 0) {
      setNotDueDialog({ kind: 'blocked', tasks: raw, selectedTotal: raw.length });
      return;
    }

    // Same early-completion caveat as the single-task path, asked once for the
    // whole batch rather than per card.
    const future = selected.filter((t) => isFutureTask(t));
    if (future.length > 0) {
      const dueNow = selected.filter((task) => !isFutureTask(task));
      // `tasks` is the not-yet-due subset so Skip touches only those, while
      // Mark done still applies to the whole completable selection.
      setNotDueDialog({
        kind: 'confirmEarly',
        tasks: future,
        selectedTotal: selected.length,
        completeTargets: dueNow,
      });
      return;
    }
    completeSelected(selected);
  }, [tasks, selectedTaskIds, completeSelected]);

  // Single entry point to the skip sheet — the card swipe, the bulk bar, the
  // detail sheet and the "Not due yet" dialog all land here, so a batch gets the
  // same day options and reason as a single skip rather than a hardcoded +1 day.
  // A lone task takes the single path so the sheet can still show its preview.
  // It is also the gate: a not-yet-due task has nothing to defer, so it never
  // reaches the sheet. A mixed batch skips what it can and reports the rest.
  const openSkipForTasks = useCallback(
    (targets: TaskTemplate[], mode: 'skip' | 'reschedule' = 'skip') => {
      if (targets.length === 0) return;
      const eligible = mode === 'reschedule' ? targets : targets.filter((t) => !isSkipBlocked(t));
      if (eligible.length === 0) {
        setNotDueDialog({
          kind: 'skipBlocked',
          tasks: targets,
          ...(targets.length > 1 ? { selectedTotal: targets.length } : {}),
        });
        return;
      }
      const single = eligible.length === 1 ? (eligible[0] ?? null) : null;
      setSkipTask(single);
      setSkipBulkTasks(single ? null : eligible);
      setSkipExcludedCount(targets.length - eligible.length);
      setSkipReason('');
      setSkipDays(1);
      setScheduleMode(mode);
      setShowSkipModal(true);
    },
    []
  );

  const openRescheduleForTasks = useCallback(
    (targets: TaskTemplate[]) => openSkipForTasks(targets, 'reschedule'),
    [openSkipForTasks]
  );

  const handleBulkSkip = useCallback(() => {
    openSkipForTasks(tasks.filter((t) => selectedTaskIds.has(t.id)));
  }, [tasks, selectedTaskIds, openSkipForTasks]);

  // Both dialogs hand off to another RN Modal (the skip sheet or the completion
  // sheet). Stacking one straight onto another is unreliable on Android, so let
  // this one unmount first and open the next on the following frame.
  const closeNotDueThen = useCallback((next: () => void) => {
    setNotDueDialog(null);
    requestAnimationFrame(next);
  }, []);

  const notDueDialogProps = useMemo(() => {
    if (!notDueDialog) return null;
    const { kind, tasks: subjects, selectedTotal, completeTargets } = notDueDialog;
    const bulk = selectedTotal != null;
    const first = subjects[0];
    if (!first) return null;

    const detail =
      bulk && kind === 'confirmEarly'
        ? `${subjects.length} of ${selectedTotal} selected task${
            selectedTotal === 1 ? '' : 's'
          } aren't due yet`
        : bulk
          ? `${selectedTotal} task${selectedTotal === 1 ? '' : 's'} selected`
          : `${TASK_LABELS[first.task_type]} · ${taskSubjectLabel(first)} · due ${formatDueDate(
              first
            )}`;

    // `blocked` reuses EARLY_COMPLETION_BLOCK_REASON, which only covers water /
    // fertilise / spray. `skipBlocked` applies to every type, so it carries its
    // own wording rather than borrowing a table that would come back undefined.
    const message =
      kind === 'blocked'
        ? bulk
          ? 'These safety-sensitive tasks need an individual field reason before early work is logged.'
          : `${
              EARLY_COMPLETION_BLOCK_REASON[first.task_type] ?? ''
            } Reschedule, or log the actual work with a field reason.`
        : kind === 'skipBlocked'
          ? bulk
            ? 'These tasks are not due yet. Reschedule them instead of recording a skip.'
            : 'This task is not due yet. Reschedule it instead of recording a skip.'
          : bulk
            ? 'Future tasks require individual review. Tasks already due can still be completed together.'
            : 'Logging it today will rebase the next cycle from today. Add the field reason first.';

    const rescheduleAction: AlertDialogAction = {
      label: 'Reschedule',
      icon: 'calendar-outline',
      onPress: () => closeNotDueThen(() => openRescheduleForTasks(subjects)),
    };
    const cancelAction: AlertDialogAction = {
      label: 'Cancel',
      onPress: () => setNotDueDialog(null),
    };

    let actions: AlertDialogAction[];
    if (bulk && kind === 'confirmEarly') {
      actions = [
        ...(completeTargets && completeTargets.length > 0
          ? [
              {
                label: `Complete ${completeTargets.length} due`,
                icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
                variant: 'primary' as const,
                onPress: () => closeNotDueThen(() => completeSelected(completeTargets)),
              },
            ]
          : [rescheduleAction]),
        cancelAction,
      ];
    } else if (kind === 'confirmEarly' || kind === 'blocked') {
      actions = [
        {
          label: 'Log actual work',
          icon: 'checkmark-circle-outline',
          variant: 'primary',
          onPress: () => closeNotDueThen(() => openCompletionSheet(first)),
        },
        rescheduleAction,
        cancelAction,
      ];
    } else {
      actions = [rescheduleAction, cancelAction];
    }

    return {
      title: 'Not due yet',
      detail,
      message,
      icon: (kind === 'confirmEarly'
        ? 'time-outline'
        : 'ban-outline') as keyof typeof Ionicons.glyphMap,
      actions,
    };
  }, [
    notDueDialog,
    taskSubjectLabel,
    formatDueDate,
    closeNotDueThen,
    openCompletionSheet,
    openRescheduleForTasks,
    completeSelected,
  ]);

  const getSectionState = useCallback(
    (sectionTasks: TaskTemplate[]): 'none' | 'partial' | 'all' => {
      if (sectionTasks.length === 0) return 'none';
      const selectedCount = sectionTasks.filter((t) => selectedTaskIds.has(t.id)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === sectionTasks.length) return 'all';
      return 'partial';
    },
    [selectedTaskIds]
  );

  const toggleSectionSelection = useCallback((sectionTasks: TaskTemplate[]) => {
    const ids = sectionTasks.map((t) => t.id);
    tapFeedback();
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const renderSectionCheckbox = useCallback(
    (sectionTasks: TaskTemplate[]) => {
      // Blocked tasks can't be completed, so they must not count towards the
      // header's select-all state or be swept into it. Filtering here covers
      // every section that supplies `checkboxTasks`.
      const selectable = sectionTasks.filter((t) => !isEarlyCompletionBlocked(t));
      if (selectable.length === 0) return null;
      const state = getSectionState(selectable);
      return (
        <TouchableOpacity
          style={styles.sectionSelectButton}
          onPress={() => toggleSectionSelection(selectable)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: state === 'all' ? true : state === 'none' ? false : 'mixed',
          }}
          accessibilityLabel={`Select ${selectable.length} tasks in this section`}
        >
          <Ionicons
            name={
              // Boxes, like the cards' ticks while selecting.
              state === 'all' ? 'checkbox' : state === 'partial' ? 'stop' : 'square-outline'
            }
            size={22}
            color={state === 'none' ? theme.textTertiary : theme.primary}
          />
        </TouchableOpacity>
      );
    },
    [getSectionState, toggleSectionSelection, theme, styles.sectionSelectButton]
  );

  const handleOpenSkipModal = useCallback(
    (task: TaskTemplate) => {
      openSkipForTasks([task]);
    },
    [openSkipForTasks]
  );

  const closeSkipModal = useCallback(() => {
    setShowSkipModal(false);
    setSkipReason('');
    setSkipDays(1);
    setSkipTask(null);
    setSkipBulkTasks(null);
    setSkipExcludedCount(0);
    setScheduleMode('skip');
  }, []);

  const handleConfirmSkip = useCallback(async (): Promise<void> => {
    const targets = skipBulkTasks ?? (skipTask ? [skipTask] : []);
    if (targets.length === 0 || skippingTask) return;
    setSkippingTask(true);
    try {
      // Persists the reason on each template so the "why" outlives this sheet
      // and can be shown on the task detail view.
      if (scheduleMode === 'reschedule') {
        await Promise.all(
          targets.map((task) =>
            updateTaskTemplate(task.id, {
              next_due_at: computeSkipDate(task, skipDays).toISOString(),
            })
          )
        );
      } else {
        await Promise.all(targets.map((task) => skipTaskTemplate(task, skipDays, skipReason)));
      }
      // Drop just the skipped ids rather than the whole selection: a skip can
      // now target a subset (the not-yet-due ones), and the rest stay selected.
      setSelectedTaskIds((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        targets.forEach((task) => next.delete(task.id));
        return next.size === prev.size ? prev : next;
      });
      closeSkipModal();
      loadData({ force: true });
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSkippingTask(false);
    }
  }, [
    skipBulkTasks,
    skipTask,
    skippingTask,
    skipDays,
    skipReason,
    scheduleMode,
    closeSkipModal,
    loadData,
  ]);

  const handleDetailComplete = useCallback(() => {
    if (!detailTask) return;
    setShowTaskDetail(false);
    setDetailTask(null);
    handleTaskComplete(detailTask);
  }, [detailTask, handleTaskComplete]);

  const handleDetailSkip = useCallback(() => {
    if (!detailTask) return;
    setShowTaskDetail(false);
    setDetailTask(null);
    if (isFutureTask(detailTask)) openRescheduleForTasks([detailTask]);
    else handleOpenSkipModal(detailTask);
  }, [detailTask, handleOpenSkipModal, openRescheduleForTasks]);

  const handleShowDetail = useCallback((task: TaskTemplate) => {
    setDetailTask(task);
    setShowTaskDetail(true);
  }, []);

  const closeTaskDetail = useCallback(() => {
    setShowTaskDetail(false);
    setDetailTask(null);
  }, []);

  // The full completion form — notes, product, quantity, labour — for work the
  // farmer wants on record in more detail than a tick.
  const handleDetailDoneWithNotes = useCallback(() => {
    if (!detailTask) return;
    const task = detailTask;
    closeTaskDetail();
    if (isFutureTask(task)) {
      setNotDueDialog({
        kind: isEarlyCompletionBlocked(task) ? 'blocked' : 'confirmEarly',
        tasks: [task],
      });
      return;
    }
    openCompletionSheet(task);
  }, [detailTask, closeTaskDetail, openCompletionSheet]);

  const handleSaveAmount = useCallback(
    async (amount: string | null): Promise<void> => {
      if (!detailTask) return;
      try {
        const updated = await updateTaskTemplate(detailTask.id, { amount });
        setDetailTask((current) => (current?.id === updated.id ? { ...current, amount } : current));
        await loadData({ force: true });
      } catch (error: unknown) {
        Alert.alert('Amount not saved', getErrorMessage(error));
        throw error;
      }
    },
    [detailTask, loadData]
  );

  // Estimated harvest date for harvest tasks, from enriched (A2) care data.
  //
  // Only ever states a date it can support. The farmer's own expected date wins;
  // failing that an estimate is shown solely where the crop's own maturity data
  // exists. It used to fall through to `calculateExpectedHarvestDate` for
  // everything, which resolves care profiles with a type-level fallback — so an
  // unrecognised fruit tree was given a confident "Estimated" date derived from
  // the whole category's `yearsToFirstHarvest: 4`.
  //
  // Note the estimate is a plain day count from planting: it never consults the
  // farm's district, zone or sowing window, so the same crop predicts the same
  // date across Tamil Nadu. See the note in `harvestStats.ts`.
  const computeHarvestHint = useCallback(
    (task: TaskTemplate): string | null => {
      if (task.task_type !== 'harvest' && task.task_type !== 'harvest_leaves') return null;
      if (!task.plant_id) return null;
      const plant = plantMap.get(task.plant_id);
      if (!plant) return null;
      if (plant.expected_harvest_date) {
        const farmerDate = new Date(plant.expected_harvest_date);
        if (!Number.isNaN(farmerDate.getTime())) {
          return `Expected: ${formatFarmDate(farmerDate, {
            month: 'short',
            day: 'numeric',
          })}`;
        }
      }
      if (!plant.planting_date) return null;
      const day = (date: Date): string => formatFarmDate(date, { month: 'short', day: 'numeric' });

      // Trees measure years to *first* harvest, and their catalog `daysToHarvest`
      // is a recurring picking interval rather than a sow-to-harvest duration
      // (see `isTreeLikePlant`), so the range below would be meaningless for them.
      if (isTreeLikePlant(plant)) {
        if (!hasVarietyCareProfile(plant.plant_variety, plant.plant_type)) return null;
        const iso = calculateExpectedHarvestDate(
          plant.plant_variety,
          plant.planting_date,
          plant.plant_type
        );
        if (!iso) return null;
        const treeDate = new Date(iso);
        return Number.isNaN(treeDate.getTime()) ? null : `Estimated: ${day(treeDate)}`;
      }

      // `known: false` is the generic 55–75 day band standing in for a crop we
      // have no maturity data on — a window, not a fact, so it stays unsaid.
      const range = getDaysToHarvestRange(plant);
      if (!range.known) return null;
      const plantedKey = farmDateKey(plant.planting_date);
      if (!plantedKey) return null;
      const fromKey = addDaysToDateKey(plantedKey, range.min);
      const toKey = addDaysToDateKey(plantedKey, range.max);
      const from = fromKey ? calendarDateFromKey(fromKey) : null;
      const to = toKey ? calendarDateFromKey(toKey) : null;
      if (!from || !to) return null;
      return range.min === range.max
        ? `Estimated: ${day(from)}`
        : `Estimated: ${day(from)} – ${day(to)}`;
    },
    [plantMap]
  );

  const undoMessage = useMemo(() => {
    const [first, ...rest] = completions.pending;
    if (!first) return '';
    if (rest.length > 0) return `${completions.pending.length} tasks done`;
    return `${TASK_LABELS[first.task_type]} ${taskSubjectLabel(first)} done`;
  }, [completions.pending, taskSubjectLabel]);

  const plotNameById = useMemo(
    () => new Map(plotResolution.groups.map((group) => [group.id, group.name])),
    [plotResolution]
  );
  const taskPlotName = useCallback(
    (task: TaskTemplate): string | null =>
      plotNameById.get(plotResolution.resolveTaskPlotId(task)) ?? null,
    [plotNameById, plotResolution]
  );

  // ─── Card interaction ──────────────────────────────────────────────────────
  // Tap opens details, the tick finishes, a long press starts selecting. While
  // selecting, a tap or a tick adds the card to the selection instead.
  const selectionMode = selectedTaskIds.size > 0;

  const handleCardPress = useCallback(
    (task: TaskTemplate) => {
      if (!selectionMode) {
        handleShowDetail(task);
        return;
      }
      if (isEarlyCompletionBlocked(task)) handleBlockedComplete(task);
      else toggleTaskSelection(task.id);
    },
    [selectionMode, handleShowDetail, handleBlockedComplete, toggleTaskSelection]
  );

  const handleCardLongPress = useCallback((task: TaskTemplate) => {
    // Blocked tasks can't be finished, so they never join a selection.
    if (isEarlyCompletionBlocked(task)) return;
    tapFeedback();
    setSelectedTaskIds((prev) => (prev.has(task.id) ? prev : new Set(prev).add(task.id)));
  }, []);

  const handleCardTick = useCallback(
    (task: TaskTemplate) => {
      if (selectionMode) handleCardPress(task);
      else handleTaskComplete(task);
    },
    [selectionMode, handleCardPress, handleTaskComplete]
  );

  // A Done today tick takes the task back only while its save is still waiting.
  const { undoOne: undoOneCompletion } = completions;
  const handleDoneTick = useCallback(
    (task: TaskTemplate) => {
      tapFeedback();
      undoOneCompletion(task.id);
    },
    [undoOneCompletion]
  );

  const renderTaskCard = useCallback(
    (
      task: TaskTemplate,
      showPlot: boolean,
      done: CarePlanCardDoneState | null = null,
      showBestTime = true
    ): React.JSX.Element | null => {
      if (!task.next_due_at) return null;
      const overdueDays = calendarDaysOverdue(task);
      const plotName = showPlot ? taskPlotName(task) : null;
      const bedLabel =
        task.plant_id != null && task.bed_id != null ? (bedMap.get(task.bed_id) ?? null) : null;
      const advisory = getTaskWeatherAdvisory(
        task.task_type,
        getForecastForTask(task),
        new Date(task.next_due_at)
      );
      return (
        <CarePlanTaskCard
          task={task}
          subject={taskSubjectLabel(task)}
          context={`${plotName ? ` · ${plotName}` : ''}${bedLabel ? ` · ${bedLabel}` : ''}`}
          dueText={
            overdueDays !== null
              ? `${overdueDays}d late`
              : formatFarmDate(new Date(task.next_due_at), { month: 'short', day: 'numeric' })
          }
          overdue={overdueDays !== null}
          priority={getTaskPriority(task)}
          advisoryText={advisory?.label ?? null}
          advisoryIcon={advisory?.iconKey ?? null}
          harvestHint={computeHarvestHint(task)}
          selectionMode={selectionMode}
          selected={selectedTaskIds.has(task.id)}
          blocked={done === null && isEarlyCompletionBlocked(task)}
          done={done}
          showBestTime={showBestTime}
          onPress={handleCardPress}
          onLongPress={handleCardLongPress}
          onTick={done === null ? handleCardTick : handleDoneTick}
        />
      );
    },
    [
      handleDoneTick,
      taskPlotName,
      bedMap,
      getForecastForTask,
      taskSubjectLabel,
      getTaskPriority,
      computeHarvestHint,
      selectionMode,
      selectedTaskIds,
      handleCardPress,
      handleCardLongPress,
      handleCardTick,
    ]
  );

  // ─── Section model ─────────────────────────────────────────────────────────
  // The screen filters, sorts and windows; `buildCarePlanSections` only
  // arranges: a picked day → Catch up → today band by band (harvest round in
  // the morning band) → later days (folded) → done today. Ticked tasks leave
  // the open lists at once.
  const isOpen = useCallback((task: TaskTemplate) => !completedIds.has(task.id), [completedIds]);
  const plotOrder = useMemo(
    () => plotResolution.groups.map((group) => group.name),
    [plotResolution]
  );

  // A harvest task the harvest round already shows lives only there: listing
  // it as a card too put the same crop on screen twice. Search still finds it.
  const roundTaskIds = useMemo(
    () =>
      new Set(
        [...allHarvestsReadyNow, ...allHarvestsSoon]
          .map((item) => item.taskId)
          .filter((id): id is string => id !== undefined)
      ),
    [allHarvestsReadyNow, allHarvestsSoon]
  );
  // A check whose task was just logged leaves the round at once, as a ticked
  // card leaves its band — it waits in Done today, not in the round.
  const harvestsReadyNow = useMemo(
    () => allHarvestsReadyNow.filter((item) => !item.taskId || !completedIds.has(item.taskId)),
    [allHarvestsReadyNow, completedIds]
  );
  const harvestsSoon = useMemo(
    () => allHarvestsSoon.filter((item) => !item.taskId || !completedIds.has(item.taskId)),
    [allHarvestsSoon, completedIds]
  );
  const isListed = useCallback(
    (task: TaskTemplate) => isOpen(task) && !roundTaskIds.has(task.id),
    [isOpen, roundTaskIds]
  );

  const openOverdue = useMemo(
    () => sortTasks(overdueTasks.filter(isListed)),
    [overdueTasks, isListed, sortTasks]
  );
  const openToday = useMemo(
    () => sortTasks(todayTasks.filter(isListed)),
    [todayTasks, isListed, sortTasks]
  );

  const doneItems = useMemo((): CarePlanDoneItem[] => {
    const items: CarePlanDoneItem[] = [];
    const seen = new Set<string>();
    for (const task of [...completions.pending, ...completions.saving]) {
      if (seen.has(task.id)) continue;
      seen.add(task.id);
      items.push({
        taskId: task.id,
        taskType: task.task_type,
        plantId: task.plant_id,
        task,
        pending: completions.pending.includes(task),
      });
    }
    const logs = [...todayLogs].sort((a, b) => b.done_at.localeCompare(a.done_at));
    for (const log of logs) {
      if (seen.has(log.template_id)) continue;
      seen.add(log.template_id);
      items.push({
        taskId: log.template_id,
        taskType: log.task_type,
        plantId: log.plant_id,
        task: templatesById.get(log.template_id) ?? null,
        pending: false,
      });
    }
    return items;
  }, [completions.pending, completions.saving, todayLogs, templatesById]);

  const todaySummary = useMemo(() => {
    const dueNow = [...openOverdue, ...openToday];
    const plots = new Set(dueNow.map((task) => taskPlotName(task) ?? ''));
    return summarizeToday(
      dueNow,
      openOverdue.length,
      plots.size,
      doneItems.length,
      harvestsReadyNow.length
    );
  }, [openOverdue, openToday, taskPlotName, doneItems.length, harvestsReadyNow.length]);

  // Catch up leads with what matters most: priority first, then the oldest.
  // Stable, so equal tasks keep the farmer's chosen sort.
  const catchUp = useMemo(() => {
    const daysLate = (task: TaskTemplate): number => calendarDaysOverdue(task) ?? 0;
    const tasksByUrgency = [...openOverdue].sort(
      (a, b) =>
        PRIORITY_RANK[getTaskPriority(a)] - PRIORITY_RANK[getTaskPriority(b)] ||
        daysLate(b) - daysLate(a)
    );
    return {
      tasks: tasksByUrgency,
      oldestDays: tasksByUrgency.reduce((max, task) => Math.max(max, daysLate(task)), 0),
      criticalCount: tasksByUrgency.filter((task) => getTaskPriority(task) === 'critical').length,
    };
  }, [openOverdue, getTaskPriority]);

  // ─── Rain moves ────────────────────────────────────────────────────────────
  const rainBannerByPlot = useMemo(() => {
    const banners = new Map<string, PlotRainBanner>();
    const at = new Date();
    for (const [plotName, forecast] of weatherByPlotName) {
      const key = locationKey(plotName);
      const plotTasks = filteredTasks.filter(
        (task) => isOpen(task) && locationKey(taskPlotName(task) ?? '') === key
      );
      const movedIds = Object.keys(rainMoves[key] ?? {});
      const banner = buildPlotRainBanner(forecast, plotTasks, movedIds, at);
      if (banner) banners.set(key, banner);
    }
    return banners;
  }, [weatherByPlotName, filteredTasks, isOpen, taskPlotName, rainMoves]);

  /** Plots carrying a rain banner, by display name, in the farm's plot order. */
  const rainPlots = useMemo(
    () => [...weatherByPlotName.keys()].filter((name) => rainBannerByPlot.has(locationKey(name))),
    [weatherByPlotName, rainBannerByPlot]
  );

  // Only the band changes the model; the minute ticks just redraw the NOW chip.
  const nowBand = currentTimeBand(now);
  const nowLabel = farmClockLabel(now);
  const timeLayout = !isSearching && effectiveGroupBy === 'time';

  const listSections = useMemo((): CalendarListSection[] => {
    const todayKey = calendarDateKey(farmToday());
    const tomorrowKey = todayKey ? addDaysToDateKey(todayKey, 1) : null;
    const selectedKey = selectedDate ? calendarDateKey(selectedDate) : null;
    const plotOf = (task: TaskTemplate): string => taskPlotName(task) ?? 'Unassigned';

    let todayGroups: CarePlanTaskGroup[];
    if (effectiveGroupBy === 'time') {
      // Today in the order the day runs. The morning band stays even when
      // empty if it carries rain banners; the builder keeps it for the
      // harvest round too.
      const byBand = new Map<TimeBand, TaskTemplate[]>(TIME_BAND_ORDER.map((band) => [band, []]));
      for (const task of openToday) byBand.get(taskTimeBand(task))?.push(task);
      todayGroups = TIME_BAND_ORDER.map((band) => ({
        key: band,
        title: TIME_BANDS[band].title,
        subtitle: TIME_BANDS[band].subtitle,
        tasks: byBand.get(band) ?? [],
        isNow: band === nowBand,
        rainPlots: band === HARVEST_HOST_BAND && rainPlots.length > 0 ? rainPlots : undefined,
        keepWhenEmpty: band === HARVEST_HOST_BAND && rainPlots.length > 0,
      }));
    } else if (effectiveGroupBy === 'location') {
      // A plot with a rain banner and nothing left today still shows, so its
      // Undo stays in reach after every watering there was moved.
      const groups = groupTasksBy(openToday, plotOf, plotOrder);
      for (const plot of rainPlots) {
        if (!groups.some((group) => group.key === plot)) groups.push({ key: plot, tasks: [] });
      }
      todayGroups = groups.map(({ key, tasks: plotTasks }) => ({
        key,
        title: `Today · ${key}`,
        plot: key,
        rainPlots: rainPlots.includes(key) ? [key] : undefined,
        keepWhenEmpty: rainPlots.includes(key),
        tasks: plotTasks,
      }));
    } else {
      todayGroups = [
        {
          key: 'all',
          title: 'Today',
          tasks: openToday,
          rainPlots: rainPlots.length > 0 ? rainPlots : undefined,
          keepWhenEmpty: rainPlots.length > 0,
        },
      ];
    }

    // The rest of the window: neither late, nor today, nor the picked day.
    const overdueIds = new Set(overdueTasks.map((task) => task.id));
    const rest = sortTasks(
      tasksForDisplay.filter((task) => {
        if (!isListed(task) || overdueIds.has(task.id)) return false;
        const dueKey = farmDateKey(task.next_due_at);
        return dueKey !== todayKey && dueKey !== selectedKey;
      })
    );

    let restGroups: CarePlanTaskGroup[];
    if (effectiveGroupBy === 'type') {
      restGroups = groupTasksBy(rest, (task) => task.task_type, TASK_TYPE_ORDER).map(
        ({ key, tasks: typeTasks }) => ({
          key: `type-${key}`,
          title: TASK_LABELS[key as TaskType] ?? key,
          tasks: typeTasks,
        })
      );
    } else if (effectiveGroupBy === 'plant') {
      restGroups = groupTasksBy(rest, taskSubjectLabel)
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(({ key, tasks: plantTasks }) => ({
          key: `plant-${key}`,
          title: key,
          tasks: plantTasks,
        }));
    } else {
      // By time, by plot or none: one folded band per later day, in date order.
      restGroups = groupTasksBy(rest, (task) => farmDateKey(task.next_due_at) ?? '')
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(({ key, tasks: dayTasks }) => {
          const date = calendarDateFromKey(key);
          return {
            key,
            title:
              key === tomorrowKey
                ? 'Tomorrow'
                : date
                  ? formatFarmDate(date, { weekday: 'short', month: 'short', day: 'numeric' })
                  : key,
            collapsible: true,
            tasks: dayTasks,
          };
        });
    }

    return buildCarePlanSections({
      loadFailed: Boolean(loadError) && tasks.length === 0 && !initialLoading,
      initialLoading,
      isSearching,
      searchResults: isSearching ? sortTasks(filteredTasks.filter(isOpen)) : [],
      filtersActive: isFilterActive,
      selectedDate:
        !isSearching && selectedDate && selectedKey && selectedKey !== todayKey
          ? {
              key: selectedKey,
              title: formatFarmDate(selectedDate, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
              tasks: sortTasks(getTasksForDate(selectedDate).filter(isListed)),
              rawCount: getRawTasksForDate(selectedDate).length,
            }
          : null,
      harvestsReadyNow,
      harvestsSoon: isSearching ? [] : harvestsSoon,
      harvestSoonExpanded,
      harvestHostKey: effectiveGroupBy === 'time' ? HARVEST_HOST_BAND : undefined,
      overdue: isSearching ? [] : catchUp.tasks,
      overdueOldestDays: catchUp.oldestDays,
      overdueCriticalCount: catchUp.criticalCount,
      todayGroups: isSearching ? [] : todayGroups,
      restGroups: isSearching ? [] : restGroups,
      done: isSearching ? [] : doneItems,
      openSections,
    });
  }, [
    selectedDate,
    taskPlotName,
    openToday,
    catchUp,
    effectiveGroupBy,
    nowBand,
    rainPlots,
    plotOrder,
    overdueTasks,
    sortTasks,
    tasksForDisplay,
    isOpen,
    isListed,
    taskSubjectLabel,
    loadError,
    tasks.length,
    initialLoading,
    isSearching,
    filteredTasks,
    isFilterActive,
    getTasksForDate,
    getRawTasksForDate,
    harvestsReadyNow,
    harvestsSoon,
    harvestSoonExpanded,
    doneItems,
    openSections,
  ]);

  const handleRainMove = useCallback(
    async (plot: string, taskIds: string[]): Promise<void> => {
      const targets = tasks.filter((task) => taskIds.includes(task.id));
      if (targets.length === 0 || rainMoveBusy) return;
      setRainMoveBusy(plot);
      try {
        const previous: Record<string, string> = {};
        await Promise.all(
          targets.map((task) => {
            previous[task.id] = task.next_due_at;
            return updateTaskTemplate(task.id, {
              next_due_at: computeSkipDate(task, RAIN_MOVE_DAYS).toISOString(),
            });
          })
        );
        setRainMoves((prev) => ({ ...prev, [locationKey(plot)]: previous }));
        await loadData({ force: true });
      } catch (error: unknown) {
        Alert.alert('Watering not moved', getErrorMessage(error));
        void loadData({ force: true });
      } finally {
        setRainMoveBusy(null);
      }
    },
    [tasks, rainMoveBusy, loadData]
  );

  const handleRainUndo = useCallback(
    async (plot: string): Promise<void> => {
      const previous = rainMoves[locationKey(plot)];
      if (!previous || rainMoveBusy) return;
      setRainMoveBusy(plot);
      try {
        await Promise.all(
          Object.entries(previous).map(([id, dueAt]) =>
            updateTaskTemplate(id, { next_due_at: dueAt })
          )
        );
        setRainMoves((prev) => {
          const next = { ...prev };
          delete next[locationKey(plot)];
          return next;
        });
        await loadData({ force: true });
      } catch (error: unknown) {
        Alert.alert('Watering not moved back', getErrorMessage(error));
        void loadData({ force: true });
      } finally {
        setRainMoveBusy(null);
      }
    },
    [rainMoves, rainMoveBusy, loadData]
  );

  // Month-sheet dots: what is still to do on each day ahead. Late work counts
  // as today's (it is due now), so past days carry no dot.
  const getOpenTasksForDate = useCallback(
    (date: Date): TaskTemplate[] => {
      const key = calendarDateKey(date);
      const todayKey = calendarDateKey(farmToday());
      if (!key || !todayKey || key < todayKey) return [];
      const open = getTasksForDate(date).filter(isOpen);
      return key === todayKey ? [...openOverdue, ...open] : open;
    },
    [getTasksForDate, isOpen, openOverdue]
  );

  const toggleSection = useCallback((key: string) => {
    tapFeedback();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ─── Opening the plan at a section ─────────────────────────────────────────
  // Another screen can ask for one by name (the Today card's overdue count), and
  // the work of getting there is all in the waiting: the sections are built from
  // data that lands after the navigation, and React Native will not scroll to a
  // row it has not measured.
  //
  // `scrollToLocation`, not a measured offset: a section header is rendered
  // inside a virtualized cell, so its own `onLayout` y is relative to that cell
  // and says nothing about where it sits in the list.
  //

  // The current section model, for the scroll timers to resolve an index
  // against when they fire rather than from the render that scheduled them —
  // between the two the sections can be rebuilt and the index move.
  const listSectionsRef = useRef<CalendarListSection[]>([]);
  useEffect(() => {
    listSectionsRef.current = listSections;
  }, [listSections]);

  const scrollToSection = useCallback((sectionIndex: number) => {
    logger.debug('Care plan scrolling to section', {
      tags: ['calendar', 'scroll'],
      metadata: { sectionIndex, attempt: scrollRequestRef.current?.attempts ?? 0 },
    });
    scrollViewRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex: 0, // the section header itself
      viewOffset: 0,
      animated: true,
    });
    // React Native reports a refusal synchronously from that call, so by now a
    // failed attempt has already queued its retry. If nothing is queued the
    // scroll stands, and the request is let go once it has visibly settled —
    // which is also what un-parks `scrollToTop`.
    if (scrollSettleTimerRef.current !== null) clearTimeout(scrollSettleTimerRef.current);
    scrollSettleTimerRef.current = setTimeout(() => {
      scrollSettleTimerRef.current = null;
      if (scrollTimerRef.current === null) scrollRequestRef.current = null;
    }, SCROLL_SETTLE_MS);
  }, []);

  /** One attempt at the pending request's section, if it still has one. */
  const attemptSectionScroll = useCallback(() => {
    const request = scrollRequestRef.current;
    if (request === null) return;
    const sectionIndex = listSectionsRef.current.findIndex(
      (section) => section.key === request.target
    );
    if (sectionIndex >= 0) scrollToSection(sectionIndex);
  }, [scrollToSection]);

  // Re-checked each time the model is rebuilt, until the section turns up or the
  // request expires — the watchdog covers a plan the section never appears in at
  // all, so a rebuild minutes later can't jump the list under the farmer.
  useEffect(() => {
    const request = scrollRequestRef.current;
    // Before the list has laid out there is nothing measured to scroll to yet.
    if (request === null || !listLaidOut) return;
    const sectionIndex = listSections.findIndex((section) => section.key === request.target);

    if (sectionIndex < 0) {
      // The deadline is from when this was armed, not from this rebuild, so a
      // run of rebuilds can't keep the wait alive indefinitely.
      const remaining = SCROLL_TARGET_WAIT_MS - (Date.now() - request.since);
      if (remaining <= 0) {
        logger.debug('Care plan gave up waiting for a section', {
          tags: ['calendar', 'scroll'],
          metadata: { target: request.target },
        });
        scrollRequestRef.current = null;
        return;
      }
      const giveUp = setTimeout(() => {
        if (scrollRequestRef.current !== null) {
          logger.debug('Care plan gave up waiting for a section', {
            tags: ['calendar', 'scroll'],
            metadata: { target: request.target },
          });
        }
        scrollRequestRef.current = null;
      }, remaining);
      return () => clearTimeout(giveUp);
    }

    // Deliberately not cancelled on cleanup, and scheduled at most once: focus
    // hands the list a burst of re-renders (a fresh selected date, a new
    // selection set, then the data landing), each of which rebuilds
    // `listSections` and re-runs this effect. Cancelling on every one of those
    // is how the scroll got swallowed before it ever reached the list.
    if (scrollTimerRef.current !== null) return;
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null;
      attemptSectionScroll();
    }, SCROLL_RETRY_DELAY_MS);
  }, [scrollArm, listSections, listLaidOut, attemptSectionScroll]);

  // Only the unmount case: a pending attempt must not fire into a dead list.
  useEffect(
    () => () => {
      if (scrollTimerRef.current !== null) clearTimeout(scrollTimerRef.current);
      if (scrollSettleTimerRef.current !== null) clearTimeout(scrollSettleTimerRef.current);
    },
    []
  );

  // React Native refuses `scrollToLocation` when the target sits past the cells
  // it has actually measured, and there is no `getItemLayout` to answer from —
  // the rows here are variable height (advisories, harvest hints, empty states),
  // so there cannot be one. The way through is to scroll roughly there, which
  // renders and measures those cells, then ask again from a better position.
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      const request = scrollRequestRef.current;
      if (request === null) return;
      if (request.attempts >= SCROLL_MAX_ATTEMPTS) {
        logger.warn('Care plan could not scroll to the requested section', undefined, {
          tags: ['calendar', 'scroll'],
          metadata: { ...info, attempts: request.attempts },
        });
        scrollRequestRef.current = null;
        return;
      }
      request.attempts += 1;
      logger.debug('Care plan section past the measured window — nudging and retrying', {
        tags: ['calendar', 'scroll'],
        metadata: { ...info, attempt: request.attempts },
      });
      // Approximate on purpose: this only has to bring the target into the
      // rendered window. The retry below is what lands it exactly.
      scrollViewRef.current?.getScrollResponder()?.scrollTo({
        y: Math.max(0, info.averageItemLength * info.index),
        animated: false,
      });
      if (scrollTimerRef.current !== null) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        scrollTimerRef.current = null;
        attemptSectionScroll();
      }, SCROLL_RETRY_DELAY_MS);
    },
    [attemptSectionScroll]
  );

  const renderEmptyRow = useCallback(
    (row: Extract<CalendarRow, { kind: 'empty' }>): React.JSX.Element => {
      switch (row.variant) {
        case 'loadError':
          return (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color={theme.error} />
              <Text style={styles.emptyStateText}>Couldn’t load the care plan</Text>
              <Text style={styles.emptyStateSubtext}>
                Your tasks were not confirmed, so this is not an “all caught up” state.
              </Text>
              <TouchableOpacity style={styles.clearSearchButton} onPress={handleRefresh}>
                <Text style={styles.clearSearchText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          );
        // The two per-day variants use the compact row: they sit inside an
        // otherwise populated list, so a full-height empty card crowds it out.
        case 'selectedDateFiltered':
          return (
            <View style={styles.emptyStateCompact}>
              <Ionicons name="options-outline" size={28} color={theme.border} />
              <View style={styles.emptyStateCompactBody}>
                <Text style={styles.emptyStateCompactText}>No matching tasks</Text>
                <Text style={styles.emptyStateCompactSubtext}>
                  {row.rawCount ?? 0} task{(row.rawCount ?? 0) !== 1 ? 's' : ''} hidden by filters
                </Text>
              </View>
              <TouchableOpacity style={styles.emptyStateCompactAction} onPress={clearFilters}>
                <Text style={styles.emptyStateCompactActionText}>Clear</Text>
              </TouchableOpacity>
            </View>
          );
        case 'searchNone':
          return (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.border} />
              <Text style={styles.emptyStateText}>No tasks found</Text>
              <Text style={styles.emptyStateSubtext}>
                {tasks.length === 0
                  ? 'Create your first task to get started'
                  : `No results for "${searchQuery}"`}
              </Text>
              {tasks.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        case 'filtersNone':
          return (
            <View style={styles.emptyState}>
              <Ionicons name="options-outline" size={48} color={theme.border} />
              <Text style={styles.emptyStateText}>No tasks match your filters</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters or clear them to see all tasks
              </Text>
              <TouchableOpacity style={styles.clearSearchButton} onPress={clearFilters}>
                <Text style={styles.clearSearchText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          );
        case 'noUpcoming':
          return (
            <View style={styles.emptyState}>
              <Ionicons name="checkbox-outline" size={48} color={theme.border} />
              {/* Covers today *and* the rest of the rolling week. */}
              <Text style={styles.emptyStateText}>All caught up</Text>
              <Text style={styles.emptyStateSubtext}>Nothing due today or in the next 7 days</Text>
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={() => {
                  setCreateTaskInitialDate(undefined);
                  setShowModal(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                <Text style={styles.addTaskButtonText}>Create Task</Text>
              </TouchableOpacity>
            </View>
          );
      }
    },
    [styles, theme, clearFilters, tasks.length, searchQuery, handleRefresh]
  );

  const toggleHarvestSoon = useCallback(() => {
    tapFeedback();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHarvestSoonExpanded((prev) => !prev);
  }, []);

  // "+ Log" in the harvest round. A check that stands for a harvest task
  // completes it, exactly as ticking its card did — saved, then on to the
  // journal harvest form for the yield. A farmer's own date has no task, so it
  // goes straight to the form.
  const handleLogHarvest = useCallback(
    (item: HarvestReadyItem) => {
      const task = item.taskId ? templatesById.get(item.taskId) : undefined;
      if (task && isOpen(task)) {
        handleTaskComplete(task);
        return;
      }
      navigation.navigate('Journal', {
        screen: 'JournalForm',
        params: {
          initialEntryType: JournalEntryType.Harvest,
          initialPlantId: item.plant.id,
        },
      });
    },
    [templatesById, isOpen, handleTaskComplete, navigation]
  );

  const toggleHarvestRound = useCallback(() => toggleSection(HARVEST_ROUND_KEY), [toggleSection]);
  const toggleCatchUp = useCallback(() => toggleSection(OVERDUE_SECTION_KEY), [toggleSection]);

  // "Select all N" under Catch up: every overdue task, folded ones included.
  const selectAllOverdue = useCallback(() => {
    tapFeedback();
    const ids = catchUp.tasks.filter((task) => !isEarlyCompletionBlocked(task)).map((t) => t.id);
    setSelectedTaskIds((prev) => new Set([...prev, ...ids]));
  }, [catchUp.tasks]);

  // "+ Add" on a picked day creates the task on that day.
  const handleAddForPickedDay = useCallback(() => {
    setCreateTaskInitialDate(selectedDate ?? undefined);
    setShowModal(true);
  }, [selectedDate]);

  const renderRowContent = useCallback(
    (item: CalendarRow, section: CalendarListSection): React.JSX.Element | null => {
      switch (item.kind) {
        case 'task':
          // A plot band already names its plot; a time band already says when.
          return renderTaskCard(
            item.task,
            !section.header?.plot,
            null,
            !(timeLayout && section.header?.tone === 'band')
          );
        case 'done':
          return renderTaskCard(
            item.item.task ?? doneStandIn(item.item),
            true,
            item.item.pending ? 'pending' : 'saved'
          );
        case 'harvestRound':
        case 'harvest':
        case 'harvestSoonToggle':
          return (
            <HarvestRoundRow
              row={item}
              onToggleRound={toggleHarvestRound}
              onToggleSoon={toggleHarvestSoon}
              onLogHarvest={handleLogHarvest}
            />
          );
        case 'empty':
          return renderEmptyRow(item);
      }
    },
    [
      renderTaskCard,
      timeLayout,
      toggleHarvestRound,
      toggleHarvestSoon,
      handleLogHarvest,
      renderEmptyRow,
    ]
  );

  const renderListItem = useCallback(
    ({
      item,
      section,
    }: {
      item: CalendarRow;
      section: CalendarListSection;
    }): React.JSX.Element | null => {
      const content = renderRowContent(item, section);
      if (!section.header) {
        // No band: the harvest round standing alone, or a whole-list state card.
        const first = !('first' in item) || item.first;
        return (
          <View style={[bandStyles.standaloneRow, first && bandStyles.standaloneRowFirst]}>
            {content}
          </View>
        );
      }
      return (
        <CarePlanBandFrame tone={section.header.tone} part="row">
          {content}
        </CarePlanBandFrame>
      );
    },
    [renderRowContent, bandStyles]
  );

  const renderPlotBanner = useCallback(
    (plot: string, showPlotName: boolean): React.JSX.Element | null => {
      const banner = rainBannerByPlot.get(locationKey(plot));
      if (!banner) return null;
      const busy = rainMoveBusy === plot;
      // A band that is not one plot's own names the plot the rain is over.
      const head = [showPlotName ? `${plot}:` : '', banner.head].filter(Boolean).join(' ');
      return (
        <View key={plot} style={sectionStyles.banner} accessibilityRole="summary">
          <GardenIcon
            name={banner.kind === 'light' ? 'weather.showers' : 'weather.rain'}
            size={20}
            color={theme.infoDark}
          />
          <Text style={sectionStyles.bannerText}>
            {head ? <Text style={sectionStyles.bannerHead}>{`${head} `}</Text> : null}
            {banner.text}
          </Text>
          {banner.kind === 'move' && (
            <TouchableOpacity
              style={sectionStyles.bannerButton}
              onPress={() => void handleRainMove(plot, banner.taskIds)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`${banner.buttonLabel} waterings on ${plot} past the rain`}
            >
              <Text style={sectionStyles.bannerButtonText}>
                {busy ? 'Moving…' : banner.buttonLabel}
              </Text>
            </TouchableOpacity>
          )}
          {banner.kind === 'moved' && (
            <TouchableOpacity
              style={sectionStyles.bannerUndo}
              onPress={() => void handleRainUndo(plot)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Undo moving the watering on ${plot}`}
            >
              <Text style={sectionStyles.bannerUndoText}>Undo</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [rainBannerByPlot, rainMoveBusy, sectionStyles, theme, handleRainMove, handleRainUndo]
  );

  const renderListSectionHeader = useCallback(
    ({ section }: { section: CalendarListSection }): React.JSX.Element | null => {
      const header = section.header;
      if (!header) return null;
      return (
        <CarePlanBandHeader
          header={header}
          selectBox={
            selectionMode && header.selectableTasks
              ? renderSectionCheckbox(header.selectableTasks)
              : null
          }
          nowLabel={nowLabel}
          onToggle={() => toggleSection(section.key)}
          onAdd={handleAddForPickedDay}
          banners={header.rainPlots?.map((plot) => renderPlotBanner(plot, header.plot !== plot))}
        />
      );
    },
    [
      selectionMode,
      renderSectionCheckbox,
      nowLabel,
      toggleSection,
      handleAddForPickedDay,
      renderPlotBanner,
    ]
  );

  const renderListSectionFooter = useCallback(
    ({ section }: { section: CalendarListSection }): React.JSX.Element | null =>
      section.header ? (
        <CarePlanBandFooter
          tone={section.header.tone}
          footer={section.footer}
          selectionMode={selectionMode}
          onToggle={toggleCatchUp}
          onSelectAll={selectAllOverdue}
        />
      ) : null,
    [selectionMode, toggleCatchUp, selectAllOverdue]
  );

  const listKeyExtractor = useCallback((row: CalendarRow): string => row.key, []);

  // ─── Day navigation ────────────────────────────────────────────────────────
  // No day picked means today. Picking today is the same as picking nothing,
  // so today always keeps its band-by-band layout.
  const today = farmToday();
  const isViewingToday = selectedDate === null;

  const handleSelectDate = useCallback(
    (date: Date) => {
      const isToday = calendarDateKey(date) === calendarDateKey(farmToday());
      setSelectedDate(isToday ? null : date);
      scrollToTop(true);
    },
    [scrollToTop]
  );

  // There is no stepping into the past: late work already sits under Catch up.
  const handlePreviousDay = useCallback(() => {
    if (selectedDate) handleSelectDate(addCalendarDays(selectedDate, -1));
  }, [selectedDate, handleSelectDate]);

  const handleNextDay = useCallback(() => {
    handleSelectDate(addCalendarDays(selectedDate ?? farmToday(), 1));
  }, [selectedDate, handleSelectDate]);

  const handleGoToToday = useCallback(() => {
    setTodayView();
    scrollToTop(true);
  }, [setTodayView, scrollToTop]);

  const openMonthSheet = useCallback(() => setShowMonthSheet(true), []);
  const closeMonthSheet = useCallback(() => setShowMonthSheet(false), []);

  const handlePickMonthDate = useCallback(
    (date: Date) => {
      setShowMonthSheet(false);
      handleSelectDate(date);
    },
    [handleSelectDate]
  );

  return (
    <GestureHandlerRootView style={styles.flexOne}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.headerTop, { paddingTop: insets.top + 12 }]}>
            {searchActive ? (
              <View style={styles.searchExpandedRow}>
                <TouchableOpacity
                  style={styles.searchBackBtn}
                  onPress={() => {
                    setSearchActive(false);
                    if (!searchQuery.trim()) setSearchQuery('');
                  }}
                >
                  <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
                </TouchableOpacity>
                <View style={styles.searchExpandedWrapper}>
                  <Ionicons name="search" size={16} color={theme.textSecondary} />
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchExpandedInput}
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(sanitizeAlphaNumericSpaces(text))}
                    placeholderTextColor={theme.inputPlaceholder}
                    autoFocus
                    returnKeyType="search"
                  />
                  {searchQuery.trim() !== '' && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <>
                <View style={bandStyles.headerTitleBlock}>
                  <Text style={bandStyles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                    Care Plan
                  </Text>
                  <CarePlanDateNav
                    selectedDate={selectedDate}
                    today={today}
                    onPrevious={handlePreviousDay}
                    onNext={handleNextDay}
                    onOpenMonth={openMonthSheet}
                  />
                </View>
                <View style={styles.headerActions}>
                  {!isViewingToday && (
                    <TouchableOpacity
                      style={bandStyles.todayPill}
                      onPress={handleGoToToday}
                      accessibilityRole="button"
                      accessibilityLabel="Back to today"
                    >
                      <Text style={bandStyles.todayPillText}>Today</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.searchIconBtn}
                    onPress={() => setSearchActive(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Search care-plan tasks"
                  >
                    <Ionicons name="search" size={20} color={theme.primary} />
                    {searchQuery.trim() !== '' && <View style={styles.searchActiveDot} />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.groupMenuButton,
                      (showGroupMenu || isFilterActive || groupBy !== DEFAULT_GROUP_BY) &&
                        styles.groupMenuButtonActive,
                    ]}
                    onPress={() => setShowGroupMenu(!showGroupMenu)}
                    accessibilityRole="button"
                    accessibilityLabel="Care-plan filters"
                    accessibilityState={{ expanded: showGroupMenu }}
                  >
                    <Ionicons name="funnel" size={20} color={theme.textInverse} />
                    {activeFilterCount > 0 && !showGroupMenu && (
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* No week row: the date line in the header reaches any day, so the
            list starts right under it and keeps that height for task cards. */}
        <View style={styles.listArea}>
          <SectionList
            ref={scrollViewRef}
            style={styles.content}
            sections={listSections}
            keyExtractor={listKeyExtractor}
            renderItem={renderListItem}
            renderSectionHeader={renderListSectionHeader}
            renderSectionFooter={renderListSectionFooter}
            stickySectionHeadersEnabled={false}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            onLayout={handleListLayout}
            contentContainerStyle={listContentStyle}
            onScroll={onTabBarScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
            ListHeaderComponent={
              <>
                {(isStale || (loadError && tasks.length > 0)) && (
                  <View style={styles.staleBanner} accessibilityRole="alert">
                    <Ionicons name="cloud-offline-outline" size={18} color={theme.warning} />
                    <View style={styles.staleBannerBody}>
                      <Text style={styles.staleBannerTitle}>Showing saved care-plan data</Text>
                      <Text style={styles.staleBannerText}>
                        {lastUpdatedAt
                          ? `Last updated ${formatFarmDate(new Date(lastUpdatedAt), {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}`
                          : 'Live data is temporarily unavailable'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.staleBannerRetry}
                      onPress={handleRefresh}
                      accessibilityRole="button"
                      accessibilityLabel="Retry care plan refresh"
                    >
                      <Text style={styles.staleBannerRetryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {initialLoading && tasks.length === 0 && (
                  <View
                    style={bandStyles.skeleton}
                    accessibilityRole="progressbar"
                    accessibilityLabel="Loading the care plan"
                  >
                    <View style={[bandStyles.skeletonBlock, bandStyles.skeletonSummary]} />
                    <View style={[bandStyles.skeletonBlock, bandStyles.skeletonBand]} />
                    <View style={[bandStyles.skeletonBlock, bandStyles.skeletonCard]} />
                    <View
                      style={[
                        bandStyles.skeletonBlock,
                        bandStyles.skeletonCard,
                        bandStyles.skeletonFaded,
                      ]}
                    />
                  </View>
                )}
                {!isSearching && !initialLoading && !(loadError && tasks.length === 0) && (
                  <CarePlanProgressCard summary={todaySummary} />
                )}
              </>
            }
          />
        </View>

        {/* Floating selection pill — sits at the same height as the FAB */}
        {selectionBarMounted && (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.selectionBarWrap,
              {
                bottom: Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT + 16,
                opacity: selectionBarAnim,
                transform: [
                  {
                    translateY: selectionBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.selectionBar}>
              <TouchableOpacity
                style={styles.selectionBarCancel}
                onPress={() => setSelectedTaskIds(new Set())}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Clear selection"
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectionBarSecondaryBtn, { backgroundColor: `${theme.warning}20` }]}
                onPress={handleBulkSkip}
                activeOpacity={0.7}
              >
                <Ionicons name="play-skip-forward" size={15} color={theme.warning} />
                <Text style={[styles.selectionBarSecondaryBtnText, { color: theme.warning }]}>
                  Skip
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionBarBtn}
                onPress={handleCompleteSelected}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done" size={18} color={theme.textInverse} />
                <Text style={styles.selectionBarBtnText}>Done ({selectedTaskIds.size})</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Undo bar for the latest tick — above the FAB so neither hides the other. */}
        <UndoToast
          visible={completions.pending.length > 0 && !selectionMode}
          message={undoMessage}
          onUndo={completions.undo}
          progress={completions.progress}
          bottomOffset={Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT + 16 + 56 + 12}
          icon="checkmark-circle"
        />

        {/* Floating Action Button */}
        <AnimatedFAB
          onPress={() => {
            setCreateTaskInitialDate(undefined);
            setShowModal(true);
          }}
        />

        <MonthCalendarSheet
          visible={showMonthSheet}
          selectedDate={selectedDate}
          getTasksForDate={getOpenTasksForDate}
          todayHasOverdue={openOverdue.length > 0}
          onSelectDate={handlePickMonthDate}
          onClose={closeMonthSheet}
          bottomInset={insets.bottom}
        />

        {/* View Options Bottom Sheet */}
        {showGroupMenu && (
          <CareTaskFilterSheet
            filters={filters}
            facetCounts={facetCounts}
            groupBy={groupBy}
            sortBy={sortBy}
            plotGroups={plotResolution.groups}
            beds={bedFilterOptions}
            showTimeFilter={showTimeFilter}
            hasActiveFilters={isFilterActive || groupBy !== DEFAULT_GROUP_BY || sortBy !== 'due'}
            onToggleTaskType={handleToggleTaskType}
            onToggleDueStatus={handleToggleDueStatus}
            onTogglePlot={handleTogglePlot}
            onToggleBed={handleToggleBed}
            onTogglePriority={handleTogglePriority}
            onToggleTime={handleToggleTime}
            onChangeGroupBy={handleChangeGroupBy}
            onChangeSortBy={setSortBy}
            onClearAll={handleClearAll}
            onClose={() => setShowGroupMenu(false)}
          />
        )}

        {/* Create Task Modal */}
        <CreateTaskModal
          visible={showModal}
          plants={plants}
          beds={bedList}
          existingTasks={tasks}
          styles={styles}
          bottomInset={insets.bottom}
          initialStartDate={createTaskInitialDate}
          initialPlantId={createTaskPrefillPlantId}
          initialTaskType={createTaskPrefillType}
          onClose={() => {
            setShowModal(false);
            setCreateTaskInitialDate(undefined);
            setCreateTaskPrefillPlantId(undefined);
            setCreateTaskPrefillType(undefined);
          }}
          onCreated={() => {
            setShowModal(false);
            setCreateTaskInitialDate(undefined);
            setCreateTaskPrefillPlantId(undefined);
            setCreateTaskPrefillType(undefined);
            loadData({ force: true });
          }}
        />

        {/* Task Notes Modal */}
        <TaskCompletionModal
          visible={showNotesModal}
          task={selectedTask}
          taskNotes={taskNotes}
          productUsed={productUsed}
          earlyCompletion={selectedTask ? isFutureTask(selectedTask) : false}
          completionReason={completionReason}
          inputQuantity={inputQuantity}
          inputUnit={inputUnit}
          treatedArea={treatedArea}
          areaUnit={areaUnit}
          labourMinutes={labourMinutes}
          isCompleting={isCompletingTask}
          plantName={selectedTask ? taskSubjectLabel(selectedTask) : ''}
          styles={styles}
          bottomInset={insets.bottom}
          onChangeNotes={(text) => setTaskNotes(sanitizeAlphaNumericSpaces(text))}
          onChangeProduct={(text) => setProductUsed(sanitizeAlphaNumericSpaces(text))}
          onChangeCompletionReason={(text) => setCompletionReason(sanitizeAlphaNumericSpaces(text))}
          onChangeInputQuantity={(text) => setInputQuantity(sanitizeDecimalText(text))}
          onChangeInputUnit={(text) => setInputUnit(sanitizeAlphaNumericSpaces(text))}
          onChangeTreatedArea={(text) => setTreatedArea(sanitizeDecimalText(text))}
          onChangeAreaUnit={(text) => setAreaUnit(sanitizeAlphaNumericSpaces(text))}
          onChangeLabourMinutes={(text) => setLabourMinutes(text.replace(/[^0-9]/g, ''))}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedTask(null);
            setCompletionReason('');
          }}
          onConfirm={confirmTaskComplete}
        />

        {/* Task Detail Bottom Sheet */}
        {showTaskDetail && detailTask && (
          <TaskDetailSheet
            task={detailTask}
            subject={taskSubjectLabel(detailTask)}
            plotName={taskPlotName(detailTask)}
            priority={getTaskPriority(detailTask)}
            overdueDays={calendarDaysOverdue(detailTask)}
            wateringCycle={describeWateringCycle(
              detailTask.plant_id ? plantMap.get(detailTask.plant_id) : undefined,
              detailTask.task_type,
              detailTask.frequency_days
            )}
            weatherNote={
              getTaskWeatherAdvisory(
                detailTask.task_type,
                getForecastForTask(detailTask),
                new Date(detailTask.next_due_at)
              )?.text ?? null
            }
            blocked={isEarlyCompletionBlocked(detailTask)}
            future={isSkipBlocked(detailTask)}
            bottomPadding={TAB_BAR_HEIGHT + Math.max(insets.bottom, 16)}
            onClose={closeTaskDetail}
            onDone={handleDetailComplete}
            onDoneWithNotes={handleDetailDoneWithNotes}
            onSkip={handleDetailSkip}
            onSaveAmount={handleSaveAmount}
          />
        )}

        <SkipTaskModal
          visible={showSkipModal}
          mode={scheduleMode}
          task={skipTask}
          taskCount={skipBulkTasks?.length ?? 1}
          excludedCount={skipExcludedCount}
          skipDays={skipDays}
          skipReason={skipReason}
          isSkipping={skippingTask}
          styles={styles}
          bottomInset={insets.bottom}
          onChangeDays={setSkipDays}
          onChangeReason={(text) => setSkipReason(sanitizeAlphaNumericSpaces(text))}
          onClose={closeSkipModal}
          onConfirm={handleConfirmSkip}
        />

        {notDueDialogProps && (
          <AlertDialog
            visible
            title={notDueDialogProps.title}
            detail={notDueDialogProps.detail}
            message={notDueDialogProps.message}
            icon={notDueDialogProps.icon}
            tone="warning"
            actions={notDueDialogProps.actions}
            onDismiss={() => setNotDueDialog(null)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
