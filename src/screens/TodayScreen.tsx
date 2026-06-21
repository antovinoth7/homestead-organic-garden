import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  getTodayTasks,
  getTodayTaskLogs,
  getStoredTodayTasks,
  getStoredTodayTaskLogs,
  getSeasonalCareReminder,
} from '../services/tasks';
import { getAllPlants, getStoredPlants } from '../services/plants';
import { TaskTemplate, Plant, TaskLog, FarmAlert } from '../types/database.types';
import { useBedData } from '../hooks/useBedData';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { TodayScreenNavigationProp, TodayScreenRouteProp } from '../types/navigation.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemeMode } from '../theme';
import { createStyles } from '../styles/todayStyles';
import { summarizeTodayTasks, computeDonutSegments, filterToKnownPlants } from '../utils/taskSummary';
import { useTabBarScroll, TAB_BAR_HEIGHT } from '../components/FloatingTabBar';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';
import { getErrorMessage } from '../utils/errorLogging';
import { getDaysToSWMonsoon, getPreMonsoonTasks } from '../utils/preMonsoonTasks';
import { getSeasonalCareRhythm } from '../config/organicInputs/seasonalAdaptations';
import { getSeasonLabel } from '../utils/seasonHelpers';
import { getPlantHealthSummary } from '../utils/plantHealth';
import { getFarmAlerts, isActionable } from '../services/alerts';
import { getHarvestGapWarnings } from '../services/beds';
import { useCrossBedStatus } from '../hooks/useCrossBedStatus';
import { useFarmCapacity } from '../hooks/useFarmCapacity';
import { NeedsAttentionScroll } from '../components/NeedsAttentionScroll';
import { WeatherCard } from '../components/WeatherCard';
import { PlantNowSection } from '../components/PlantNowSection';
import { AlmanacHighlight } from '../components/AlmanacHighlight';
import { InputReminderStrip } from '../components/InputReminderStrip';
import { FarmHealthCard } from '../components/FarmHealthCard';
import { TodayProgressCard } from '../components/TodayProgressCard';
import { BedsQuickScroll } from '../components/BedsQuickScroll';
import { TipStrip } from '../components/TipStrip';
import type { BedWithCoverage } from '../hooks/useBedData';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const THEME_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  light: { icon: 'sunny', label: 'Light' },
  dark: { icon: 'moon', label: 'Dark' },
  system: { icon: 'phone-portrait-outline', label: 'Auto' },
};

export default function TodayScreen(): React.JSX.Element {
  const navigation = useNavigation<TodayScreenNavigationProp>();
  const route = useRoute<TodayScreenRouteProp>();
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const isMountedRef = React.useRef(true);
  const { beds: bedList } = useBedData();

  // Seasonal guidance (rhythm + jeevamrutha + almanac) is collapsed by default
  // to keep the daily-value cards above the fold and reduce dashboard clutter.
  const [seasonalExpanded, setSeasonalExpanded] = useState(false);
  const toggleSeasonal = useCallback(() => setSeasonalExpanded((prev) => !prev), []);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  // Pre-monsoon prep card — shown within 21 days of monsoon onset, dismissible per day
  const [preMonsoonDismissed, setPreMonsoonDismissed] = useState(false);
  useEffect(() => {
    safeGetItem('premonsoon_card_dismissed_date').then((stored) => {
      const today = new Date().toDateString();
      if (stored === today) setPreMonsoonDismissed(true);
    });
  }, []);
  const dismissPreMonsoon = useCallback(async () => {
    setPreMonsoonDismissed(true);
    await safeSetItem('premonsoon_card_dismissed_date', new Date().toDateString());
  }, []);

  const daysToMonsoon = useMemo(() => getDaysToSWMonsoon(), []);
  const preMonsoonTasks = useMemo(() => getPreMonsoonTasks(daysToMonsoon), [daysToMonsoon]);
  const seasonRhythm = useMemo(() => getSeasonalCareRhythm(), []);
  const seasonLabel = useMemo(() => getSeasonLabel(), []);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (isMountedRef.current && !options?.silent) {
      setLoading(true);
    }
    try {
      const [tasksData, plantsData, todayLogs] = await Promise.all([
        getTodayTasks(),
        getAllPlants(),
        getTodayTaskLogs(),
      ]);

      if (!isMountedRef.current) return;

      const plantIds = new Set(plantsData.map((plant) => plant.id));
      setTasks(filterToKnownPlants(tasksData, plantIds));
      setPlants(plantsData);
      setTaskLogs(filterToKnownPlants(todayLogs, plantIds));
    } catch (error: unknown) {
      if (!isMountedRef.current) return;
      if (!options?.silent) {
        Alert.alert('Error', getErrorMessage(error));
      }
    } finally {
      if (isMountedRef.current && !options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  // Cold-start fast paint: render whatever is in the local caches before the
  // network resolves, so the dashboard isn't blocked behind Firestore + image
  // resolution. Returns true when it painted real data.
  const hydrateFromCache = useCallback(async (): Promise<boolean> => {
    try {
      const [storedTasks, storedPlants, storedLogs] = await Promise.all([
        getStoredTodayTasks(),
        getStoredPlants(),
        getStoredTodayTaskLogs(),
      ]);
      if (!isMountedRef.current) return false;
      if (storedTasks.length === 0 && storedPlants.length === 0) return false;

      const plantIds = new Set(storedPlants.map((plant) => plant.id));
      setTasks(filterToKnownPlants(storedTasks, plantIds));
      setPlants(storedPlants);
      setTaskLogs(filterToKnownPlants(storedLogs, plantIds));
      setLoading(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void (async () => {
      const painted = await hydrateFromCache();
      // If the cache already painted, revalidate silently (no spinner/alert);
      // otherwise let loadData drive the skeleton for a true first-ever launch.
      await loadData({ silent: painted });
    })();
    return () => {
      isMountedRef.current = false;
    };
  }, [hydrateFromCache, loadData]);

  // Listen for refresh param (e.g., after completing tasks)
  useEffect(() => {
    if (route.params?.refresh) {
      loadData();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params, navigation, loadData]);

  // Reset scroll and do a silent refresh whenever the screen regains focus.
  useFocusEffect(
    React.useCallback(() => {
      // Reset scroll to top
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      resetTabBar();
      void loadData({ silent: true });
    }, [loadData, resetTabBar])
  );

  // Task progress + per-type stats for the donut, pills and on-screen list.
  const taskSummary = useMemo(() => summarizeTodayTasks(tasks, taskLogs), [tasks, taskLogs]);
  const donutSegments = useMemo(() => computeDonutSegments(taskSummary), [taskSummary]);

  // Plant health counts (Garden Health tiles).
  const health = useMemo(() => getPlantHealthSummary(plants), [plants]);

  // Farm-wide alerts now flow through the alerts service (C.10) rather than
  // inline computation. Bed rotation context comes from useCrossBedStatus.
  const { config: farmConfig, metrics: farmMetrics } = useFarmCapacity();
  const { rotationStatuses } = useCrossBedStatus(bedList);
  const bedNames = useMemo(
    () => Object.fromEntries(bedList.map((b) => [b.id, b.name])),
    [bedList]
  );
  const farmAlerts = useMemo(
    () =>
      getFarmAlerts({
        plants,
        rotationStatuses,
        harvestGapWarnings: getHarvestGapWarnings(bedList),
        bedNames,
      }),
    [plants, rotationStatuses, bedList, bedNames]
  );
  const actionableAlerts = useMemo(() => farmAlerts.filter(isActionable), [farmAlerts]);

  const handleAlertPress = useCallback(
    (alert: FarmAlert) => {
      if (alert.plantId) {
        navigation.navigate('Plants', {
          screen: 'PlantDetail',
          params: { plantId: alert.plantId },
        });
      } else if (alert.bedId) {
        navigation.navigate('Beds', {
          screen: 'BedDetail',
          params: { bedId: alert.bedId },
        });
      }
    },
    [navigation]
  );

  const openJeevamruthaRecipe = useCallback(() => {
    navigation.navigate('More', {
      screen: 'InputRecipes',
      params: { initialTab: 'jeevamrutha' },
    });
  }, [navigation]);

  const openAlmanac = useCallback(() => {
    navigation.navigate('More', { screen: 'SeasonalAlmanac' });
  }, [navigation]);

  const handlePressHealth = useCallback(
    (healthFilter: 'healthy' | 'stressed' | 'sick') => {
      navigation.navigate('Plants', { screen: 'PlantsList', params: { healthFilter } });
    },
    [navigation]
  );

  const handlePressBed = useCallback(
    (bed: BedWithCoverage) => {
      navigation.navigate('Beds', { screen: 'BedDetail', params: { bedId: bed.id } });
    },
    [navigation]
  );

  const handleNewBed = useCallback(() => {
    navigation.navigate('Beds', { screen: 'BedCreationWizard' });
  }, [navigation]);

  const cycleTheme = useCallback(() => {
    const order: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(mode);
    setMode(order[(idx + 1) % order.length]!);
  }, [mode, setMode]);

  const goToCarePlan = useCallback(
    () => navigation.navigate('Care Plan', { resetFilters: true }),
    [navigation]
  );
  const goToOverdue = useCallback(
    () => navigation.navigate('Care Plan', { filterOverdue: true }),
    [navigation]
  );
  const goToCarePlanPlain = useCallback(() => navigation.navigate('Care Plan'), [navigation]);

  // Daily tip (C.14): prefer the top informational farm alert (e.g. green
  // manure / pest note), else fall back to a season-specific care reminder.
  const tipText = useMemo(() => {
    const info = farmAlerts.find((a) => !isActionable(a));
    if (info) return info.message;
    for (const plant of plants) {
      const tip = getSeasonalCareReminder(plant);
      if (tip) return tip;
    }
    return null;
  }, [farmAlerts, plants]);

  if (loading && tasks.length === 0 && plants.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.flexOne}>
              <Text style={styles.heroGreeting}>{getGreeting()}</Text>
              <Text style={styles.heroDate}>{todayLabel}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.skeletonCard, styles.skeletonCardTall]} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 }}
      onScroll={onTabBarScroll}
      scrollEventThrottle={16}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      {/* Hero Header */}
      <View style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={styles.flexOne}>
            <Text style={styles.heroGreeting}>{getGreeting()}</Text>
            <Text style={styles.heroDate}>{todayLabel}</Text>
          </View>
          <TouchableOpacity style={styles.heroThemeToggle} onPress={cycleTheme}>
            <Ionicons name={THEME_ICONS[mode]!.icon} size={20} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's progress donut + task-type pills + "Up next" task (C.11) */}
      <TodayProgressCard
        completionRate={taskSummary.completionRate}
        completed={taskSummary.completed}
        totalTasks={taskSummary.totalTasks}
        overdueCount={taskSummary.overdueCount}
        typeStats={taskSummary.typeStats}
        donutSegments={donutSegments}
        onPressRing={goToCarePlan}
        onPressOverdue={goToOverdue}
        onPressType={goToCarePlanPlain}
      />

      {/* Needs Attention — actionable alerts from alerts.ts (C.8/C.10) */}
      <NeedsAttentionScroll alerts={actionableAlerts} onPressAlert={handleAlertPress} />

      {/* Weather (C.3) + What to Plant Now (C.1) */}
      <WeatherCard />
      <PlantNowSection />

      {/* Farm health: header + health tiles + capacity bars (C.7) */}
      <FarmHealthCard
        health={health}
        categoryBreakdown={farmMetrics?.categoryBreakdown}
        bedCount={bedList.length}
        usableSqm={farmMetrics?.usableSqm}
        familiesCount={farmConfig?.families_count}
        onPressHealth={handlePressHealth}
      />

      {/* Bed mini-cards horizontal scroll (C.12) */}
      <BedsQuickScroll beds={bedList} onPressBed={handlePressBed} onNewBed={handleNewBed} />

      {/* Pre-monsoon prep — only within the 21-day window, dismissible per day */}
      {preMonsoonTasks.length > 0 && !preMonsoonDismissed && (
        <View style={styles.preMonsoonCard}>
          <View style={styles.preMonsoonHeader}>
            <Text style={styles.preMonsoonTitle}>
              🌧️ Pre-Monsoon Prep · {daysToMonsoon} day{daysToMonsoon === 1 ? '' : 's'} to monsoon
            </Text>
            <TouchableOpacity
              style={styles.preMonsoonClose}
              onPress={dismissPreMonsoon}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          {preMonsoonTasks.map((task) => (
            <View key={task.id} style={styles.preMonsoonTaskRow}>
              <Text style={styles.preMonsoonTaskIcon}>{task.icon}</Text>
              <View style={styles.preMonsoonTaskText}>
                <Text style={styles.preMonsoonTaskTitle}>{task.title}</Text>
                <Text style={styles.preMonsoonTaskDesc}>{task.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Daily tip strip — dismissible per day (C.14) */}
      <TipStrip tip={tipText} />

      {/* Seasonal guidance — low-frequency cards grouped behind one collapsible
          header (collapsed by default) to keep the dashboard uncluttered:
          season rhythm + jeevamrutha reminder + monthly almanac. */}
      <TouchableOpacity
        style={styles.seasonalToggle}
        onPress={toggleSeasonal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          seasonalExpanded ? 'Collapse seasonal guidance' : 'Expand seasonal guidance'
        }
      >
        <Text style={styles.seasonalToggleText}>🌿 Seasonal guidance</Text>
        <Ionicons
          name={seasonalExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {seasonalExpanded && (
        <>
          {/* Current-season care rhythm */}
          {seasonRhythm !== null && (
            <View style={styles.rhythmCard}>
              <Text style={styles.rhythmTitle}>
                🗓️ This Season&apos;s Rhythm · {seasonLabel}
              </Text>
              <View style={styles.rhythmRow}>
                <Text style={styles.rhythmLabel}>💧 Water</Text>
                <Text style={styles.rhythmValue}>{seasonRhythm.waterInterval}</Text>
              </View>
              <View style={styles.rhythmRow}>
                <Text style={styles.rhythmLabel}>🍂 Mulch</Text>
                <Text style={styles.rhythmValue}>{seasonRhythm.mulchCheck}</Text>
              </View>
              <View style={styles.rhythmRow}>
                <Text style={styles.rhythmLabel}>🧪 Jeevamrutha</Text>
                <Text style={styles.rhythmValue}>{seasonRhythm.jeevamruthaInterval}</Text>
              </View>
            </View>
          )}

          {/* Jeevamrutha batch reminder (C.13) */}
          <InputReminderStrip
            landCents={farmConfig?.land_cents ?? 5}
            bedCount={bedList.length}
            cadenceLabel={seasonRhythm?.jeevamruthaInterval}
            onPress={openJeevamruthaRecipe}
          />

          {/* Monthly almanac highlight (C.4) */}
          <AlmanacHighlight onViewAll={openAlmanac} />
        </>
      )}

      {tasks.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color={theme.success} />
          <Text style={styles.emptyText}>All caught up! 🎉</Text>
          <Text style={styles.emptySubtext}>No tasks due today</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Care Plan')}
          >
            <Text style={styles.emptyButtonText}>View Schedule</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
