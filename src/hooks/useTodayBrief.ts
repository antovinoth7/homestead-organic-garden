/**
 * useTodayBrief — assembles everything the Today screen renders.
 *
 * The screen consumes one `TodayBrief` and composes blocks; all the joining,
 * counting and wording happens here on top of pure utils. That keeps the screen
 * free of service imports and keeps the logic testable.
 *
 * Cache-first paint is preserved from the previous inline implementation: the
 * local caches paint first, then the network revalidates silently.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bed,
  PlantNowRecommendation,
  PlantProfile,
  PlantType,
  PlotBrief,
  TodayBrief,
} from '@/types/database.types';
import { getMonthlyHighlight } from '@/config/almanac';
import { getKanyakumariPlantingWindows } from '@/config/kanyakumariPlantingCalendar';
import { getFarmAlerts, isActionable } from '@/services/alerts';
import { getCrossBedStatus, getHarvestGapWarnings } from '@/services/beds';
import { createEmptyProfiles, getProfileEntry } from '@/services/plantProfiles';
import { getSeasonalCareReminder } from '@/services/tasks';
import {
  getStoredTodayBriefSources,
  getTodayBriefSources,
  TodayBriefSources,
} from '@/services/todayBrief';
import { resolveWeatherCoords, WEATHER_FRESH_MS } from '@/services/weather';
import { useWeatherByPlot } from '@/hooks/useWeatherByPlot';
import { useWeatherLocations, WeatherPlot } from '@/hooks/useWeatherLocations';
import { getErrorMessage } from '@/utils/errorLogging';
import { locationKey } from '@/utils/locationHelpers';
import { buildNeedsActionItems } from '@/utils/needsActionItems';
import { filterPotAndGround, getPlantHealthSummary } from '@/utils/plantHealth';
import { isPlantArchived } from '@/utils/plantHelpers';
import { getPerennialCareBrief } from '@/utils/perennialCare';
import { countBedLifecycles } from '@/utils/plotBedCounts';
import { buildPlotBriefLine } from '@/utils/plotBriefLine';
import { groupByPlot } from '@/utils/plotGrouping';
import { getSeasonProgress } from '@/utils/seasonProgress';
import { toPlantNowChips } from '@/utils/sowNowChips';
import { countRemaining, summarizeTasksByPlot, summarizeTodayTasks } from '@/utils/taskSummary';
import { countJobsByDate, formatJobText } from '@/utils/upcomingJobs';
import { describeDay, FARM_TIMEZONE, selectForecastDays } from '@/utils/weatherWords';

/** Chips shown before the row defers to "All N ›". */
export interface UseTodayBriefResult {
  /** Never null — zeroed while loading, so the screen needs no null branch. */
  brief: TodayBrief;
  /** True only on a cold start with nothing cached to paint. */
  loading: boolean;
  error: string | null;
  reload: (options?: { silent?: boolean; forceWeather?: boolean }) => Promise<void>;
  /** Force-refresh one plot from the forecast overlay. */
  refreshWeatherFor: (plotId: string) => Promise<void>;
  /** Forecast-date → job text for one plot, for the forecast overlay's rows. */
  jobsByDateFor: (plotId: string) => ReadonlyMap<string, string>;
}

/** Matches the service's own default so a pre-load render is coherent, not blank. */
const EMPTY_SOURCES: TodayBriefSources = {
  tasks: [],
  logs: [],
  allTemplates: [],
  plants: [],
  beds: [],
  locationConfig: { parentLocations: [], childLocations: [] },
  farmConfig: { families_count: 1, goals: ['self_sufficiency'] },
  profiles: createEmptyProfiles(),
};

/**
 * "Friday, 31 July" — en-GB puts the day before the month, as the design does.
 * The weekday is formatted separately because `toLocaleDateString` runs the
 * three parts together without the comma.
 */
function formatDateLabel(date: Date): string {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `${weekday}, ${day}`;
}

export function useTodayBrief(): UseTodayBriefResult {
  const [sources, setSources] = useState<TodayBriefSources>(EMPTY_SOURCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const { plots: configuredWeatherPlots, loading: weatherLocationsLoading } = useWeatherLocations();

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (isMountedRef.current && !options?.silent) setLoading(true);
    try {
      const next = await getTodayBriefSources();
      if (!isMountedRef.current) return;
      setSources(next);
      setError(null);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      if (!options?.silent) setError(getErrorMessage(err));
    } finally {
      if (isMountedRef.current && !options?.silent) setLoading(false);
    }
  }, []);

  // Paint whatever the caches hold before the network resolves, so a cold start
  // isn't blocked behind Firestore. Returns true when it painted real data.
  const hydrateFromCache = useCallback(async (): Promise<boolean> => {
    try {
      const stored = await getStoredTodayBriefSources();
      if (!isMountedRef.current || !stored) return false;
      setSources(stored);
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
      // Painted already → revalidate silently; otherwise let `load` drive the
      // skeleton for a true first-ever launch.
      await load({ silent: painted });
    })();
    return () => {
      isMountedRef.current = false;
    };
  }, [hydrateFromCache, load]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const { tasks, logs, allTemplates, plants, beds, locationConfig, farmConfig, profiles } =
    sources;
  const district = farmConfig.district ?? null;

  const plantsByBedId = useMemo(() => {
    const map: Record<string, typeof plants> = {};
    for (const plant of plants) {
      if (plant.is_deleted || !plant.bed_id) continue;
      (map[plant.bed_id] ??= []).push(plant);
    }
    return map;
  }, [plants]);

  const bedNames = useMemo(() => Object.fromEntries(beds.map((b) => [b.id, b.name])), [beds]);

  // `PlotGroup` carries bed ids, not beds; the plot line needs the records
  // themselves for their `last_*` dates.
  const bedsById = useMemo(() => new Map(beds.map((b) => [b.id, b])), [beds]);

  const plantsById = useMemo(() => new Map(plants.map((p) => [p.id, p])), [plants]);

  // "Empty" means no *active* plants, matching `BedWithCoverage.active_plant_count`
  // that the previous screen passed here.
  const emptyOrRestingBedCount = useMemo(
    () =>
      beds.filter((bed) => {
        if (bed.is_resting) return true;
        const bedPlants = plantsByBedId[bed.id] ?? [];
        return bedPlants.every((plant) => isPlantArchived(plant));
      }).length,
    [beds, plantsByBedId]
  );

  // Same inputs the previous screen fed the alerts service, so what counts as
  // "needs action" is unchanged by this redesign.
  const farmAlerts = useMemo(
    () =>
      getFarmAlerts({
        plants,
        todayTasks: tasks,
        rotationStatuses: getCrossBedStatus(beds, plantsByBedId),
        harvestGapWarnings: getHarvestGapWarnings(beds),
        bedNames,
        emptyOrRestingBedCount,
      }),
    [plants, tasks, beds, plantsByBedId, bedNames, emptyOrRestingBedCount]
  );

  // Exceptions only: routine scheduled work is stated by the plot cards' due /
  // overdue counts, so anything with a task behind it is filtered out here
  // rather than counted twice under two different rules. See `isActionable`.
  const exceptions = useMemo(() => farmAlerts.filter(isActionable), [farmAlerts]);

  const grouping = useMemo(
    () =>
      groupByPlot({
        parentLocations: locationConfig.parentLocations ?? [],
        fallbackName: district ?? 'My Farm',
        plants,
        beds,
        tasks,
        logs,
        alerts: exceptions,
      }),
    [locationConfig.parentLocations, district, plants, beds, tasks, logs, exceptions]
  );

  // The grouping is what knows which plot each exception sits on — reuse it
  // instead of resolving plant/bed ids a second time.
  const needsAction = useMemo(
    () => buildNeedsActionItems({ groups: grouping.groups, plantsById, bedNames }),
    [grouping.groups, plantsById, bedNames]
  );

  // Unassigned/unrecognised groups must use a district/default reading rather
  // than silently borrowing the first configured plot's GPS pin.
  const fallbackWeatherPlot = useMemo<WeatherPlot>(
    () => ({ name: '__weather_fallback__', ...resolveWeatherCoords(undefined, district) }),
    [district]
  );

  const weatherPlots = useMemo(() => {
    if (weatherLocationsLoading) return [];
    const configuredKeys = new Set(configuredWeatherPlots.map((plot) => locationKey(plot.name)));
    const needsFallback = grouping.groups.some(
      (group) => !configuredKeys.has(locationKey(group.name))
    );
    return needsFallback
      ? [...configuredWeatherPlots, fallbackWeatherPlot]
      : configuredWeatherPlots;
  }, [configuredWeatherPlots, fallbackWeatherPlot, grouping.groups, weatherLocationsLoading]);

  const {
    byPlotName,
    loading: weatherLoading,
    refresh: refreshWeather,
  } = useWeatherByPlot(weatherPlots);

  /** Plot name → its weather plot, matched case-insensitively on the free text. */
  const weatherPlotByKey = useMemo(() => {
    const map = new Map<string, WeatherPlot>();
    for (const plot of configuredWeatherPlots) map.set(locationKey(plot.name), plot);
    return map;
  }, [configuredWeatherPlots]);

  const plotBriefs = useMemo<PlotBrief[]>(() => {
    const summaries = summarizeTasksByPlot(grouping.groups);

    return grouping.groups.map((group) => {
      const summary = summaries.get(group.id);
      // Pots and ground only: the card's crop and health figures must equal
      // what the plant list shows when one is tapped. Bed plants are counted by
      // `bedCount`, which routes to the Beds tab.
      const potPlants = filterPotAndGround(group.plants);
      // `PlotGroup` carries bed ids; both the bed strip's tally and the context
      // line need the records themselves, so resolve them once.
      const plotBeds = group.bedIds
        .map((id) => bedsById.get(id))
        .filter((bed): bed is Bed => bed !== undefined);
      // Buckets with no configured plot use the explicit district/default
      // request above. They never borrow another plot's private GPS forecast.
      const matched = weatherPlotByKey.get(locationKey(group.name));
      const weatherPlot = matched ?? fallbackWeatherPlot;
      const forecast = weatherPlot ? byPlotName.get(weatherPlot.name) ?? null : null;
      const today = selectForecastDays(forecast).today;
      const description = describeDay(today);
      const fetchedAt = forecast?.fetched_at ?? null;

      return {
        id: group.id,
        name: group.name,
        isConfigured: group.isConfigured,
        district,
        cropCount: potPlants.length,
        bedCount: group.bedIds.length,
        bedStatus: countBedLifecycles(plotBeds, plantsByBedId),
        dueCount: summary?.todayTasks.length ?? 0,
        overdueCount: summary?.overdueCount ?? 0,
        health: getPlantHealthSummary(potPlants),
        // Scoped to the whole plot, not just its pots and ground: "what is
        // going on here" has to account for the beds too, which the counts
        // above deliberately exclude.
        line: buildPlotBriefLine({
          summary,
          forecast,
          plants: group.plants,
          beds: plotBeds,
          bedNames,
          plantsById,
        }),
        weather: {
          lat: weatherPlot?.lat ?? 0,
          lng: weatherPlot?.lng ?? 0,
          source: weatherPlot.source,
          forecast,
          today,
          condition: description.id,
          conditionLabel: description.label,
          conditionIconKey: description.iconKey,
          fetched_at: fetchedAt,
          stale: fetchedAt ? Date.now() - new Date(fetchedAt).getTime() > WEATHER_FRESH_MS : false,
          // Covers revalidation, not just the cold fetch: the overlay's stale
          // banner only exists when a forecast is already painted, so gating
          // this on `forecast === null` left its Retry with no feedback at all.
          loading: weatherLoading,
        },
      };
    });
  }, [
    grouping,
    weatherPlotByKey,
    fallbackWeatherPlot,
    byPlotName,
    weatherLoading,
    district,
    bedsById,
    bedNames,
    plantsById,
    plantsByBedId,
  ]);

  const totals = useMemo(() => summarizeTodayTasks(tasks, logs), [tasks, logs]);
  const season = useMemo(() => getSeasonProgress(), []);
  const month = useMemo(() => getMonthlyHighlight(), []);

  // Only the district we hold a reviewed calendar for. Everywhere else the card
  // says so rather than rendering an unexplained gap.
  const hasPlantingCalendar = district?.trim().toLowerCase() === 'kanyakumari';

  const windows = useMemo(
    () => (hasPlantingCalendar ? getKanyakumariPlantingWindows() : null),
    [hasPlantingCalendar]
  );

  // Bound to the loaded profiles so `sowNowChips` stays a pure util with no
  // service import. Falls through to the default catalog for crops the grower
  // has never customised, which is most of them.
  const lookupProfile = useCallback(
    (plantType: PlantType, name: string): PlantProfile | undefined =>
      getProfileEntry(profiles, plantType, name),
    [profiles]
  );

  const plantNow = useMemo<PlantNowRecommendation[]>(() => {
    if (!windows) return [];
    const closingKeys = new Set(
      windows.closing.map((entry) => `${entry.plantType}:${entry.variety}`)
    );
    return toPlantNowChips(windows.current, {
      lookup: lookupProfile,
      closingKeys,
    });
  }, [windows, lookupProfile]);

  // Names only — next month's crops are context for planning, not tiles to act
  // on today, so they get one line and no artwork.
  const openingNext = useMemo(
    () => (windows ? [...new Set(windows.openingNext.map((entry) => entry.variety))] : []),
    [windows]
  );

  const perennialCare = useMemo(
    () => getPerennialCareBrief(plants, season.seasonId),
    [plants, season.seasonId]
  );

  // One closing line: prefer an informational alert (e.g. a seasonal pest note),
  // else a season-specific care reminder from the first plant that has one.
  //
  // `bed_resting_end` (the green-manure suggestion) is deliberately excluded and
  // has no fallback here — it is not wanted on this screen. `getFarmAlerts`
  // still emits it; nothing renders it, which is the intended state.
  //
  // The title travels with the message so the card can head it. An alert names
  // the thing it is about ("Anthracnose risk"); the plant-reminder fallback has
  // no such name, so it gets a generic one.
  const seasonTip = useMemo<{ title: string; message: string }>(() => {
    const info = farmAlerts.find((a) => a.severity === 'info' && a.type !== 'bed_resting_end');
    if (info) return { title: info.title, message: info.message };
    for (const plant of plants) {
      const tip = getSeasonalCareReminder(plant);
      if (tip) return { title: 'Seasonal care', message: tip };
    }
    return { title: '', message: '' };
  }, [farmAlerts, plants]);

  const brief = useMemo<TodayBrief>(
    () => ({
      dateLabel: formatDateLabel(new Date()),
      remainingTasks: countRemaining(totals),
      needActionCount: needsAction.length,
      plots: plotBriefs,
      needsAction,
      season,
      seasonNote: month.note,
      seasonTip: seasonTip.message,
      seasonTipTitle: seasonTip.title,
      district,
      plantNow,
      openingNext,
      perennialCare,
    }),
    [
      totals,
      needsAction,
      plotBriefs,
      season,
      month.note,
      seasonTip,
      district,
      plantNow,
      openingNext,
      perennialCare,
    ]
  );

  // The same set `summarizeTodayTasks` builds internally, so the overlay's day
  // counts and the plot card's due count subtract completed work identically.
  const completedTemplateIds = useMemo(
    () => new Set(logs.map((log) => log.template_id)),
    [logs]
  );

  const jobsByDateFor = useCallback(
    (plotId: string): ReadonlyMap<string, string> => {
      const plot = plotBriefs.find((p) => p.id === plotId);
      const forecast = plot?.weather.forecast ?? null;
      // Only the days the overlay actually renders. `countJobsByDate` folds
      // overdue work onto the first date it is given, so passing the raw
      // `daily` array parked it on a past row that is filtered out before paint.
      const dates = selectForecastDays(forecast).available.map((d) => d.date);
      const counts = countJobsByDate(allTemplates, grouping.resolveTaskPlotId, plotId, dates, {
        timeZone: forecast?.timezone ?? FARM_TIMEZONE,
        completedTemplateIds,
      });
      const text = new Map<string, string>();
      for (const date of dates) text.set(date, formatJobText(counts.get(date)));
      return text;
    },
    [plotBriefs, allTemplates, grouping, completedTemplateIds]
  );

  const reload = useCallback(
    async (options?: { silent?: boolean; forceWeather?: boolean }) => {
      await Promise.all([load(options), refreshWeather({ force: options?.forceWeather })]);
    },
    [load, refreshWeather]
  );

  const refreshWeatherFor = useCallback(
    async (plotId: string) => {
      const group = grouping.groups.find((candidate) => candidate.id === plotId);
      const matched = group ? weatherPlotByKey.get(locationKey(group.name)) : null;
      const target = (matched ?? fallbackWeatherPlot).name;
      // Naming a plot the weather hook is not tracking makes it a silent no-op,
      // which would leave the overlay's Retry doing nothing. Refresh the lot
      // instead — one wasted request beats a dead button.
      const tracked = weatherPlots.some((plot) => plot.name === target);
      await refreshWeather({ force: true, plotName: tracked ? target : undefined });
    },
    [fallbackWeatherPlot, grouping.groups, refreshWeather, weatherPlotByKey, weatherPlots]
  );

  return { brief, loading, error, reload, refreshWeatherFor, jobsByDateFor };
}
