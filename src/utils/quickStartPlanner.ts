import type { BedType, BedLayer, PlantEntry } from '@/types/database.types';
import type { GuildTemplate, PlantRow } from '@/config/beds/guildTemplates';
import { validateCompanionPair } from '@/config/beds/companionRules';
import {
  computeRowLayout,
  computePlantsPerRow,
  getRecommendedFirstAdd,
  effectiveRowGapCm,
} from '@/utils/rowLayoutEngine';
import type { RowPlantInput } from '@/utils/rowLayoutEngine';
import { mapPlantEntriesToRowInputs } from '@/utils/plantEntryMapper';

/** Layer/spacing applied to a suggested companion that isn't itself a template plant_row. */
export const COMPANION_DEFAULT_LAYER: BedLayer = 'ground_cover';
export const COMPANION_DEFAULT_SPACING = 25;

export interface QuickStartPlan {
  entries: PlantEntry[];
  /** Species that genuinely could not be seated (bed too small / antagonist). De-duplicated. */
  dropped: string[];
}

let quickStartSeq = 0;
function makeEntry(name: string, layer: BedLayer, spacingCm: number): PlantEntry {
  quickStartSeq += 1;
  return {
    id: `qs${Date.now().toString(36)}${quickStartSeq.toString(36)}${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    name,
    layer,
    spacingCm,
  };
}

/** Engine candidate for a template plant_row, carrying its real gap/family metadata. */
function mainCandidate(row: PlantRow): RowPlantInput {
  return {
    name: row.name,
    layer: row.layer,
    spacingCm: row.spacing_cm,
    rowGapCm: row.row_gap_cm,
    cropFamily: row.crop_family,
    daysToHarvest: row.days_to_harvest,
    benefitTag: row.benefit_tag,
    careTasks: row.care_tasks,
    isCompanion: row.is_companion,
    successionWeek: row.succession_week,
  };
}

/** Engine candidate for a suggested companion that has no template row of its own. */
function companionCandidate(name: string): RowPlantInput {
  return {
    name,
    layer: COMPANION_DEFAULT_LAYER,
    spacingCm: COMPANION_DEFAULT_SPACING,
    isCompanion: true,
  };
}

/**
 * Builds the "Quick Start" planting set for a guild template on a given bed: every
 * recommended main crop plus its companion crops, sized to the bed.
 *
 * Diversity-first, three phases — the order is what guarantees companions get planted
 * instead of being starved by mains greedily consuming the bed's length budget:
 *   1. Seed ONE of every main, bulkiest-first, so large specimens (Curry Leaf, Aloe Vera)
 *      reserve their length before small mains/companions fill the bed.
 *   2. Seed ONE of every companion (in-template `is_companion` rows + external suggestions).
 *      Companions interplant for free into existing main rows, so seeding them here — before
 *      topping up mains — lets them claim those free slots.
 *   3. Top each seeded main up toward a full row using whatever capacity is left.
 *
 * Species that cannot physically fit (or clash with an antagonist) are returned in `dropped`
 * so the caller can report them honestly rather than silently omitting them.
 */
export function buildQuickStartPlan(
  template: GuildTemplate,
  widthM: number,
  lengthM: number,
  bedType: BedType,
  construction?: 'raised' | 'in_ground'
): QuickStartPlan {
  const entries: PlantEntry[] = [];
  const dropped: string[] = [];

  const passesAntagonist = (name: string): boolean => {
    for (const e of entries) {
      if (e.name === name) continue;
      if (!validateCompanionPair(name, e.name).valid) return false;
    }
    return true;
  };

  const fitsOne = (cand: RowPlantInput): boolean => {
    const trial = mapPlantEntriesToRowInputs(entries, template);
    return computeRowLayout(
      [...trial, { ...cand, id: `${cand.name}_probe` }],
      widthM,
      lengthM,
      bedType,
      construction
    ).fitsInBed;
  };

  const mainRows = template.plant_rows.filter((r) => r.is_companion !== true);
  const companionRows = template.plant_rows.filter((r) => r.is_companion === true);

  // External companion suggestions: companion_plants not represented by any template row.
  const rowNames = new Set(template.plant_rows.map((r) => r.name));
  const extCompanions: string[] = [];
  const seenExt = new Set<string>();
  for (const row of template.plant_rows) {
    for (const comp of row.companion_plants) {
      if (!rowNames.has(comp) && !seenExt.has(comp)) {
        seenExt.add(comp);
        extCompanions.push(comp);
      }
    }
  }

  // ── Phase 1: seed one of every main, bulkiest-first ─────────────────────────
  const mainsBulkiestFirst = [...mainRows].sort(
    (a, b) =>
      effectiveRowGapCm(mainCandidate(b), construction) -
      effectiveRowGapCm(mainCandidate(a), construction)
  );
  for (const row of mainsBulkiestFirst) {
    if (entries.some((e) => e.name === row.name)) continue;
    if (!passesAntagonist(row.name)) {
      dropped.push(row.name);
      continue;
    }
    if (fitsOne(mainCandidate(row))) {
      entries.push(makeEntry(row.name, row.layer, row.spacing_cm));
    } else {
      dropped.push(row.name);
    }
  }

  // ── Phase 2: seed one of every companion ────────────────────────────────────
  interface CompSpec {
    name: string;
    cand: RowPlantInput;
    layer: BedLayer;
    spacingCm: number;
  }
  const compSpecs: CompSpec[] = [
    ...companionRows.map((r) => ({
      name: r.name,
      cand: mainCandidate(r),
      layer: r.layer,
      spacingCm: r.spacing_cm,
    })),
    ...extCompanions.map((name) => ({
      name,
      cand: companionCandidate(name),
      layer: COMPANION_DEFAULT_LAYER,
      spacingCm: COMPANION_DEFAULT_SPACING,
    })),
  ];
  for (const spec of compSpecs) {
    if (entries.some((e) => e.name === spec.name)) continue;
    if (!passesAntagonist(spec.name)) {
      dropped.push(spec.name);
      continue;
    }
    if (fitsOne(spec.cand)) {
      entries.push(makeEntry(spec.name, spec.layer, spec.spacingCm));
    } else {
      dropped.push(spec.name);
    }
  }

  // ── Phase 3: top up each seeded main toward a full row ──────────────────────
  const bedWidthCm = Math.round(widthM * 100);
  for (const row of mainRows) {
    const have = entries.filter((e) => e.name === row.name).length;
    if (have === 0) continue;
    const cand = mainCandidate(row);
    const trial = mapPlantEntriesToRowInputs(entries, template);
    const perRow = computePlantsPerRow(bedWidthCm, row.spacing_cm);
    const fitsMore = getRecommendedFirstAdd(cand, trial, widthM, lengthM, bedType, construction);
    const additional = Math.max(0, Math.min(perRow - have, fitsMore));
    for (let i = 0; i < additional; i++) {
      entries.push(makeEntry(row.name, row.layer, row.spacing_cm));
    }
  }

  return { entries, dropped: Array.from(new Set(dropped)) };
}
