import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SectionList,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Animated,
  Easing,
  Platform,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  LayoutChangeEvent,
  Modal,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import {
  markTaskDone,
  markTasksDone,
  skipTaskTemplate,
  calculateTaskPriority,
} from '../services/tasks';
import {
  isEarlyCompletionBlocked,
  isFutureTask,
  isSkipBlocked,
} from '../services/taskSchedulingLogic';
import { TaskTemplate, TaskType } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';
import {
  TASK_EMOJIS,
  TASK_COLORS,
  TASK_LABELS,
  EARLY_COMPLETION_BLOCK_REASON,
} from '../utils/taskConstants';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { CalendarScreenRouteProp, CalendarScreenNavigationProp } from '../types/navigation.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { createStyles, getStartOfWeek, COLLAPSED_STRIP_HEIGHT } from '../styles/calendarStyles';
import { sanitizeAlphaNumericSpaces } from '../utils/textSanitizer';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';
import { useCalendarData, HarvestReadyItem } from '../hooks/useCalendarData';
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from '../components/FloatingTabBar';
import { useBedOptions } from '@/hooks/useBedOptions';
import { useWeather } from '../hooks/useWeather';
import { isRainPredictedOnDate } from '../services/weather';
import { calculateExpectedHarvestDate } from '../utils/plantHelpers';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import TaskCompletionModal from '../components/modals/TaskCompletionModal';
import SkipTaskModal from '../components/modals/SkipTaskModal';
import { AlertDialog, type AlertDialogAction } from '../components/modals/AlertDialog';
import { SheetHandle } from '@/components/SheetHandle';
import WeekCalendarView from '../components/calendar/WeekCalendarView';
import MonthCalendarView from '../components/calendar/MonthCalendarView';
import { SwipeableTaskCard } from '../components/calendar/SwipeableTaskCard';
import { getErrorMessage } from '../utils/errorLogging';
import { tapFeedback } from '../utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Virtualized task list model ────────────────────────────────────────────
// The task area renders through a SectionList so long schedules stay windowed
// instead of mounting every SwipeableTaskCard at once.

type CalendarEmptyVariant =
  | 'selectedDateFiltered'
  | 'selectedDateNone'
  | 'searchNone'
  | 'filtersNone'
  | 'noUpcoming';

type CalendarRow =
  | { key: string; kind: 'task'; task: TaskTemplate }
  | { key: string; kind: 'harvest'; item: HarvestReadyItem }
  | { key: string; kind: 'empty'; variant: CalendarEmptyVariant; rawCount?: number; isToday?: boolean };

interface CalendarSectionHeader {
  title: string;
  count: number;
  /** Tasks driving the select-all checkbox; omitted for headers without one */
  checkboxTasks?: TaskTemplate[];
  overdue?: boolean;
  showDoneChip?: boolean;
  /** Title stretches to push the count right (default true) */
  titleFlex?: boolean;
}

interface CalendarListSection {
  key: string;
  header: CalendarSectionHeader | null;
  data: CalendarRow[];
}

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

const GROUP_OPTIONS: {
  value: 'none' | 'location' | 'type' | 'plant';
  label: string;
  icon: string;
}[] = [
  { value: 'none', label: 'No Grouping', icon: 'list' },
  { value: 'location', label: 'Location', icon: 'location' },
  { value: 'type', label: 'Type', icon: 'apps' },
  { value: 'plant', label: 'Plant', icon: 'leaf-outline' },
];

export default function CalendarScreen(): React.JSX.Element {
  const route = useRoute<CalendarScreenRouteProp>();
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const scrollViewRef = useRef<SectionList<CalendarRow, CalendarListSection>>(null);
  const [skipBulkTasks, setSkipBulkTasks] = useState<TaskTemplate[] | null>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [isCompletingAll, setIsCompletingAll] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'location' | 'type' | 'plant'>('none');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [filterTaskTypes, setFilterTaskTypes] = useState<Set<string>>(new Set());
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const { beds: bedList } = useBedOptions();
  const bedMap = useMemo(() => new Map(bedList.map((b) => [b.id, b.name])), [bedList]);
  const [bedSegment, setBedSegment] = useState<'bed' | 'other'>('other');
  const { forecast } = useWeather();
  // The Beds segment forces bed grouping; otherwise the View Options group menu applies.
  const effectiveGroupBy = bedSegment === 'bed' ? 'bed' : groupBy;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTask, setSkipTask] = useState<TaskTemplate | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [skippingTask, setSkippingTask] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [completingTotal, setCompletingTotal] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [skipDays, setSkipDays] = useState(1);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskTemplate | null>(null);
  const [notDueDialog, setNotDueDialog] = useState<NotDueDialog>(null);
  /** Not-yet-due tasks dropped from the current skip batch, reported in the sheet. */
  const [skipExcludedCount, setSkipExcludedCount] = useState(0);
  const completeProgress = useRef(new Animated.Value(0)).current; // 0→1 bulk-completion bar
  // Selection pill entrance/exit. `selectionBarMounted` outlives an empty
  // selection just long enough for the exit animation to finish — unmounting on
  // the state change alone would make the pill vanish rather than slide away.
  const [selectionBarMounted, setSelectionBarMounted] = useState(false);
  const selectionBarAnim = useRef(new Animated.Value(0)).current;
  // Collapsible-header state. `scrollY` is fed straight from the list's native
  // scroll event, so the collapse runs entirely on the UI thread.
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(0);
  const searchInputRef = React.useRef<TextInput>(null);
  const normalizeSearchText = (value: string): string =>
    sanitizeAlphaNumericSpaces(value).trim().toLowerCase();
  const normalizedSearchQuery = normalizeSearchText(searchQuery);

  const {
    tasks,
    plants,
    initialLoading,
    refreshing,
    isMountedRef,
    loadData,
    handleRefresh,
    plantMap,
    filteredTasks,
    filteredHarvestsReady,
    todayTasks,
    weekTasks,
    tasksForDisplay,
    groupedTasks,
    segmentCounts,
    overdueTasks,
    isSearching,
    getTasksForDate,
    getRawTasksForDate,
    getPlantDetails,
  } = useCalendarData({
    normalizedSearchQuery,
    normalizeSearchText,
    selectedView,
    currentWeekStart,
    currentMonth,
    selectedDate,
    groupBy: effectiveGroupBy,
    filterTaskTypes,
    filterOverdueOnly,
    bedSegment,
    bedNames: bedMap,
  });

  // One-shot after first load: the default "Pots & Ground" segment hides
  // bed-plant tasks, so when it's empty but Beds has tasks, start on Beds.
  // Never re-runs, and a manual segment tap disarms it.
  const segmentAutoSelectDone = useRef(false);
  const selectSegment = useCallback((value: 'bed' | 'other') => {
    segmentAutoSelectDone.current = true;
    setBedSegment(value);
  }, []);
  useEffect(() => {
    if (segmentAutoSelectDone.current || initialLoading) return;
    segmentAutoSelectDone.current = true;
    if (segmentCounts.other === 0 && segmentCounts.bed > 0) {
      setBedSegment('bed');
    }
  }, [initialLoading, segmentCounts]);

  const isFilterActive = filterTaskTypes.size > 0 || filterOverdueOnly;

  const clearFilters = useCallback(() => {
    setFilterTaskTypes(new Set());
    setFilterOverdueOnly(false);
  }, []);

  const overdueIdSet = React.useMemo(() => new Set(overdueTasks.map((t) => t.id)), [overdueTasks]);

  const dayGroupedTasks = React.useMemo(() => {
    if (effectiveGroupBy !== 'none' || isSearching || selectedView !== 'week') return null;
    const todayStr = new Date().toDateString();
    const grouped: Record<string, TaskTemplate[]> = {};
    for (const task of tasksForDisplay) {
      if (!task.next_due_at || overdueIdSet.has(task.id)) continue;
      const key = new Date(task.next_due_at).toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    }
    const sortedKeys = Object.keys(grouped).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    return sortedKeys.map((key) => {
      const date = new Date(key);
      const isToday = key === todayStr;
      return {
        dateKey: key,
        label: isToday
          ? 'Today'
          : date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            }),
        tasks: grouped[key],
        isToday,
      };
    });
  }, [effectiveGroupBy, isSearching, selectedView, tasksForDisplay, overdueIdSet]);

  const setTodayView = React.useCallback(() => {
    const today = new Date();
    setSelectedDate(null);
    setCurrentWeekStart(getStartOfWeek(today));
    setCurrentMonth(today);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData({ force: true });
    setTodayView();
    return () => {
      isMountedRef.current = false;
    };
  }, [setTodayView, loadData, isMountedRef]);

  // Show swipe hint banner for the first 3 visits, then auto-hide
  useEffect(() => {
    (async () => {
      const count = parseInt((await safeGetItem('swipeHintViewCount')) || '0', 10);
      if (count < 3) {
        setShowSwipeHint(true);
        await safeSetItem('swipeHintViewCount', String(count + 1));
      }
    })();
  }, []);

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    safeSetItem('swipeHintViewCount', '3'); // permanently dismiss
  }, []);

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

  // How far the header travels before it is fully collapsed: everything above
  // the strip. Guarded to ≥1 so the interpolations stay valid before measurement.
  const collapseRange = Math.max(1, headerHeight - COLLAPSED_STRIP_HEIGHT);

  // diffClamp accumulates the scroll delta and clamps it to [0, collapseRange]:
  // scrolling down grows it (header slides away), scrolling up shrinks it
  // immediately at any offset — so a small upward flick brings the calendar
  // back rather than requiring a scroll all the way to the top.
  const collapse = useMemo(
    () => Animated.diffClamp(scrollY, 0, collapseRange),
    [scrollY, collapseRange]
  );

  const headerTranslateY = collapse.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [0, -collapseRange],
    extrapolate: 'clamp',
  });
  const calendarOpacity = collapse.interpolate({
    inputRange: [0, collapseRange * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  // Slides the strip up from its clipped parking spot below the header, so it
  // arrives exactly as the calendar finishes fading out.
  const stripTranslateY = collapse.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [COLLAPSED_STRIP_HEIGHT, 0],
    extrapolate: 'clamp',
  });

  const handleContentScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        // The tab bar hide/show still needs a JS callback; it drives its own
        // native-driver translate, so no layout work happens here either.
        listener: onTabBarScroll,
      }),
    [scrollY, onTabBarScroll]
  );

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    // Ignore sub-pixel jitter so a re-measure can't loop through setState.
    setHeaderHeight((prev) => (Math.abs(prev - height) > 1 ? height : prev));
  }, []);

  // The header floats above the list, so the list reserves room for it via
  // padding rather than by being pushed down in layout.
  const listContentStyle = useMemo(
    () => ({
      paddingTop: headerHeight,
      paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16,
    }),
    [headerHeight, insets.bottom]
  );

  const scrollToTop = useCallback((animated: boolean) => {
    scrollViewRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated });
  }, []);

  // Tapping the collapsed strip just returns to the top — `collapse` unwinds to
  // 0 on its own as the offset drops, so there is no separate animation to run.
  const expandCalendar = useCallback(() => {
    scrollToTop(true);
  }, [scrollToTop]);

  // Reset view and refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      scrollToTop(false);
      resetTabBar();
      const today = new Date();
      setSelectedDate(today);
      setCurrentWeekStart(getStartOfWeek(today));
      setCurrentMonth(today);
      setSessionCompletedCount(0);
      if (route.params?.resetFilters) {
        setFilterTaskTypes(new Set());
        setFilterOverdueOnly(false);
        setGroupBy('none');
      } else if (route.params?.filterOverdue) {
        setFilterOverdueOnly(true);
      }
      if (route.params?.openCreateTask) {
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
    }, [loadData, resetTabBar, route, navigation, scrollToTop])
  );

  const openCompletionSheet = useCallback((task: TaskTemplate) => {
    setSelectedTask(task);
    setTaskNotes('');
    setProductUsed('');
    setShowNotesModal(true);
  }, []);

  const formatDueDate = useCallback(
    (task: TaskTemplate): string =>
      new Date(task.next_due_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

  // Water / fertilise / spray can't be completed ahead of schedule at all —
  // doing the work early is harmful, not merely off-schedule. Explain, and point
  // at skip, which is the right tool if the date itself looks wrong.
  // Bed-level tasks have no plant, so fall back to the bed name — same label the
  // card shows, rather than a bare "General".
  const taskSubjectLabel = useCallback(
    (task: TaskTemplate): string => {
      const bedLabel = task.bed_id != null ? bedMap.get(task.bed_id) : undefined;
      return task.plant_id ? getPlantDetails(task.plant_id).name : bedLabel ?? 'General';
    },
    [bedMap, getPlantDetails]
  );

  const handleBlockedComplete = useCallback((task: TaskTemplate) => {
    swipeableRefs.current.get(task.id)?.close();
    setNotDueDialog({ kind: 'blocked', tasks: [task] });
  }, []);

  const handleTaskComplete = useCallback(
    (task: TaskTemplate) => {
      // Close the swipeable drawer before opening the modal
      swipeableRefs.current.get(task.id)?.close();

      if (isEarlyCompletionBlocked(task)) {
        handleBlockedComplete(task);
        return;
      }

      // For every other type, completing early is allowed — the farmer may
      // genuinely have done the work — but it reschedules the whole cycle from
      // today, so confirm first.
      if (isFutureTask(task)) {
        setNotDueDialog({ kind: 'confirmEarly', tasks: [task] });
        return;
      }
      openCompletionSheet(task);
    },
    [handleBlockedComplete, openCompletionSheet]
  );

  const confirmTaskComplete = async (): Promise<void> => {
    if (!selectedTask || isCompletingTask) return;

    setIsCompletingTask(true);
    try {
      const didMark = await markTaskDone(
        selectedTask,
        taskNotes || undefined,
        productUsed || undefined
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
      setSessionCompletedCount((prev) => prev + 1);
      loadData({ force: true });
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsCompletingTask(false);
    }
  };

  const toggleTaskSelection = useCallback((taskId: string) => {
    // Close any open swipeable to prevent gesture state conflicts
    swipeableRefs.current.get(taskId)?.close();
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
    async (selected: TaskTemplate[]) => {
      setIsCompletingAll(true);
      setCompletedCount(0);
      setCompletingTotal(selected.length);

      // The commit is a single batch (no per-task boundary for ≤166 tasks), so the
      // bar creeps to 90% while awaiting, then snaps to 100% on resolve.
      completeProgress.setValue(0);
      Animated.timing(completeProgress, {
        toValue: 0.9,
        duration: 1200,
        useNativeDriver: false,
      }).start();

      try {
        // One batched commit + single cache write — no per-task re-render storm.
        const { succeeded, failed } = await markTasksDone(selected, {
          skipAlreadyDoneCheck: true,
          onProgress: (done) => {
            if (isMountedRef.current) setCompletedCount(done);
          },
        });

        if (!isMountedRef.current) return;
        setCompletedCount(succeeded);
        completeProgress.stopAnimation();
        Animated.timing(completeProgress, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }).start();
        // Hold the full "N/N" bar briefly so the user sees it complete.
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!isMountedRef.current) return;

        setSelectedTaskIds(new Set());
        setSessionCompletedCount((prev) => prev + succeeded);
        loadData({ force: true });
        if (failed > 0) {
          Alert.alert(
            'Partial Completion',
            `${failed} task(s) failed. You can retry them individually.`
          );
        }
      } catch (error) {
        if (isMountedRef.current) Alert.alert('Error', getErrorMessage(error));
      } finally {
        // Always close the modal — even on throw — so it can't get stuck open.
        if (isMountedRef.current) {
          setIsCompletingAll(false);
          setCompletedCount(0);
          setCompletingTotal(0);
        }
        completeProgress.setValue(0);
      }
    },
    [loadData, completeProgress, isMountedRef]
  );

  const handleCompleteSelected = useCallback(() => {
    const raw = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (raw.length === 0 || isCompletingAll) return;

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
      // `tasks` is the not-yet-due subset so Skip touches only those, while
      // Mark done still applies to the whole completable selection.
      setNotDueDialog({
        kind: 'confirmEarly',
        tasks: future,
        selectedTotal: selected.length,
        completeTargets: selected,
      });
      return;
    }
    void completeSelected(selected);
  }, [tasks, selectedTaskIds, isCompletingAll, completeSelected]);

  // Single entry point to the skip sheet — the card swipe, the bulk bar, the
  // detail sheet and the "Not due yet" dialog all land here, so a batch gets the
  // same day options and reason as a single skip rather than a hardcoded +1 day.
  // A lone task takes the single path so the sheet can still show its preview.
  // It is also the gate: a not-yet-due task has nothing to defer, so it never
  // reaches the sheet. A mixed batch skips what it can and reports the rest.
  const openSkipForTasks = useCallback((targets: TaskTemplate[]) => {
    if (targets.length === 0) return;
    const eligible = targets.filter((t) => !isSkipBlocked(t));
    if (eligible.length === 0) {
      setNotDueDialog({
        kind: 'skipBlocked',
        tasks: targets,
        ...(targets.length > 1 ? { selectedTotal: targets.length } : {}),
      });
      return;
    }
    const single = eligible.length === 1 ? eligible[0] ?? null : null;
    setSkipTask(single);
    setSkipBulkTasks(single ? null : eligible);
    setSkipExcludedCount(targets.length - eligible.length);
    setSkipReason('');
    setSkipDays(1);
    setShowSkipModal(true);
  }, []);

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
          ? 'None of the selected tasks can be completed early.'
          : EARLY_COMPLETION_BLOCK_REASON[first.task_type] ?? ''
        : kind === 'skipBlocked'
        ? bulk
          ? "None of the selected tasks are due yet, so there's nothing to skip."
          : 'Only tasks that are due can be skipped.'
        : bulk
        ? 'Marking them done today will reschedule them from today.'
        : 'Marking it done today will reschedule the next one from today.';

    const dismiss = { label: 'Got it', onPress: () => setNotDueDialog(null) };

    const actions: AlertDialogAction[] =
      kind === 'confirmEarly'
        ? [
            {
              label: 'Mark done',
              icon: 'checkmark-circle-outline',
              variant: 'primary',
              onPress: () =>
                closeNotDueThen(() => {
                  if (completeTargets) void completeSelected(completeTargets);
                  else openCompletionSheet(first);
                }),
            },
            { label: 'Cancel', onPress: () => setNotDueDialog(null) },
          ]
        : [dismiss];

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
          onPress={() => toggleSectionSelection(selectable)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              state === 'all'
                ? 'checkmark-circle'
                : state === 'partial'
                ? 'remove-circle'
                : 'ellipse-outline'
            }
            size={20}
            color={state === 'none' ? theme.border : theme.primary}
          />
        </TouchableOpacity>
      );
    },
    [getSectionState, toggleSectionSelection, theme]
  );

  const handleOpenSkipModal = useCallback(
    (task: TaskTemplate) => {
      swipeableRefs.current.get(task.id)?.close();
      openSkipForTasks([task]);
    },
    [openSkipForTasks]
  );

  const handleBlockedSkip = useCallback((task: TaskTemplate) => {
    swipeableRefs.current.get(task.id)?.close();
    setNotDueDialog({ kind: 'skipBlocked', tasks: [task] });
  }, []);

  const closeSkipModal = useCallback(() => {
    setShowSkipModal(false);
    setSkipReason('');
    setSkipDays(1);
    setSkipTask(null);
    setSkipBulkTasks(null);
    setSkipExcludedCount(0);
  }, []);

  const handleConfirmSkip = useCallback(async (): Promise<void> => {
    const targets = skipBulkTasks ?? (skipTask ? [skipTask] : []);
    if (targets.length === 0 || skippingTask) return;
    setSkippingTask(true);
    try {
      // Persists the reason on each template so the "why" outlives this sheet
      // and can be shown on the task detail view.
      await Promise.all(targets.map((task) => skipTaskTemplate(task, skipDays, skipReason)));
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
  }, [skipBulkTasks, skipTask, skippingTask, skipDays, skipReason, closeSkipModal, loadData]);

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
    handleOpenSkipModal(detailTask);
  }, [detailTask, handleOpenSkipModal]);

  const handleShowDetail = useCallback((task: TaskTemplate) => {
    setDetailTask(task);
    setShowTaskDetail(true);
  }, []);

  // Estimated harvest date for harvest tasks, from enriched (A2) care data.
  const computeHarvestHint = useCallback(
    (task: TaskTemplate): string | null => {
      if (task.task_type !== 'harvest' && task.task_type !== 'harvest_leaves') return null;
      if (!task.plant_id) return null;
      const plant = plantMap.get(task.plant_id);
      if (!plant) return null;
      const iso = calculateExpectedHarvestDate(
        plant.plant_variety,
        plant.planting_date,
        plant.plant_type
      );
      if (!iso) return null;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    [plantMap]
  );

  const renderSwipeableTask = useCallback(
    (task: TaskTemplate): React.JSX.Element | null => (
      <SwipeableTaskCard
        key={task.id}
        task={task}
        isSelected={selectedTaskIds.has(task.id)}
        plantMap={plantMap}
        swipeableRefs={swipeableRefs}
        getPlantDetails={getPlantDetails}
        onComplete={handleTaskComplete}
        onBlockedComplete={handleBlockedComplete}
        onSkipOpen={handleOpenSkipModal}
        onBlockedSkip={handleBlockedSkip}
        onSelectToggle={toggleTaskSelection}
        onDetail={handleShowDetail}
        styles={styles}
        bedMap={bedMap}
        rainExpected={
          task.task_type === 'water' &&
          !!task.next_due_at &&
          isRainPredictedOnDate(forecast, new Date(task.next_due_at))
        }
        harvestHint={computeHarvestHint(task)}
      />
    ),
    [
      selectedTaskIds,
      plantMap,
      bedMap,
      styles,
      getPlantDetails,
      handleTaskComplete,
      handleBlockedComplete,
      handleOpenSkipModal,
      handleBlockedSkip,
      toggleTaskSelection,
      handleShowDetail,
      forecast,
      computeHarvestHint,
    ]
  );

  // Build the virtualized section model for the task area. Mirrors the
  // previous ScrollView layout: selected date → search empty → harvest ready
  // → overdue → today → day-grouped week view / grouped views / empty states.
  const listSections = useMemo((): CalendarListSection[] => {
    const sections: CalendarListSection[] = [];
    const todayStr = new Date().toDateString();
    const selectedIsToday = !!selectedDate && selectedDate.toDateString() === todayStr;
    const taskRows = (prefix: string, sectionTasks: TaskTemplate[]): CalendarRow[] =>
      sectionTasks.map((task) => ({ key: `${prefix}-${task.id}`, kind: 'task' as const, task }));

    // Selected Date Tasks
    if (!isSearching && selectedDate) {
      const selectedDateTasks = getTasksForDate(selectedDate);
      const rawSelectedDateTasks = getRawTasksForDate(selectedDate);
      const hiddenByFilter =
        selectedDateTasks.length === 0 && rawSelectedDateTasks.length > 0 && isFilterActive;
      if (selectedDateTasks.length > 0) {
        sections.push({
          key: 'selected-date',
          header: {
            title: selectedIsToday
              ? 'Today'
              : selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }),
            checkboxTasks: selectedDateTasks,
            count: selectedDateTasks.length,
          },
          data: taskRows('selected', selectedDateTasks),
        });
      } else if (hiddenByFilter && !initialLoading) {
        sections.push({
          key: 'selected-date-empty',
          header: null,
          data: [
            {
              key: 'selected-date-empty',
              kind: 'empty',
              variant: 'selectedDateFiltered',
              rawCount: rawSelectedDateTasks.length,
            },
          ],
        });
      } else if (!initialLoading) {
        sections.push({
          key: 'selected-date-empty',
          header: null,
          data: [
            {
              key: 'selected-date-empty',
              kind: 'empty',
              variant: 'selectedDateNone',
              isToday: selectedIsToday,
            },
          ],
        });
      }
    }

    // Search with no results
    if (isSearching && filteredTasks.length === 0 && !initialLoading) {
      sections.push({
        key: 'search-empty',
        header: null,
        data: [{ key: 'search-empty', kind: 'empty', variant: 'searchNone' }],
      });
    }

    // Harvest Ready
    if (filteredHarvestsReady.length > 0) {
      sections.push({
        key: 'harvest-ready',
        header: {
          title: '🧺 Harvest Ready',
          count: filteredHarvestsReady.length,
          titleFlex: false,
        },
        data: filteredHarvestsReady
          .filter((item): item is HarvestReadyItem => !!item)
          .map((item) => ({ key: `harvest-${item.plant.id}`, kind: 'harvest' as const, item })),
      });
    }

    // Overdue — pinned above Today
    if (!isSearching && overdueTasks.length > 0) {
      sections.push({
        key: 'overdue',
        header: {
          title: '⚠️ Overdue',
          checkboxTasks: overdueTasks,
          count: overdueTasks.length,
          overdue: true,
        },
        data: taskRows('overdue', overdueTasks),
      });
    }

    // Today's Tasks — hidden when today is already the selected date
    if (todayTasks.length > 0 && !selectedIsToday) {
      sections.push({
        key: 'today',
        header: {
          title: 'Today',
          checkboxTasks: todayTasks,
          count: todayTasks.length,
          showDoneChip: true,
        },
        data: taskRows('today', todayTasks),
      });
    }

    const upcomingEmpty = (): void => {
      if (!isSearching && todayTasks.length === 0 && overdueTasks.length === 0 && !initialLoading) {
        sections.push({
          key: 'upcoming-empty',
          header: null,
          data: [
            {
              key: 'upcoming-empty',
              kind: 'empty',
              variant: isFilterActive ? 'filtersNone' : 'noUpcoming',
            },
          ],
        });
      }
    };

    // Day-by-day week view OR grouped tasks
    if (dayGroupedTasks) {
      if (dayGroupedTasks.length > 0) {
        for (const { dateKey, label, tasks: dayTasks } of dayGroupedTasks) {
          const isToday = dateKey === todayStr;
          if (isToday && todayTasks.length > 0 && !selectedIsToday) continue;
          sections.push({
            key: `day-${dateKey}`,
            header: {
              title: label,
              checkboxTasks: dayTasks ?? [],
              count: (dayTasks ?? []).length,
            },
            data: taskRows(`day-${dateKey}`, dayTasks ?? []),
          });
        }
      } else {
        upcomingEmpty();
      }
    } else if (
      Object.keys(groupedTasks).length > 0 &&
      Object.values(groupedTasks).some((arr) => arr.length > 0)
    ) {
      for (const groupName of Object.keys(groupedTasks)) {
        const nonOverdue = (groupedTasks[groupName] ?? []).filter((t) => !overdueIdSet.has(t.id));
        if (nonOverdue.length === 0) continue;
        const fallbackTitle = selectedView === 'month' ? 'This Month' : 'This Week';
        const title = groupName
          ? effectiveGroupBy === 'location'
            ? `📍 ${groupName}`
            : effectiveGroupBy === 'type'
            ? TASK_LABELS[groupName as TaskType] ||
              groupName.charAt(0).toUpperCase() + groupName.slice(1)
            : effectiveGroupBy === 'plant'
            ? `🌿 ${groupName}`
            : effectiveGroupBy === 'bed'
            ? `🛏 ${groupName}`
            : fallbackTitle
          : isSearching
          ? 'Search Results'
          : fallbackTitle;
        sections.push({
          key: `group-${groupName || 'all'}`,
          header: {
            title,
            checkboxTasks: nonOverdue,
            count: groupName
              ? nonOverdue.length
              : isSearching
              ? tasksForDisplay.length
              : weekTasks.length,
            showDoneChip: !groupName && !isSearching,
          },
          data: taskRows(`group-${groupName || 'all'}`, nonOverdue),
        });
      }
    } else {
      upcomingEmpty();
    }

    // Both empty cards fire on the same condition — nothing due today — so an
    // empty garden showed "All caught up" stacked on top of "No upcoming tasks".
    // The full card says the same thing and carries the Create Task action, so
    // the compact one is the one to drop. `selectedDateFiltered` is left alone:
    // its "hidden by filters / Clear" affordance is not duplicated anywhere.
    const hasVariant = (section: CalendarListSection, variant: CalendarEmptyVariant): boolean => {
      const row = section.data[0];
      return row?.kind === 'empty' && row.variant === variant;
    };
    if (sections.some((s) => hasVariant(s, 'noUpcoming'))) {
      return sections.filter((s) => !hasVariant(s, 'selectedDateNone'));
    }

    return sections;
  }, [
    isSearching,
    selectedDate,
    getTasksForDate,
    getRawTasksForDate,
    isFilterActive,
    initialLoading,
    filteredTasks,
    filteredHarvestsReady,
    overdueTasks,
    todayTasks,
    dayGroupedTasks,
    groupedTasks,
    overdueIdSet,
    effectiveGroupBy,
    selectedView,
    tasksForDisplay,
    weekTasks,
  ]);

  const renderEmptyRow = useCallback(
    (row: Extract<CalendarRow, { kind: 'empty' }>): React.JSX.Element => {
      switch (row.variant) {
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
        case 'selectedDateNone':
          return (
            <View style={styles.emptyStateCompact}>
              <Ionicons name="calendar-outline" size={28} color={theme.border} />
              <View style={styles.emptyStateCompactBody}>
                <Text style={styles.emptyStateCompactText}>
                  {row.isToday ? 'All caught up' : 'No tasks scheduled'}
                </Text>
                <Text style={styles.emptyStateCompactSubtext}>
                  {row.isToday ? 'Nothing left for today' : 'Nothing planned for this date'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.emptyStateCompactAction}
                onPress={() => {
                  setCreateTaskInitialDate(selectedDate ?? undefined);
                  setShowModal(true);
                }}
              >
                <Ionicons name="add" size={16} color={theme.primary} />
                <Text style={styles.emptyStateCompactActionText}>Add</Text>
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
              {/* Covers today *and* the rest of the window — this card replaces
                  the compact "All caught up" one when both would show. */}
              <Text style={styles.emptyStateText}>All caught up</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedView === 'month'
                  ? 'Nothing due today or the rest of this month'
                  : 'Nothing due today or the rest of this week'}
              </Text>
              <TouchableOpacity style={styles.addTaskButton} onPress={() => setShowModal(true)}>
                <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                <Text style={styles.addTaskButtonText}>Create Task</Text>
              </TouchableOpacity>
            </View>
          );
      }
    },
    [styles, theme, clearFilters, selectedDate, selectedView, tasks.length, searchQuery]
  );

  const renderListItem = useCallback(
    ({ item }: { item: CalendarRow }): React.JSX.Element | null => {
      if (item.kind === 'task') {
        return <View style={styles.listRow}>{renderSwipeableTask(item.task)}</View>;
      }
      if (item.kind === 'harvest') {
        const harvest = item.item;
        return (
          <View style={styles.listRow}>
            <View style={[styles.harvestCard, harvest.isReady && styles.harvestCardReady]}>
              <View style={styles.harvestIcon}>
                <Text style={styles.harvestEmoji}>
                  {harvest.plant.plant_type === 'coconut_tree' ? '🥥' : '🍎'}
                </Text>
              </View>
              <View style={styles.harvestInfo}>
                <Text style={styles.harvestPlant}>{harvest.plant.name}</Text>
                <Text style={styles.harvestDate}>
                  {harvest.isReady
                    ? '✅ Ready to harvest!'
                    : `Ready in ${harvest.daysUntil} days`}
                </Text>
              </View>
            </View>
          </View>
        );
      }
      return <View style={styles.listRow}>{renderEmptyRow(item)}</View>;
    },
    [styles, renderSwipeableTask, renderEmptyRow]
  );

  const renderListSectionHeader = useCallback(
    ({ section }: { section: CalendarListSection }): React.JSX.Element | null => {
      const header = section.header;
      if (!header) return null;
      return (
        <View style={styles.listSectionHeader}>
          <View style={styles.sectionHeaderRow}>
            {header.checkboxTasks ? renderSectionCheckbox(header.checkboxTasks) : null}
            <Text
              style={[
                styles.sectionTitle,
                header.overdue
                  ? styles.sectionTitleOverdue
                  : header.titleFlex !== false
                  ? styles.sectionTitleFlex
                  : null,
              ]}
            >
              {header.title}
            </Text>
            {header.showDoneChip ? (
              <View style={styles.rowCenterGap8}>
                {sessionCompletedCount > 0 && (
                  <View style={styles.weekDoneChip}>
                    <Text style={styles.weekDoneChipText}>✓ {sessionCompletedCount} done</Text>
                  </View>
                )}
                <Text style={styles.sectionCount}>{header.count}</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.sectionCount,
                  header.overdue && { backgroundColor: theme.errorLight, color: theme.error },
                ]}
              >
                {header.count}
              </Text>
            )}
          </View>
        </View>
      );
    },
    [styles, theme, renderSectionCheckbox, sessionCompletedCount]
  );

  const renderListSectionFooter = useCallback(
    (): React.JSX.Element => <View style={styles.listSectionFooter} />,
    [styles]
  );

  const listKeyExtractor = useCallback((row: CalendarRow): string => row.key, []);

  const isViewingToday = React.useMemo(() => {
    const today = new Date();
    if (selectedView === 'week') {
      const todayWeekStart = getStartOfWeek(today);
      return currentWeekStart.toDateString() === todayWeekStart.toDateString();
    }
    return (
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  }, [selectedView, currentWeekStart, currentMonth]);

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
                <Text style={styles.headerTitle}>Care Plan</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.searchIconBtn}
                    onPress={() => setSearchActive(true)}
                  >
                    <Ionicons name="search" size={20} color={theme.textInverse} />
                    {searchQuery.trim() !== '' && <View style={styles.searchActiveDot} />}
                  </TouchableOpacity>
                  {!isViewingToday && (
                    <TouchableOpacity style={styles.todayButton} onPress={setTodayView}>
                      <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.viewToggle}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setSelectedView(selectedView === 'week' ? 'month' : 'week');
                    }}
                  >
                    <Ionicons
                      name={selectedView === 'week' ? 'list' : 'calendar'}
                      size={18}
                      color={theme.textInverse}
                    />
                    <Text style={styles.viewToggleText}>
                      {selectedView === 'week' ? 'Week' : 'Month'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.groupMenuButton,
                      (showGroupMenu || isFilterActive || groupBy !== 'none') &&
                        styles.groupMenuButtonActive,
                    ]}
                    onPress={() => setShowGroupMenu(!showGroupMenu)}
                  >
                    <Ionicons
                      name="funnel"
                      size={20}
                      color={isFilterActive ? theme.primary : theme.textInverse}
                    />
                    {(filterTaskTypes.size > 0 || filterOverdueOnly) && !showGroupMenu && (
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>
                          {filterTaskTypes.size + (filterOverdueOnly ? 1 : 0)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* The list fills this area; the calendar header floats above it and
            slides away on a pure GPU transform, so scrolling never triggers a
            layout pass on the list below. */}
        <View style={styles.listArea}>
          <Animated.SectionList
            ref={scrollViewRef}
            style={styles.content}
            sections={listSections}
            keyExtractor={listKeyExtractor}
            renderItem={renderListItem}
            renderSectionHeader={renderListSectionHeader}
            renderSectionFooter={renderListSectionFooter}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={listContentStyle}
            onScroll={handleContentScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={initialLoading || refreshing}
                onRefresh={handleRefresh}
                progressViewOffset={headerHeight}
              />
            }
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
            ListHeaderComponent={
            <>
          {/* Swipe Hint Banner */}
          {showSwipeHint && (
            <View style={styles.swipeHintBanner}>
              <View style={styles.swipeHintBannerContent}>
                <Ionicons name="swap-horizontal-outline" size={18} color={theme.primary} />
                <Text style={styles.swipeHintBannerText}>
                  Swipe cards left to skip, right to complete
                </Text>
              </View>
              <TouchableOpacity
                onPress={dismissSwipeHint}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* All / Beds / Pots & Ground segmented control */}
          <View style={styles.segmentRow}>
            {(
              [
                ['other', 'Pots & Ground', 'cube-outline', segmentCounts.other],
                ['bed', 'Beds', 'grid-outline', segmentCounts.bed],
              ] as const
            ).map(([value, label, icon, count]) => {
              const active = bedSegment === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.segmentChip, active && styles.segmentChipActive]}
                  onPress={() => selectSegment(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${label} tasks, ${count}`}
                >
                  <Ionicons
                    name={icon}
                    size={14}
                    color={active ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.segmentChipText, active && styles.segmentChipTextActive]}>
                    {label}
                  </Text>
                  <View style={[styles.segmentBadge, active && styles.segmentBadgeActive]}>
                    <Text style={[styles.segmentBadgeText, active && styles.segmentBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
            </>
            }
          />

          {/* Collapsible calendar header. The strip is anchored to this block's
              bottom edge, so once the block has slid up by (height − strip
              height) the strip lands flush under the app bar. */}
          <Animated.View
            style={[styles.collapsibleHeader, { transform: [{ translateY: headerTranslateY }] }]}
            onLayout={handleHeaderLayout}
          >
            <Animated.View style={{ opacity: calendarOpacity }}>
              {selectedView === 'week' ? (
                <WeekCalendarView
                  currentWeekStart={currentWeekStart}
                  selectedDate={selectedDate}
                  taskColors={TASK_COLORS}
                  getTasksForDate={getTasksForDate}
                  onSelectDate={setSelectedDate}
                  onNavigateWeek={(newStart) => {
                    setSelectedDate(null);
                    setCurrentWeekStart(newStart);
                  }}
                />
              ) : (
                <MonthCalendarView
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  taskColors={TASK_COLORS}
                  getTasksForDate={getTasksForDate}
                  onSelectDate={setSelectedDate}
                  onNavigateMonth={(newMonth) => {
                    setSelectedDate(null);
                    setCurrentMonth(newMonth);
                  }}
                />
              )}
            </Animated.View>

            <Animated.View
              style={[
                styles.collapsedStripOverlay,
                { transform: [{ translateY: stripTranslateY }] },
              ]}
            >
              <TouchableOpacity
                style={styles.collapsedStrip}
                onPress={expandCalendar}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Show calendar"
              >
                <Text style={styles.collapsedStripText}>
                  {selectedDate
                    ? selectedDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : selectedView === 'week'
                    ? `${currentWeekStart.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })} – ${new Date(
                        currentWeekStart.getTime() + 6 * 86400000
                      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                {selectedDate && (
                  <Text style={styles.collapsedStripCount}>
                    {getTasksForDate(selectedDate).length}
                  </Text>
                )}
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
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
                disabled={isCompletingAll}
                activeOpacity={0.7}
              >
                <Ionicons name="play-skip-forward" size={15} color={theme.warning} />
                <Text style={[styles.selectionBarSecondaryBtnText, { color: theme.warning }]}>
                  Skip
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectionBarBtn, isCompletingAll && styles.selectionBarBtnDisabled]}
                onPress={handleCompleteSelected}
                disabled={isCompletingAll}
                activeOpacity={0.7}
              >
                {isCompletingAll ? (
                  <Text style={styles.selectionBarBtnText}>
                    {completedCount}/{completingTotal}
                  </Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color={theme.textInverse} />
                    <Text style={styles.selectionBarBtnText}>Done ({selectedTaskIds.size})</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Floating Action Button */}
        <AnimatedFAB onPress={() => setShowModal(true)} />

        {/* View Options Bottom Sheet */}
        {showGroupMenu && (
          <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowGroupMenu(false)} />
            <View
              style={[
                styles.sheetContainer,
                { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) },
              ]}
            >
              <SheetHandle onClose={() => setShowGroupMenu(false)} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>View Options</Text>
                {(groupBy !== 'none' || filterTaskTypes.size > 0 || filterOverdueOnly) && (
                  <TouchableOpacity
                    onPress={() => {
                      setGroupBy('none');
                      setFilterTaskTypes(new Set());
                      setFilterOverdueOnly(false);
                    }}
                    style={styles.sheetClearBtn}
                  >
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
                {/* Filter Section */}
                <Text style={styles.sheetSectionTitle}>Filter</Text>
                <View style={styles.sheetChipWrap}>
                  <TouchableOpacity
                    style={[styles.sheetChip, filterOverdueOnly && styles.sheetChipActive]}
                    onPress={() => setFilterOverdueOnly((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        filterOverdueOnly && styles.sheetChipTextActive,
                      ]}
                    >
                      ⚠️ Overdue only
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.sheetChipWrap, styles.chipWrapMarginTop]}>
                  {(Object.keys(TASK_LABELS) as TaskType[]).map((type) => {
                    const isActive = filterTaskTypes.has(type);
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                        onPress={() => {
                          setFilterTaskTypes((prev) => {
                            const next = new Set(prev);
                            if (next.has(type)) {
                              next.delete(type);
                            } else {
                              next.add(type);
                            }
                            return next;
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}
                        >
                          {TASK_EMOJIS[type]} {TASK_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Group By Section */}
                <Text style={[styles.sheetSectionTitle, styles.sheetSectionTitleMarginTop]}>
                  Group By
                </Text>
                <View style={styles.sheetChipWrap}>
                  {GROUP_OPTIONS.map((option) => {
                    const isActive = groupBy === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                        onPress={() => {
                          setGroupBy(option.value);
                          setShowGroupMenu(false);
                        }}
                      >
                        <Text
                          style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Create Task Modal */}
        <CreateTaskModal
          visible={showModal}
          plants={plants}
          beds={bedList}
          styles={styles}
          bottomInset={insets.bottom}
          initialStartDate={createTaskInitialDate}
          initialPlantId={createTaskPrefillPlantId}
          initialTaskType={createTaskPrefillType}
          onClose={() => {
            setShowModal(false);
            setCreateTaskPrefillPlantId(undefined);
            setCreateTaskPrefillType(undefined);
          }}
          onCreated={() => {
            setShowModal(false);
            setCreateTaskPrefillPlantId(undefined);
            setCreateTaskPrefillType(undefined);
            loadData({ force: true });
          }}
        />

        {/* Completion Progress Modal */}
        <Modal
          visible={isCompletingAll}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {}}
          statusBarTranslucent
          navigationBarTranslucent
        >
          <View style={styles.completeAllOverlay}>
            <View style={styles.completeAllCard}>
              <View style={styles.completeAllIconRow}>
                <View style={styles.completeAllIconCircle}>
                  <Ionicons name="hourglass" size={28} color={theme.textInverse} />
                </View>
              </View>
              <Text style={styles.completeAllTitle}>
                {`Completing... ${completedCount}/${completingTotal}`}
              </Text>
              <View style={styles.progressBarOuter}>
                <Animated.View
                  style={[
                    styles.progressBarInner,
                    {
                      width: completeProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Task Notes Modal */}
        <TaskCompletionModal
          visible={showNotesModal}
          task={selectedTask}
          taskNotes={taskNotes}
          productUsed={productUsed}
          isCompleting={isCompletingTask}
          plantName={selectedTask ? getPlantDetails(selectedTask.plant_id).name : ''}
          styles={styles}
          bottomInset={insets.bottom}
          onChangeNotes={(text) => setTaskNotes(sanitizeAlphaNumericSpaces(text))}
          onChangeProduct={(text) => setProductUsed(sanitizeAlphaNumericSpaces(text))}
          onClose={() => setShowNotesModal(false)}
          onConfirm={confirmTaskComplete}
        />

        {/* Task Detail Bottom Sheet */}
        {showTaskDetail &&
          detailTask &&
          (() => {
            const dp = getPlantDetails(detailTask.plant_id);
            const dueDateObj = new Date(detailTask.next_due_at);
            const todayS = new Date();
            todayS.setHours(0, 0, 0, 0);
            const isOverdueDetail = dueDateObj < todayS;
            const daysOverdue = isOverdueDetail
              ? Math.floor((todayS.getTime() - dueDateObj.getTime()) / 86400000)
              : null;
            const plantObj = detailTask.plant_id ? plantMap.get(detailTask.plant_id) : undefined;
            const effPriority =
              detailTask.priority_level || calculateTaskPriority(detailTask, plantObj || null);
            const priorityLabels: Record<string, string> = {
              critical: '⚠ Critical',
              high: '↑ High',
              medium: '• Medium',
              low: '↓ Low',
            };
            const priorityColorMap: Record<string, string> = {
              critical: theme.error,
              high: theme.warning,
              medium: theme.info,
              low: theme.border,
            };
            const detailBlocked = isEarlyCompletionBlocked(detailTask);
            const detailSkipBlocked = isSkipBlocked(detailTask);
            const closeDetail = (): void => {
              setShowTaskDetail(false);
              setDetailTask(null);
            };
            return (
              <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={closeDetail} />
                <View
                  style={[
                    styles.taskDetailSheet,
                    { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) },
                  ]}
                >
                  <SheetHandle onClose={closeDetail} />
                  <View style={styles.taskDetailHeader}>
                    <Text
                      style={[
                        styles.taskDetailEmoji,
                        { backgroundColor: TASK_COLORS[detailTask.task_type] + '18' },
                      ]}
                    >
                      {TASK_EMOJIS[detailTask.task_type]}
                    </Text>
                    <View style={styles.taskDetailTitleBlock}>
                      <Text style={styles.taskDetailTitle}>
                        {TASK_LABELS[detailTask.task_type]}
                      </Text>
                      <Text style={styles.taskDetailSubtitle}>
                        {dp.name}
                        {dp.location ? ` · ${dp.location}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.taskDetailBody}>
                    <View style={styles.taskDetailRow}>
                      <Text style={styles.taskDetailLabel}>Frequency</Text>
                      <Text style={styles.taskDetailValue}>
                        Every {detailTask.frequency_days} day
                        {detailTask.frequency_days !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    {detailTask.preferred_time && (
                      <View style={styles.taskDetailRow}>
                        <Text style={styles.taskDetailLabel}>Preferred Time</Text>
                        <Text style={styles.taskDetailValue}>
                          {detailTask.preferred_time === 'morning'
                            ? '🌅 Morning'
                            : detailTask.preferred_time === 'afternoon'
                            ? '☀️ Afternoon'
                            : '🌙 Evening'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.taskDetailRow}>
                      <Text style={styles.taskDetailLabel}>Due</Text>
                      <Text
                        style={[styles.taskDetailValue, isOverdueDetail && { color: theme.error }]}
                      >
                        {isOverdueDetail
                          ? daysOverdue === 0
                            ? 'Today'
                            : `${daysOverdue}d overdue`
                          : dueDateObj.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                      </Text>
                    </View>
                    <View style={styles.taskDetailRow}>
                      <Text style={styles.taskDetailLabel}>Priority</Text>
                      <Text
                        style={[styles.taskDetailValue, { color: priorityColorMap[effPriority] }]}
                      >
                        {priorityLabels[effPriority]}
                      </Text>
                    </View>
                    {detailTask.last_skipped_at && (
                      <View style={styles.taskDetailRow}>
                        <Text style={styles.taskDetailLabel}>
                          Skipped
                          {(detailTask.skip_count ?? 0) > 1 ? ` ×${detailTask.skip_count}` : ''}
                        </Text>
                        <Text style={[styles.taskDetailValue, styles.taskDetailValueSkip]}>
                          {new Date(detailTask.last_skipped_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {detailTask.last_skip_reason ? ` · ${detailTask.last_skip_reason}` : ''}
                        </Text>
                      </View>
                    )}
                    {detailBlocked && (
                      <View style={styles.taskDetailRow}>
                        <Text style={styles.taskDetailLabel}>Not due yet</Text>
                        <Text style={[styles.taskDetailValue, styles.taskDetailValueSkip]}>
                          {EARLY_COMPLETION_BLOCK_REASON[detailTask.task_type]}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.taskDetailActions}>
                    <TouchableOpacity
                      style={[
                        styles.taskDetailActionBtn,
                        detailBlocked
                          ? styles.taskDetailActionBtnDisabled
                          : { backgroundColor: theme.success },
                      ]}
                      onPress={handleDetailComplete}
                      disabled={detailBlocked}
                    >
                      <Ionicons
                        name={detailBlocked ? 'ban-outline' : 'checkmark'}
                        size={16}
                        color={detailBlocked ? theme.textTertiary : theme.textInverse}
                      />
                      <Text
                        style={[
                          styles.taskDetailActionBtnText,
                          detailBlocked && styles.taskDetailActionBtnTextDisabled,
                        ]}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.taskDetailActionBtn,
                        detailSkipBlocked
                          ? styles.taskDetailActionBtnDisabled
                          : { backgroundColor: theme.warning },
                      ]}
                      onPress={handleDetailSkip}
                      disabled={detailSkipBlocked}
                    >
                      <Ionicons
                        name={detailSkipBlocked ? 'ban-outline' : 'play-skip-forward'}
                        size={16}
                        color={detailSkipBlocked ? theme.textTertiary : theme.textInverse}
                      />
                      <Text
                        style={[
                          styles.taskDetailActionBtnText,
                          detailSkipBlocked && styles.taskDetailActionBtnTextDisabled,
                        ]}
                      >
                        Skip
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })()}

        <SkipTaskModal
          visible={showSkipModal}
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
