/**
 * Needs-action items — pairs each Today-screen exception with where it is.
 *
 * The alert itself carries only a plant or bed id, so a row built straight from
 * it reads "Tomato · Marked sick" with no way to tell which plot card above it
 * belongs to. `groupByPlot` has already resolved every alert to a plot; this
 * consumes `PlotGroup.alerts` rather than re-deriving that join, and turns the
 * ids into the one line a grower actually needs: which plot, and which bed
 * inside it.
 *
 * Pure — no React Native, no Firestore — so it is directly unit-testable.
 */

import { FarmAlert, NeedsActionItem, Plant } from '@/types/database.types';
import { sortAlerts } from '@/services/alertsLogic';
import { parseLocation } from '@/utils/locationHelpers';
import { PlotGroup } from '@/utils/plotGrouping';

export interface NeedsActionInput {
  /** Groups from `groupByPlot`, already partitioned and in card order. */
  groups: readonly PlotGroup[];
  plantsById: ReadonlyMap<string, Plant>;
  /** bedId → display name, as the alerts service was given. */
  bedNames: Record<string, string>;
}

/**
 * The bed or section an alert sits in. A bed alert names its bed directly; a
 * plant alert prefers the section written into its own location string (which
 * is what the grower typed) and falls back to its bed's name.
 */
function resolvePlace(
  alert: FarmAlert,
  plantsById: ReadonlyMap<string, Plant>,
  bedNames: Record<string, string>
): string {
  if (alert.bedId) return bedNames[alert.bedId] ?? '';

  const plant = alert.plantId ? plantsById.get(alert.plantId) : undefined;
  if (!plant) return '';

  const { child } = parseLocation(plant.location);
  if (child) return child;
  return plant.bed_id ? bedNames[plant.bed_id] ?? '' : '';
}

/**
 * Flattens the per-plot groups back into one urgency-sorted list, each item
 * labelled with where it is.
 *
 * Grouping destroys the global ordering `getFarmAlerts` established, so the
 * result is re-sorted with the same comparator rather than left in plot order —
 * the queue is read top-down for the next thing to do.
 *
 * The plot segment is dropped on a single-plot farm: repeating one name on
 * every row is noise, and the plot card above already says it.
 */
export function buildNeedsActionItems(input: NeedsActionInput): NeedsActionItem[] {
  const { groups, plantsById, bedNames } = input;
  const showPlotName = groups.length > 1;

  const whereById = new Map<string, string>();
  const alerts: FarmAlert[] = [];

  for (const group of groups) {
    for (const alert of group.alerts) {
      const place = resolvePlace(alert, plantsById, bedNames);
      const segments = [...(showPlotName ? [group.name] : []), ...(place ? [place] : [])];
      whereById.set(alert.id, segments.join(' · '));
      alerts.push(alert);
    }
  }

  return sortAlerts(alerts).map((alert) => ({
    alert,
    where: whereById.get(alert.id) ?? '',
  }));
}
