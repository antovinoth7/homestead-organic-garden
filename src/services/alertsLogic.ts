/**
 * Farm alert aggregation — pure domain logic (Phase C, C.10).
 *
 * No Firestore / React-Native imports so it can be unit-tested directly. The
 * service wrapper in `alerts.ts` re-exports these for screens/hooks.
 *
 * Care alerts are a *presentation of task templates*, not a second scheduler:
 * `water_needed` / `fertilise_due` / `prune_due` / `harvest_due` come from
 * overdue `TaskTemplate`s, so no surface built on this can disagree with the
 * Care Plan about what is due. Only conditions with no template behind them are
 * derived from plant fields here — a plant marked sick, harvest readiness for
 * crops that get no harvest task, bed rotation, green manure. That split is
 * what `isActionable` keys off to separate exceptions from routine work.
 */

import {
  Plant,
  FarmAlert,
  FarmAlertSeverity,
  FarmAlertType,
  RotationStatus,
  HarvestGapWarning,
  TaskTemplate,
  TaskType,
} from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';
// Type-only: erased at compile time, so this adds no runtime edge into
// taskSchedulingLogic → taskConstants → @expo/vector-icons.
import type { PlantLastCareField } from '@/services/taskSchedulingLogic';
import { isPlantArchived } from '@/utils/plantHelpers';
import { getGreenManureForMonth } from '@/config/beds';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * How far a task must have slipped before it earns a care alert. Work due
 * *today* is already stated by the per-plot due counts, so these start one whole
 * day late.
 *
 * Care alerts no longer reach the Today queue (`isActionable` drops anything
 * with a `templateId`), but they remain part of this service's output for
 * `getTopAlert` and for callers that want the schedule expressed as alerts.
 */
export const ATTENTION_MIN_DAYS_OVERDUE = 1;

/**
 * Task types that have a matching alert shape, with the wording and icon their
 * card uses. Types absent here (spray, mulch, repot, weeding, …) stay the
 * ring's and the Care Plan's business — they have no `FarmAlertType`, and
 * inventing one per task type would just rebuild the Care Plan on the Home tab.
 *
 * Declared locally rather than imported from `taskConstants`, which pulls in
 * `@expo/vector-icons` — this module is contractually RN-free.
 */
const TASK_ALERT_SHAPE: Partial<
  Record<TaskType, { type: FarmAlertType; verb: string; iconKey: VisualIconKey }>
> = {
  water: { type: 'water_needed', verb: 'Watering', iconKey: 'alert.water_needed' },
  fertilise: { type: 'fertilise_due', verb: 'Fertilising', iconKey: 'alert.fertilise_due' },
  prune: { type: 'prune_due', verb: 'Pruning', iconKey: 'alert.prune_due' },
  harvest: { type: 'harvest_due', verb: 'Harvest', iconKey: 'alert.harvest_due' },
  harvest_leaves: { type: 'harvest_due', verb: 'Leaf harvest', iconKey: 'alert.harvest_due' },
};

/** Task types whose template supersedes the field-derived harvest-readiness nudge. */
const HARVEST_TASK_TYPES: ReadonlySet<TaskType> = new Set<TaskType>(['harvest', 'harvest_leaves']);

/**
 * Days before a cut-and-come-again crop is prompted for its next picking.
 * Mirrors the `harvest_leaves` template cadence in `tasks.ts` (currently 14) —
 * kept as a local literal rather than imported because `taskConstants.ts` pulls
 * in `@expo/vector-icons`, and this module is contractually RN-free.
 */
const CUT_AND_COME_AGAIN_INTERVAL_DAYS = 14;

const SEVERITY_RANK: Record<FarmAlertSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

/**
 * Alert types the Today screen's "Needs action" queue lists.
 *
 * The queue is an *exception* list, not a second overdue count: the plot cards
 * state how much scheduled work each plot owes, so a card for work that already
 * has a task behind it would say the same thing twice, in numbers that cannot
 * be reconciled (the cards count every task type and drop what was completed
 * today; these alerts do neither). Only conditions with no task to complete
 * belong here — see `isActionable`, which enforces that with `templateId`.
 *
 * `bed_resting_end` stays out because a seasonal green-manure suggestion is
 * advice, not something the farm has fallen behind on; it renders as the season
 * block's closing line instead. `pest_spotted` and `health_stressed` are
 * likewise informational.
 */
const EXCEPTION_TYPES = new Set<FarmAlert['type']>([
  'health_sick',
  // Only the field-derived readiness nudge reaches the queue — a harvest that
  // has a real task carries `templateId` and is counted on its plot card.
  'harvest_due',
  // Rotation conflicts and harvest-gap risk. Nothing else on the screen states
  // these, so without them they are computed and shown nowhere.
  'rotation_due',
]);

/**
 * Alert types resolvable by stamping a plant date field, for the one card kind
 * that has no task behind it to complete: harvest readiness on crops that get
 * no harvest template. Everything else carries a `templateId` and completes
 * through `markTaskDone`, which writes a real `TaskLog`.
 *
 * Typed as `PlantLastCareField` so this cannot drift from
 * `TASK_TYPE_TO_PLANT_LAST_CARE_FIELD`, which the task layer writes on
 * completion — Home and Care Plan must agree on what "harvested" means.
 */
export const ALERT_COMPLETE_FIELD: Partial<Record<FarmAlert['type'], PlantLastCareField>> = {
  harvest_due: 'last_harvest_date',
};

export interface FarmAlertInputs {
  plants: Plant[];
  /**
   * Today's task templates (`getTodayTasks`) — the single source of truth for
   * care that is due. Overdue entries become the care alerts; omit it and only
   * the template-less conditions are reported.
   */
  todayTasks?: TaskTemplate[];
  /** Cross-bed rotation statuses from `getCrossBedStatus` (optional). */
  rotationStatuses?: RotationStatus[];
  /** Harvest-gap warnings from `getHarvestGapWarnings` (optional). */
  harvestGapWarnings?: HarvestGapWarning[];
  /** Map of bedId → bed display name, for labelling bed alerts. */
  bedNames?: Record<string, string>;
  /**
   * How many beds are empty or resting (candidates for green manure).
   * `null`/`undefined` = beds not loaded yet — the seasonal green-manure card
   * still shows (generic wording). `0` = every bed is planted — the card is
   * considered done and is omitted.
   */
  emptyOrRestingBedCount?: number | null;
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
  const {
    plants,
    todayTasks,
    rotationStatuses,
    harvestGapWarnings,
    bedNames,
    emptyOrRestingBedCount,
    now = Date.now(),
  } = inputs;
  const nowIso = new Date(now).toISOString();
  const alerts: FarmAlert[] = [];

  // Archived plants (bed cleared after final harvest) are done — they must not
  // keep emitting care/harvest alerts. Mirrors the filter every other surface
  // applies (useBedData, usePlantDetail, PlantsScreen, tasks.ts).
  const activePlants = plants.filter((p) => !p.is_deleted && !isPlantArchived(p));
  const plantsById = new Map(activePlants.map((p) => [p.id, p]));

  // Care alerts, straight from the task schedule. Nothing is recomputed from
  // plant date fields here: a disabled care type has no enabled template, so it
  // simply produces no card — the two can't drift.
  const plantsWithHarvestTask = new Set<string>();
  for (const template of todayTasks ?? []) {
    if (!template?.enabled) continue;

    const plant = template.plant_id ? plantsById.get(template.plant_id) : null;
    // A template for a deleted/archived plant is stale — skip it. Bed and farm
    // tasks carry no plant_id and are kept.
    if (template.plant_id && !plant) continue;

    if (plant && HARVEST_TASK_TYPES.has(template.task_type)) {
      plantsWithHarvestTask.add(plant.id);
    }

    const shape = TASK_ALERT_SHAPE[template.task_type];
    if (!shape) continue;

    const daysOverdue = daysSince(template.next_due_at, now);
    if (daysOverdue === null || daysOverdue < ATTENTION_MIN_DAYS_OVERDUE) continue;

    const frequency = Number(template.frequency_days);
    const halfCycle = Number.isFinite(frequency) && frequency > 0 ? Math.ceil(frequency / 2) : 2;

    alerts.push({
      id: `task_${template.id}`,
      type: shape.type,
      templateId: template.id,
      ...(plant ? { plantId: plant.id } : {}),
      ...(template.bed_id ? { bedId: template.bed_id } : {}),
      title: plant?.name ?? (template.bed_id ? bedNames?.[template.bed_id] ?? 'Bed' : 'Farm'),
      message: `${shape.verb} overdue by ${daysOverdue} day${plural(daysOverdue)}`,
      severity: daysOverdue >= Math.max(2, halfCycle) ? 'critical' : 'warning',
      iconKey: shape.iconKey,
      daysOverdue,
      created_at: nowIso,
    });
  }

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
        iconKey: 'alert.health_sick',
        daysOverdue: 0,
        created_at: nowIso,
      });
    }

    // Watering, fertilising and pruning are not derived here — they arrive from
    // their task templates above, so a care type switched off (which disables
    // its template) can no longer keep firing a card the Care Plan has dropped.

    // Harvest-ready. One-shot readiness nudge: once the plant has actually been
    // harvested on or after its expected date the prompt is done, otherwise the
    // card would sit here forever with an ever-growing overdue count. Recurring
    // harvests (perennials, coconut) are driven by their harvest task instead —
    // the guard below is what keeps those from being reported twice.
    if (plantsWithHarvestTask.has(plant.id)) continue;

    const toHarvest = daysSince(plant.expected_harvest_date, now);
    // `daysSince` counts back from today, so a *later* date yields a *smaller*
    // number — `sinceHarvest <= toHarvest` means harvested on/after expected.
    const sinceHarvest = daysSince(plant.last_harvest_date, now);
    const harvestedOnOrAfterExpected =
      sinceHarvest !== null && toHarvest !== null && sinceHarvest <= toHarvest;
    // Cut-and-come-again crops keep producing and — unlike perennials
    // (`harvest_leaves`) and coconuts (`harvest`) — get no care task of their
    // own, so the prompt re-arms one picking cycle after the last harvest.
    // Every other mode, `null` included, stays suppressed: those either finish
    // for the season or are re-prompted by their care task.
    const readyAgain =
      plant.harvest_mode === 'cut_and_come_again' &&
      sinceHarvest !== null &&
      sinceHarvest >= CUT_AND_COME_AGAIN_INTERVAL_DAYS;
    const alreadyHarvested = harvestedOnOrAfterExpected && !readyAgain;
    if (toHarvest !== null && toHarvest >= 0 && !alreadyHarvested) {
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
        iconKey: 'alert.harvest_due',
        daysOverdue: toHarvest,
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
        iconKey: 'alert.rotation_due',
        daysOverdue: 0,
        created_at: nowIso,
      });
    }
  }

  // Seasonal green-manure suggestion — a single farm-level card rather than one
  // per bed. Computed straight from the calendar so it never blinks out while
  // bed data loads; it drops away ("completes") once every bed is planted.
  if (emptyOrRestingBedCount !== 0) {
    const nowDate = new Date(now);
    const month = nowDate.getMonth() + 1;
    const gm = getGreenManureForMonth(month);
    alerts.push({
      id: `green_manure_${nowDate.getFullYear()}_${month}`,
      type: 'bed_resting_end',
      title: 'Green manure',
      message:
        emptyOrRestingBedCount != null
          ? `Sow ${gm.name} in ${emptyOrRestingBedCount} empty bed${plural(emptyOrRestingBedCount)}`
          : `Sow ${gm.name} green manure in empty beds`,
      severity: 'info',
      iconKey: 'alert.bed_resting_end',
      daysOverdue: 0,
      created_at: nowIso,
    });
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
      iconKey: 'alert.rotation_due',
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

/**
 * Whether an alert belongs in the Today screen's "Needs action" queue.
 *
 * `templateId` is the exact test for "a task already covers this": it is set
 * only on the alerts built from `todayTasks`. Anything carrying one is routine
 * scheduled work that the plot cards count and the Care Plan owns; what is left
 * is a condition with nothing to complete, which no count on the screen states.
 */
export function isActionable(alert: FarmAlert): boolean {
  return alert.templateId === undefined && EXCEPTION_TYPES.has(alert.type);
}

/** Highest-priority alert overall, or null when there are none. Drives TipStrip (C.14). */
export function getTopAlert(alerts: FarmAlert[]): FarmAlert | null {
  const sorted = sortAlerts(alerts);
  return sorted[0] ?? null;
}
