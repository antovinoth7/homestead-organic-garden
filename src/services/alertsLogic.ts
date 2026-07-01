/**
 * Farm alert aggregation — pure domain logic (Phase C, C.10).
 *
 * No Firestore / React-Native imports so it can be unit-tested directly. The
 * service wrapper in `alerts.ts` re-exports these for screens/hooks.
 *
 * Consolidates the dashboard "Needs Attention" logic that previously lived
 * inline in `TodayScreen`'s `stats` memo, and extends it with bed-derived
 * rotation/resting alerts and season-aware pest alerts.
 */

import {
  Plant,
  FarmAlert,
  FarmAlertSeverity,
  RotationStatus,
  HarvestGapWarning,
} from '@/types/database.types';
import { getPlantWaterStatus } from '@/utils/plantWatering';
import { getSeasonalPestAlerts } from '@/utils/seasonHelpers';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const SEVERITY_RANK: Record<FarmAlertSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

/** Alert types shown in the actionable "Needs Attention" scroll (C.8). */
const ACTIONABLE_TYPES = new Set<FarmAlert['type']>([
  'harvest_due',
  'water_needed',
  'fertilise_due',
  'trellis_repair',
  'prune_due',
  'rotation_due',
  'bed_resting_end',
  'health_sick',
]);

export interface FarmAlertInputs {
  plants: Plant[];
  /** Cross-bed rotation statuses from `getCrossBedStatus` (optional). */
  rotationStatuses?: RotationStatus[];
  /** Harvest-gap warnings from `getHarvestGapWarnings` (optional). */
  harvestGapWarnings?: HarvestGapWarning[];
  /** Map of bedId → bed display name, for labelling bed alerts. */
  bedNames?: Record<string, string>;
  /** Injectable clock for deterministic tests. */
  now?: number;
}

function daysSince(dateValue: string | null | undefined, now: number): number | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
}

function plural(n: number): string {
  return n === 1 ? '' : 's';
}

/**
 * Aggregate every farm-wide alert from already-loaded data. Pure: callers pass
 * in plants plus (optionally) precomputed bed rotation data. Result is sorted
 * most-urgent-first (severity, then days overdue, then name).
 */
export function getFarmAlerts(inputs: FarmAlertInputs): FarmAlert[] {
  const { plants, rotationStatuses, harvestGapWarnings, bedNames, now = Date.now() } = inputs;
  const nowIso = new Date(now).toISOString();
  const alerts: FarmAlert[] = [];

  const activePlants = plants.filter((p) => !p.is_deleted);

  for (const plant of activePlants) {
    // Health
    if (plant.health_status === 'sick') {
      alerts.push({
        id: `health_sick_${plant.id}`,
        type: 'health_sick',
        plantId: plant.id,
        title: plant.name,
        message: 'Marked sick — needs care',
        severity: 'critical',
        icon: '🤒',
        daysOverdue: 0,
        created_at: nowIso,
      });
    }

    // Water
    const water = getPlantWaterStatus(plant, now);
    if (water.reason === 'overdue' || water.reason === 'due_today') {
      const frequency = Number(plant.watering_frequency_days);
      const high = water.daysOverdue >= Math.max(2, Math.ceil(frequency / 2));
      alerts.push({
        id: `water_${plant.id}`,
        type: 'water_needed',
        plantId: plant.id,
        title: plant.name,
        message:
          water.daysOverdue > 0
            ? `Watering overdue by ${water.daysOverdue} day${plural(water.daysOverdue)}`
            : 'Watering due today',
        severity: high ? 'critical' : 'warning',
        icon: '💧',
        daysOverdue: water.daysOverdue,
        created_at: nowIso,
      });
    } else if (water.reason === 'no_history') {
      alerts.push({
        id: `water_${plant.id}`,
        type: 'water_needed',
        plantId: plant.id,
        title: plant.name,
        message: 'No watering history logged',
        severity: 'warning',
        icon: '💧',
        daysOverdue: water.daysOverdue,
        created_at: nowIso,
      });
    }

    // Fertilising
    const fertFreq = Number(plant.fertilising_frequency_days);
    if (Number.isFinite(fertFreq) && fertFreq > 0) {
      const sinceFert = daysSince(plant.last_fertilised_date, now);
      if (sinceFert !== null && sinceFert >= fertFreq) {
        const overdue = Math.max(0, sinceFert - fertFreq);
        alerts.push({
          id: `fertilise_${plant.id}`,
          type: 'fertilise_due',
          plantId: plant.id,
          title: plant.name,
          message:
            overdue > 0
              ? `Fertilising overdue by ${overdue} day${plural(overdue)}`
              : 'Fertilising due today',
          severity: overdue >= Math.ceil(fertFreq / 2) ? 'critical' : 'warning',
          icon: '🌿',
          daysOverdue: overdue,
          created_at: nowIso,
        });
      }
    }

    // Harvest-ready
    const toHarvest = daysSince(plant.expected_harvest_date, now);
    if (toHarvest !== null && toHarvest >= 0) {
      alerts.push({
        id: `harvest_${plant.id}`,
        type: 'harvest_due',
        plantId: plant.id,
        title: plant.name,
        message:
          toHarvest === 0
            ? 'Ready to harvest today'
            : `Harvest overdue by ${toHarvest} day${plural(toHarvest)}`,
        severity: 'warning',
        icon: '🧺',
        daysOverdue: toHarvest,
        created_at: nowIso,
      });
    }
  }

  // Season-aware pest alerts — deduped per plant type so the dashboard isn't noisy.
  const seenPlantTypes = new Set<string>();
  for (const plant of activePlants) {
    if (seenPlantTypes.has(plant.plant_type)) continue;
    seenPlantTypes.add(plant.plant_type);
    const pestAlerts = getSeasonalPestAlerts(plant.plant_type);
    for (const pest of pestAlerts) {
      alerts.push({
        id: `pest_${plant.plant_type}_${pest.issue}`,
        type: 'pest_spotted',
        plantId: plant.id,
        title: pest.issue,
        message: pest.tip,
        severity: 'info',
        icon: pest.type === 'disease' ? '🦠' : '🐛',
        daysOverdue: 0,
        created_at: nowIso,
      });
    }
  }

  // Bed rotation alerts.
  for (const status of rotationStatuses ?? []) {
    const bedLabel = bedNames?.[status.bed_id] ?? 'Bed';
    if (status.has_solanaceae_violation) {
      alerts.push({
        id: `rotation_${status.bed_id}`,
        type: 'rotation_due',
        bedId: status.bed_id,
        title: bedLabel,
        message: 'Same-family repeat — rotate this bed',
        severity: 'critical',
        icon: '🔄',
        daysOverdue: 0,
        created_at: nowIso,
      });
    }
    if (status.green_manure_recommendation) {
      alerts.push({
        id: `resting_${status.bed_id}`,
        type: 'bed_resting_end',
        bedId: status.bed_id,
        title: bedLabel,
        message: `Sow ${status.green_manure_recommendation.name} green manure`,
        severity: 'info',
        icon: '🌱',
        daysOverdue: 0,
        created_at: nowIso,
      });
    }
  }

  // Harvest-gap warnings (two same-guild beds clearing within 21 days).
  for (const gap of harvestGapWarnings ?? []) {
    const bedLabel = bedNames?.[gap.bed_id] ?? 'Bed';
    alerts.push({
      id: `gap_${gap.bed_id}_${gap.gap_start}`,
      type: 'rotation_due',
      bedId: gap.bed_id,
      title: bedLabel,
      message: `Harvest gap risk (${gap.category}) — stagger clearing`,
      severity: 'warning',
      icon: '📆',
      daysOverdue: 0,
      created_at: nowIso,
    });
  }

  return sortAlerts(alerts);
}

/** Sort most-urgent-first: severity desc, then days overdue desc, then title. */
export function sortAlerts(alerts: FarmAlert[]): FarmAlert[] {
  return [...alerts].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (bySeverity !== 0) return bySeverity;
    const byOverdue = b.daysOverdue - a.daysOverdue;
    if (byOverdue !== 0) return byOverdue;
    return a.title.localeCompare(b.title);
  });
}

/** Whether an alert belongs in the actionable "Needs Attention" scroll (C.8). */
export function isActionable(alert: FarmAlert): boolean {
  return ACTIONABLE_TYPES.has(alert.type);
}

/** Highest-priority alert overall, or null when there are none. Drives TipStrip (C.14). */
export function getTopAlert(alerts: FarmAlert[]): FarmAlert | null {
  const sorted = sortAlerts(alerts);
  return sorted[0] ?? null;
}
