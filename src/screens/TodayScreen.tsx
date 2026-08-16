/**
 * TodayScreen — the daily operations brief.
 *
 * Four blocks: what today weighs (the sentence header), how each plot stands,
 * what needs a decision, and where the season has got to. Anything that belongs
 * to another tab lives in that tab; this screen answers "what do I do today, and
 * where" and then gets out of the way.
 *
 * The plot cards and the needs-action list divide the work between them and do
 * not overlap: the cards state *how much* scheduled work each plot owes, and the
 * list names the exceptions no count can express — a sick crop, a rotation
 * conflict, a harvest window — each with the plot it is on. Routine overdue work
 * is a number here and a list in the Care Plan, never both.
 *
 * All the joining and counting happens in `useTodayBrief` — this file composes
 * blocks, owns navigation, and owns whether the forecast overlay is open.
 *
 * The list is a FlatList because the needs-action list is unbounded: a farm
 * with enough plants routinely produces more rows than a ScrollView should
 * hold. The plot cards ride in the header — as a swipeable rail once there is
 * more than one of them, see `PlotCarousel` — which must stay a memoized
 * element or it remounts every time an alert changes, taking the rail's scroll
 * position with it.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeedsActionItem, PlantType, PlotBrief } from '@/types/database.types';
import { BedLifecycle } from '@/utils/bedStatus';
import { TodayScreenNavigationProp, TodayScreenRouteProp } from '@/types/navigation.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/todayScreenStyles';
import { useTodayBrief } from '@/hooks/useTodayBrief';
import { useTabBarScroll, TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { TodayHeader } from '@/components/today/TodayHeader';
import { PlotHealthFilter } from '@/components/today/PlotCard';
import { PlotCarousel } from '@/components/today/PlotCarousel';
import { NeedsActionRow } from '@/components/today/NeedsActionRow';
import { SeasonBlock } from '@/components/today/SeasonBlock';
import { ForecastOverlay } from '@/components/today/ForecastOverlay';

export default function TodayScreen(): React.JSX.Element {
  const navigation = useNavigation<TodayScreenNavigationProp>();
  const route = useRoute<TodayScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<NeedsActionItem>>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();

  const { brief, loading, error, reload, refreshWeatherFor, jobsByDateFor } = useTodayBrief();
  const [forecastPlotId, setForecastPlotId] = useState<string | null>(null);

  const openPlot = useMemo<PlotBrief | null>(
    () => brief.plots.find((plot) => plot.id === forecastPlotId) ?? null,
    [brief.plots, forecastPlotId]
  );

  // Refresh param, e.g. after completing work in another tab.
  useEffect(() => {
    if (route.params?.refresh) {
      void reload();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params, navigation, reload]);

  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      resetTabBar();
      void reload({ silent: true });
      // Leaving the tab with the overlay open would strand the user on a
      // forecast when they came back.
      return () => setForecastPlotId(null);
    }, [reload, resetTabBar])
  );

  // ─── Navigation ────────────────────────────────────────────────────────────

  const goToCarePlan = useCallback(
    () => navigation.navigate('Care Plan', { resetFilters: true }),
    [navigation]
  );

  // The header flag counts exceptions, not overdue tasks — sending it to the
  // Care Plan's overdue filter would open a list that does not contain them.
  // Reveal the section it counts instead.
  //
  // Scrolls by measured offset rather than `scrollToIndex`: the first row sits
  // below a tall header, so it is often not laid out yet and the index call
  // would fail. `onLayout` on the section heading is measured either way.
  //
  // `layout.y` is relative to the parent, so the heading has to stay a direct
  // child of the list header's root view for this to be a list offset.
  const sectionYRef = useRef(0);
  const handleSectionLayout = useCallback((e: LayoutChangeEvent) => {
    sectionYRef.current = e.nativeEvent.layout.y;
  }, []);

  const goToNeedsAction = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: sectionYRef.current, animated: true });
  }, []);

  const handleAlertPress = useCallback(
    ({ alert }: NeedsActionItem) => {
      if (alert.plantId) {
        navigation.navigate('Plants', {
          screen: 'PlantDetail',
          params: { plantId: alert.plantId },
        });
      } else if (alert.bedId) {
        navigation.navigate('Beds', { screen: 'BedDetail', params: { bedId: alert.bedId } });
      } else {
        // Farm-level alert — the bed list is where it can be acted on.
        navigation.navigate('Beds', { screen: 'BedList' });
      }
    },
    [navigation]
  );

  const handlePressPlot = useCallback(() => goToCarePlan(), [goToCarePlan]);
  const handlePressWeather = useCallback((plotId: string) => setForecastPlotId(plotId), []);
  const closeForecast = useCallback(() => setForecastPlotId(null), []);
  const retryForecast = useCallback(() => {
    if (forecastPlotId) void refreshWeatherFor(forecastPlotId);
  }, [forecastPlotId, refreshWeatherFor]);
  const handleRefresh = useCallback(() => {
    void reload({ forceWeather: true });
  }, [reload]);

  // The no-beds tile's "Add a bed" link — the one place a card opens the Beds tab
  // without saying which beds it means.
  const goToBeds = useCallback(
    () => navigation.navigate('Beds', { screen: 'BedList' }),
    [navigation]
  );

  // A season suggestion is a crop the farm does not have yet, so it has no
  // plant record to open — the catalog entry is where its spacing, depth and
  // days to harvest are, which is what the tile's figures are quoting from.
  const goToCatalogEntry = useCallback(
    (plantName: string, plantType: PlantType) => {
      navigation.navigate('More', {
        screen: 'CatalogPlantDetail',
        params: { plantName, plantType },
      });
    },
    [navigation]
  );

  const goToMyFarm = useCallback(
    () => navigation.navigate('More', { screen: 'MyFarm' }),
    [navigation]
  );

  // The health counts open the plant list filtered to that status *and* scoped
  // to the plot that was tapped, so the list holds exactly the plants the count
  // named. Both land in the list's own filter sheet, where they are visible and
  // clearable. The card counts pots and ground because that is the segment the
  // list opens on.
  const handlePressHealth = useCallback(
    (plotId: string, healthFilter: PlotHealthFilter) => {
      navigation.navigate('Plants', {
        screen: 'PlantsList',
        params: { healthFilter, plotFilter: plotId },
      });
    },
    [navigation]
  );

  // The bed counts do the same into the Beds tab: the lifecycle tapped, scoped to
  // the plot that was tapped.
  //
  // With no plots configured there is one card, and it is named after the district
  // rather than after anything a bed is filed under — scoping by its id would open
  // an empty list, so the whole list is the honest answer there. Configured plots
  // and the unassigned bucket both resolve against `Bed.parent_location`.
  const plotsAreConfigured = useMemo(
    () => brief.plots.some((plot) => plot.isConfigured),
    [brief.plots]
  );

  const handlePressBedStatus = useCallback(
    (plotId: string, lifecycleFilter: BedLifecycle) => {
      navigation.navigate('Beds', {
        screen: 'BedList',
        params: { lifecycleFilter, ...(plotsAreConfigured && { plotFilter: plotId }) },
      });
    },
    [navigation, plotsAreConfigured]
  );

  // ─── List parts ────────────────────────────────────────────────────────────

  const listHeader = useMemo(
    () => (
      <View>
        <TodayHeader
          dateLabel={brief.dateLabel}
          taskCount={brief.remainingTasks}
          needActionCount={brief.needActionCount}
          topInset={insets.top}
          onPressTasks={goToCarePlan}
          onPressNeedAction={goToNeedsAction}
        />

        {error !== null && <Text style={styles.errorText}>{error}</Text>}

        {/* The card rides up onto the green. Suppressed while an error is
            showing, so the card cannot pull up over the message. */}
        <View style={error === null ? styles.plotsLift : null}>
          <PlotCarousel
            plots={brief.plots}
            onPressPlot={handlePressPlot}
            onPressWeather={handlePressWeather}
            onPressHealth={handlePressHealth}
            onPressBedStatus={handlePressBedStatus}
            onPressBeds={goToBeds}
          />
        </View>

        {/* Withheld on an all-clear day: no heading, no empty row. */}
        {brief.needActionCount > 0 && (
          <View style={styles.sectionHeader} onLayout={handleSectionLayout}>
            <Text style={styles.sectionTitle}>Needs action</Text>
            <Text style={styles.sectionCount}>{brief.needActionCount}</Text>
          </View>
        )}
      </View>
    ),
    [
      brief,
      insets.top,
      error,
      styles,
      goToCarePlan,
      goToNeedsAction,
      handleSectionLayout,
      handlePressPlot,
      handlePressWeather,
      handlePressHealth,
      handlePressBedStatus,
      goToBeds,
    ]
  );

  const listFooter = useMemo(
    () => (
      <SeasonBlock
        season={brief.season}
        note={brief.seasonNote}
        seasonIconKey={brief.seasonIconKey}
        tip={brief.seasonTip}
        tipTitle={brief.seasonTipTitle}
        district={brief.district}
        zoneLabel={brief.zoneLabel}
        plantingState={brief.plantingState}
        recommendations={brief.plantNow}
        openingNext={brief.openingNext}
        openingNextLabel={brief.openingNextLabel}
        perennialCare={brief.perennialCare}
        onPressCrop={goToCatalogEntry}
        onPressDistrict={goToMyFarm}
      />
    ),
    [brief, goToCatalogEntry, goToMyFarm]
  );

  const renderItem = useCallback(
    ({ item }: { item: NeedsActionItem }) => (
      <NeedsActionRow item={item} onPress={handleAlertPress} />
    ),
    [handleAlertPress]
  );

  const separator = useCallback(() => <View style={styles.divider} />, [styles]);

  // True first-ever launch: nothing cached, so there is genuinely nothing to paint.
  if (loading && brief.plots.length === 0) {
    return (
      <View style={styles.container}>
        <TodayHeader
          dateLabel={brief.dateLabel}
          taskCount={0}
          needActionCount={0}
          topInset={insets.top}
          onPressTasks={goToCarePlan}
          onPressNeedAction={goToNeedsAction}
        />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading your farm…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        style={styles.list}
        data={brief.needsAction}
        keyExtractor={(item) => item.alert.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ItemSeparatorComponent={separator}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16,
        }}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            progressViewOffset={insets.top}
          />
        }
      />

      {openPlot !== null && (
        <ForecastOverlay
          plotName={openPlot.name}
          district={openPlot.district}
          source={openPlot.weather.source}
          forecast={openPlot.weather.forecast}
          stale={openPlot.weather.stale}
          loading={openPlot.weather.loading}
          jobsByDate={jobsByDateFor(openPlot.id)}
          onRetry={retryForecast}
          onClose={closeForecast}
        />
      )}
    </View>
  );
}
