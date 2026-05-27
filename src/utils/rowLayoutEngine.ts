import type { BedLayer, BedType, CropFamily } from '@/types/database.types';
import { validateCompanionPair } from '@/config/beds/companionRules';

// North → South layer order for row assignment
const LAYER_ORDER: BedLayer[] = ['canopy', 'climber', 'understory', 'root', 'ground_cover'];

const LAYER_BASE_LABELS: Record<BedLayer, string> = {
  canopy: 'Canopy',
  climber: 'Climber',
  understory: 'Mid',
  root: 'Root',
  ground_cover: 'Ground Cover',
};

type BedCategory = 'raised' | 'in_ground' | 'food_forest';

// Coconut intercrop is always food-forest (tree spacing dominates).
// All other bed types use the user-selected construction_type from the wizard.

const MIN_ROW_GAP_BY_CATEGORY: Record<BedCategory, number> = {
  raised: 25,
  in_ground: 40,
  food_forest: 60,
};

const ROW_MULTIPLIER_BY_CATEGORY: Record<BedCategory, number> = {
  raised: 1.0,
  in_ground: 1.3,
  food_forest: 1.5,
};

// Edge buffer = quarter of anchor spacing (clamped). Smaller than half-spacing so a
// 120cm bed at 60cm spacing still fits 2 plants and a 150cm bed fits 3.
const EDGE_BUFFER_FRACTION = 0.25;
const EDGE_BUFFER_MIN_CM = 5;
const EDGE_BUFFER_MAX_CM = 20;

const WALKING_PATH_CM = 60;
const ROW_SUFFIX = ['A', 'B', 'C', 'D', 'E'];

export interface RowPlantInput {
  id?: string;
  name: string;
  layer: BedLayer;
  spacingCm: number;
  rowGapCm?: number; // N-S between-row clearance from template; falls back to spacingCm × multiplier
  cropFamily?: CropFamily | null;
  daysToHarvest?: number;
  benefitTag?: string;
  careTasks?: string[];
  isCompanion?: boolean;
  successionWeek?: number;
}

export interface RowPlant {
  id?: string;
  name: string;
  spacingCm: number;
  isNFixer: boolean;
  daysToHarvest?: number;
  benefitTag?: string;
  careTasks?: string[];
  isCompanion?: boolean;
  successionWeek?: number;
}

export interface BedRow {
  rowIndex: number;
  label: string; // e.g. "Row 2 — Mid A"
  layer: BedLayer;
  plants: RowPlant[];
  plantsPerRow: number; // main-crop column slots across bed width
  interplantedCount: number; // companions woven between mains in this row
  rowSpacingCm: number; // N-S clearance this row needs from neighbors
  isStaggered: boolean;
  northEdgeCm: number; // distance from bed's north edge to this row's centreline
  eastPositionsCm: number[]; // E-W distances from bed's west edge to each plant centre
}

/** Layers expected per bed type (used to hide empty layer sections in Step 5). */
export const EXPECTED_LAYERS_BY_BED: Record<BedType, BedLayer[]> = {
  leafy: ['understory', 'ground_cover'],
  fruiting: ['climber', 'understory', 'ground_cover'],
  spice: ['understory', 'root'],
  root_legume: ['understory', 'root'],
  climber_trellis: ['climber', 'ground_cover'],
  coconut_intercrop: ['climber', 'understory', 'root'],
  three_sisters: ['canopy', 'climber', 'ground_cover'],
  medicinal_guild: ['canopy', 'understory', 'ground_cover'],
};

/**
 * Returns the layers to show in Step 5 for a given bed type.
 * Always includes layers that have plants; adds architecturally expected empty layers too.
 */
export function getVisibleLayers(bedType: BedType, plantedLayers: Set<BedLayer>): BedLayer[] {
  const expected = new Set([...(EXPECTED_LAYERS_BY_BED[bedType] ?? []), ...plantedLayers]);
  return LAYER_ORDER.filter((l) => expected.has(l));
}

/**
 * Returns how many more of `candidate` can be added on top of `currentPlants` while
 * the bed still satisfies `fitsInBed`. Uses a formula-based cap derived from bed geometry
 * so small-spacing crops (Carrot, Radish) are never capped at an arbitrary number.
 */
export function maxFitForSpecies(
  candidate: RowPlantInput,
  currentPlants: RowPlantInput[],
  widthM: number,
  lengthM: number,
  bedType: BedType = 'leafy',
  constructionType?: 'raised' | 'in_ground'
): number {
  const bedWidthCm = Math.round(widthM * 100);
  const bedLengthCm = Math.round(lengthM * 100);
  const category: BedCategory =
    bedType === 'coconut_intercrop' ? 'food_forest' : constructionType ?? 'raised';
  const rowMultiplier = ROW_MULTIPLIER_BY_CATEGORY[category];
  const minRowGap = MIN_ROW_GAP_BY_CATEGORY[category];

  const ppr = computePlantsPerRow(bedWidthCm, candidate.spacingCm);
  const gapCm = candidate.rowGapCm ?? candidate.spacingCm * rowMultiplier;
  const effectiveGap = Math.max(gapCm, minRowGap);
  const maxRowsCap = Math.max(1, Math.floor(bedLengthCm / effectiveGap));
  const cap = Math.max(ppr * maxRowsCap, 1);

  for (let n = 1; n <= cap; n++) {
    const additions: RowPlantInput[] = Array.from({ length: n }, (_, i) => ({
      ...candidate,
      id: `${candidate.id ?? candidate.name}_probe_${i}`,
    }));
    const test = [...currentPlants, ...additions];
    const result = computeRowLayout(test, widthM, lengthM, bedType, constructionType);
    if (!result.fitsInBed) return n - 1;
  }
  return cap;
}

/**
 * Suggested starter quantity when a user adds a species for the first time.
 * Equals one full row of that species, bounded by remaining bed capacity.
 */
export function getRecommendedFirstAdd(
  candidate: RowPlantInput,
  currentPlants: RowPlantInput[],
  widthM: number,
  lengthM: number,
  bedType: BedType = 'leafy',
  constructionType?: 'raised' | 'in_ground'
): number {
  const bedWidthCm = Math.round(widthM * 100);
  const perRow = computePlantsPerRow(bedWidthCm, candidate.spacingCm);
  const maxFit = maxFitForSpecies(
    candidate,
    currentPlants,
    widthM,
    lengthM,
    bedType,
    constructionType
  );
  return Math.max(0, Math.min(perRow, maxFit));
}

/**
 * Returns { plantsPerRow, rowCount, total } for a species in a given bed.
 * Used by Step 4 to show "N rows × M = total" in the capacity display.
 */
export function computePlantMatrix(
  candidate: RowPlantInput,
  currentPlants: RowPlantInput[],
  widthM: number,
  lengthM: number,
  bedType: BedType = 'leafy',
  constructionType?: 'raised' | 'in_ground'
): { plantsPerRow: number; rowCount: number; total: number } {
  const bedWidthCm = Math.round(widthM * 100);
  const bedLengthCm = Math.round(lengthM * 100);
  const category: BedCategory =
    bedType === 'coconut_intercrop' ? 'food_forest' : constructionType ?? 'raised';
  const rowMultiplier = ROW_MULTIPLIER_BY_CATEGORY[category];
  const minRowGap = MIN_ROW_GAP_BY_CATEGORY[category];

  const plantsPerRow = computePlantsPerRow(bedWidthCm, candidate.spacingCm);
  const gapCm = candidate.rowGapCm ?? candidate.spacingCm * rowMultiplier;
  const effectiveGap = Math.max(gapCm, minRowGap);
  const edgeBuf = computeEdgeBuffer(effectiveGap);

  // Rows available for this species only (ignores other species already in bed for display)
  const rowCount = Math.max(
    1,
    Math.floor((bedLengthCm - 2 * edgeBuf) / effectiveGap) + 1
  );

  // Cap by actual remaining capacity
  const maxFit = maxFitForSpecies(candidate, currentPlants, widthM, lengthM, bedType, constructionType);
  const total = Math.min(plantsPerRow * rowCount, maxFit);

  return { plantsPerRow, rowCount: Math.ceil(total / plantsPerRow), total };
}

/**
 * Reorders a row's plants so companions sit BETWEEN mains in the display sequence.
 * The engine's row.plants is `[...mains, ...companions]`; this helper produces
 * `[Main, Companion, Main, Companion, Main, ...]` for spatial rendering.
 *
 * Distribution rule: place companions only in interior gaps between mains. If the
 * companion count exceeds gap count (mains - 1), the extras are appended to the
 * end. Falls back to the input order when either side is empty.
 */
export function interleavePlants<T extends { isCompanion?: boolean }>(plants: T[]): T[] {
  const mains = plants.filter((p) => p.isCompanion !== true);
  const companions = plants.filter((p) => p.isCompanion === true);

  if (mains.length === 0) return companions;
  if (companions.length === 0) return mains;
  if (mains.length === 1) return [mains[0]!, ...companions];

  const gapCount = mains.length - 1;
  const perGapBase = Math.floor(companions.length / gapCount);
  const remainder = companions.length - perGapBase * gapCount;

  const result: T[] = [];
  let cIdx = 0;
  for (let i = 0; i < mains.length; i++) {
    result.push(mains[i]!);
    if (i < gapCount) {
      const take = perGapBase + (i < remainder ? 1 : 0);
      for (let k = 0; k < take && cIdx < companions.length; k++) {
        result.push(companions[cIdx++]!);
      }
    }
  }
  while (cIdx < companions.length) {
    result.push(companions[cIdx++]!);
  }
  return result;
}

export interface CompanionWarning {
  plantA: string;
  plantB: string;
  reason: string;
}

export interface RowLayoutResult {
  rows: BedRow[];
  rowsNeeded: number;
  totalRowsFit: number; // additional rows that fit at the widest existing row gap
  usedLengthCm: number; // (sum of inter-row gaps) + 2 × edge buffer
  fitsInBed: boolean;
  overflowCm: number;
  bedWidthCm: number;
  bedLengthCm: number;
  edgeBufferCm: number; // N-S edge buffer applied at both bed ends
  walkingPathCm: number;
  companionWarnings: CompanionWarning[];
  successionWeeks: number[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeEdgeBuffer(anchorSpacingCm: number): number {
  return Math.round(
    clamp(anchorSpacingCm * EDGE_BUFFER_FRACTION, EDGE_BUFFER_MIN_CM, EDGE_BUFFER_MAX_CM)
  );
}

/**
 * Plants-per-row using center-to-center spacing with an edge buffer.
 * For N plants spaced S apart with edge buffer E on each side:
 *   bedWidth >= (N-1) × S + 2 × E   →   N <= (bedWidth - 2E) / S + 1
 */
export function computePlantsPerRow(bedWidthCm: number, spacingCm: number): number {
  if (spacingCm <= 0) return 1;
  const edgeBuffer = computeEdgeBuffer(spacingCm);
  const usable = bedWidthCm - 2 * edgeBuffer;
  if (usable < 0) return 1;
  return Math.max(1, Math.floor(usable / spacingCm) + 1);
}

/**
 * Auto-assigns plants to N→S rows by BedLayer using bed-type-aware row spacing,
 * center-to-center column math, and companion interplanting.
 * Each BedRow includes exact northEdgeCm and eastPositionsCm for peg-out marking.
 */
export function computeRowLayout(
  plants: RowPlantInput[],
  widthM: number,
  lengthM: number,
  bedType: BedType = 'leafy',
  constructionType?: 'raised' | 'in_ground'
): RowLayoutResult {
  const bedWidthCm = Math.round(widthM * 100);
  const bedLengthCm = Math.round(lengthM * 100);
  const category: BedCategory =
    bedType === 'coconut_intercrop' ? 'food_forest' : constructionType ?? 'raised';
  const rowMultiplier = ROW_MULTIPLIER_BY_CATEGORY[category];
  const minRowGap = MIN_ROW_GAP_BY_CATEGORY[category];

  // Group by layer
  const byLayer: Record<BedLayer, RowPlantInput[]> = {
    canopy: [],
    climber: [],
    understory: [],
    root: [],
    ground_cover: [],
  };
  for (const p of plants) {
    byLayer[p.layer].push(p);
  }

  const rows: BedRow[] = [];
  let rowIndex = 1;
  const successionWeekSet = new Set<number>();

  for (const layer of LAYER_ORDER) {
    const layerPlants = byLayer[layer];
    if (layerPlants.length === 0) continue;

    // Companions interplant between mains; they don't claim column slots.
    const mains = layerPlants.filter((p) => p.isCompanion !== true);
    const companions = layerPlants.filter((p) => p.isCompanion === true);

    const sortedCompanions = [...companions].sort((a, b) => a.spacingCm - b.spacingCm);
    const companionPool = mains.length > 0 ? [...sortedCompanions] : [];

    let chunkIndex = 0;

    if (mains.length > 0) {
      // Group mains by species so each species gets its own rows.
      const mainsBySpecies = new Map<string, RowPlantInput[]>();
      for (const p of mains) {
        const arr = mainsBySpecies.get(p.name) ?? [];
        arr.push(p);
        mainsBySpecies.set(p.name, arr);
      }

      // Total row-chunks across all species (drives suffix labels like A/B/C).
      const totalChunksThisLayer = [...mainsBySpecies.values()].reduce(
        (sum, sp) => sum + Math.ceil(sp.length / computePlantsPerRow(bedWidthCm, sp[0]!.spacingCm)),
        0
      );

      for (const [, speciesPlants] of mainsBySpecies) {
        const speciesSpacing = speciesPlants[0]!.spacingCm;
        const speciesPPR = computePlantsPerRow(bedWidthCm, speciesSpacing);
        const interplantCapacityPerRow = Math.max(0, speciesPPR - 1);

        for (let i = 0; i < speciesPlants.length; i += speciesPPR) {
          const mainChunk = speciesPlants.slice(i, i + speciesPPR);

          const interplanted = Math.min(interplantCapacityPerRow, companionPool.length);
          const interleavedCompanions = companionPool.splice(0, interplanted);
          const interleaved = [...mainChunk, ...interleavedCompanions];

          // Prefer explicit row_gap_cm from template; fall back to spacing × category multiplier
          const maxChunkRowGap = Math.max(...interleaved.map((p) => p.rowGapCm ?? p.spacingCm * rowMultiplier));
          const rowSpacingCm = Math.max(Math.round(maxChunkRowGap), minRowGap);

          const baseLabel = LAYER_BASE_LABELS[layer];
          const suffix = totalChunksThisLayer > 1 ? ` ${ROW_SUFFIX[chunkIndex] ?? String(chunkIndex + 1)}` : '';

          const eBufEW = computeEdgeBuffer(speciesSpacing);
          const eastPositionsCm = Array.from(
            { length: speciesPPR },
            (_, k) => eBufEW + k * speciesSpacing
          );

          rows.push({
            rowIndex,
            label: `Row ${rowIndex} — ${baseLabel}${suffix}`,
            layer,
            plants: interleaved.map((p) => {
              if (p.successionWeek !== undefined) successionWeekSet.add(p.successionWeek);
              return {
                id: p.id,
                name: p.name,
                spacingCm: p.spacingCm,
                isNFixer: p.cropFamily === 'legume',
                daysToHarvest: p.daysToHarvest,
                benefitTag: p.benefitTag,
                careTasks: p.careTasks,
                isCompanion: p.isCompanion,
                successionWeek: p.successionWeek,
              };
            }),
            plantsPerRow: speciesPPR,
            interplantedCount: interplanted,
            rowSpacingCm,
            isStaggered: chunkIndex > 0,
            northEdgeCm: 0, // filled in second pass below
            eastPositionsCm,
          });

          rowIndex++;
          chunkIndex++;
        }
      }
    } else {
      // Companion-only layer: companions act as mains (flat chunking by spacing).
      const anchorSpacing = Math.max(...layerPlants.map((p) => p.spacingCm));
      const plantsPerRow = computePlantsPerRow(bedWidthCm, anchorSpacing);
      const sortedSource = [...sortedCompanions];
      const totalChunks = Math.ceil(sortedSource.length / plantsPerRow);

      for (let i = 0; i < sortedSource.length; i += plantsPerRow) {
        const chunk = sortedSource.slice(i, i + plantsPerRow);

        const maxChunkSpacing = Math.max(...chunk.map((p) => p.spacingCm));
        const maxChunkRowGap = Math.max(...chunk.map((p) => p.rowGapCm ?? p.spacingCm * rowMultiplier));
        const rowSpacingCm = Math.max(Math.round(maxChunkRowGap), minRowGap);

        const baseLabel = LAYER_BASE_LABELS[layer];
        const suffix = totalChunks > 1 ? ` ${ROW_SUFFIX[chunkIndex] ?? String(chunkIndex + 1)}` : '';

        const eBufEW = computeEdgeBuffer(maxChunkSpacing);
        const eastPositionsCm = Array.from(
          { length: plantsPerRow },
          (_, k) => eBufEW + k * maxChunkSpacing
        );

        rows.push({
          rowIndex,
          label: `Row ${rowIndex} — ${baseLabel}${suffix}`,
          layer,
          plants: chunk.map((p) => {
            if (p.successionWeek !== undefined) successionWeekSet.add(p.successionWeek);
            return {
              id: p.id,
              name: p.name,
              spacingCm: p.spacingCm,
              isNFixer: p.cropFamily === 'legume',
              daysToHarvest: p.daysToHarvest,
              benefitTag: p.benefitTag,
              careTasks: p.careTasks,
              isCompanion: p.isCompanion,
              successionWeek: p.successionWeek,
            };
          }),
          plantsPerRow,
          interplantedCount: 0,
          rowSpacingCm,
          isStaggered: chunkIndex > 0,
          northEdgeCm: 0, // filled in second pass below
          eastPositionsCm,
        });

        rowIndex++;
        chunkIndex++;
      }
    }

    // Surplus companions spill into staggered companion-only rows
    while (companionPool.length > 0) {
      const compAnchor = Math.max(...companionPool.map((p) => p.spacingCm));
      const compPerRow = computePlantsPerRow(bedWidthCm, compAnchor);
      const chunk = companionPool.splice(0, compPerRow);

      const maxChunkSpacing = Math.max(...chunk.map((p) => p.spacingCm));
      const maxChunkRowGap = Math.max(...chunk.map((p) => p.rowGapCm ?? p.spacingCm * rowMultiplier));
      const rowSpacingCm = Math.max(Math.round(maxChunkRowGap), minRowGap);

      const baseLabel = LAYER_BASE_LABELS[layer];
      const suffix = ` ${ROW_SUFFIX[chunkIndex] ?? String(chunkIndex + 1)}`;

      const eBufEW = computeEdgeBuffer(maxChunkSpacing);
      const eastPositionsCm = Array.from(
        { length: compPerRow },
        (_, k) => eBufEW + k * compAnchor
      );

      rows.push({
        rowIndex,
        label: `Row ${rowIndex} — ${baseLabel}${suffix}`,
        layer,
        plants: chunk.map((p) => {
          if (p.successionWeek !== undefined) successionWeekSet.add(p.successionWeek);
          return {
            id: p.id,
            name: p.name,
            spacingCm: p.spacingCm,
            isNFixer: p.cropFamily === 'legume',
            daysToHarvest: p.daysToHarvest,
            benefitTag: p.benefitTag,
            careTasks: p.careTasks,
            isCompanion: p.isCompanion,
            successionWeek: p.successionWeek,
          };
        }),
        plantsPerRow: compPerRow,
        interplantedCount: 0,
        rowSpacingCm,
        isStaggered: true,
        northEdgeCm: 0, // filled in second pass below
        eastPositionsCm,
      });

      rowIndex++;
      chunkIndex++;
    }
  }

  // Fence-post length math: gaps between adjacent rows + edge buffer at both ends.
  // Inter-row gap uses the larger of the two row spacings (wider plant dictates clearance).
  let interRowSum = 0;
  for (let i = 0; i < rows.length - 1; i++) {
    interRowSum += Math.max(rows[i]!.rowSpacingCm, rows[i + 1]!.rowSpacingCm);
  }

  const maxRowSpacing = rows.length > 0 ? Math.max(...rows.map((r) => r.rowSpacingCm)) : 0;
  const edgeBufferCm = rows.length > 0 ? computeEdgeBuffer(maxRowSpacing) : 0;
  const usedLengthCm = Math.round(interRowSum + 2 * edgeBufferCm);

  const fitsInBed = usedLengthCm <= bedLengthCm;
  const overflowCm = Math.max(0, usedLengthCm - bedLengthCm);

  const spareLengthCm = Math.max(0, bedLengthCm - usedLengthCm);
  const effectiveRowGap = maxRowSpacing > 0 ? maxRowSpacing : minRowGap;
  const totalRowsFit = spareLengthCm > 0 ? Math.floor(spareLengthCm / effectiveRowGap) : 0;

  // Second pass: assign northEdgeCm to each row (distance from N edge to row centreline)
  let northOffset = edgeBufferCm;
  for (let i = 0; i < rows.length; i++) {
    rows[i]!.northEdgeCm = northOffset;
    if (i < rows.length - 1) {
      northOffset += Math.max(rows[i]!.rowSpacingCm, rows[i + 1]!.rowSpacingCm);
    }
  }

  // Companion validation — all pairs across the whole bed
  const allNames = plants.map((p) => p.name);
  const warnings: CompanionWarning[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < allNames.length; i++) {
    for (let j = i + 1; j < allNames.length; j++) {
      const a = allNames[i]!;
      const b = allNames[j]!;
      const key = [a, b].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const check = validateCompanionPair(a, b);
      if (!check.valid && check.reason) {
        warnings.push({ plantA: a, plantB: b, reason: check.reason });
      }
    }
  }

  const successionWeeks = Array.from(successionWeekSet).sort((a, b) => a - b);

  return {
    rows,
    rowsNeeded: rows.length,
    totalRowsFit,
    usedLengthCm,
    fitsInBed,
    overflowCm,
    bedWidthCm,
    bedLengthCm,
    edgeBufferCm,
    walkingPathCm: WALKING_PATH_CM,
    companionWarnings: warnings,
    successionWeeks,
  };
}
