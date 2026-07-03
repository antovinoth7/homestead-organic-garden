import type { PlantEntry } from '@/types/database.types';
import type { GuildTemplate, PlantRow } from '@/config/beds/guildTemplates';
import type { RowPlantInput } from '@/utils/rowLayoutEngine';

/**
 * Engine candidate for a template plant_row, carrying its real gap/family
 * metadata. The single candidate builder for capacity probes (Step 4's
 * maxFitForSpecies, Quick Start planning) — must stay field-for-field in sync
 * with the template join in `mapPlantEntriesToRowInputs`, especially
 * `rowGapCm`: probing without it makes the engine fall back to
 * spacing × multiplier and over-estimate fit for wide-gap crops.
 */
export function templateRowToCandidate(row: PlantRow): RowPlantInput {
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

/**
 * Maps wizard `PlantEntry` records to the engine's `RowPlantInput` shape.
 *
 * Enrichment order per entry:
 *   1. Exact match in `template.plant_rows` by name → use full row metadata
 *      (cropFamily, daysToHarvest, benefitTag, careTasks, isCompanion, successionWeek).
 *   2. Name appears in any plant_row's `companion_plants` list → treat as a companion
 *      (`isCompanion: true`) with the entry's own layer + spacing.
 *   3. Otherwise (e.g. plant pulled from My Plants that isn't in the template) → return
 *      only the basic fields the engine requires.
 */
export function mapPlantEntriesToRowInputs(
  entries: PlantEntry[],
  template: GuildTemplate | null
): RowPlantInput[] {
  const companionSet = new Set<string>();
  if (template) {
    for (const row of template.plant_rows) {
      for (const comp of row.companion_plants) {
        companionSet.add(comp);
      }
    }
  }

  return entries.map((entry) => {
    const row = template?.plant_rows.find((r) => r.name === entry.name);
    if (row) {
      return {
        id: entry.id,
        name: entry.name,
        layer: entry.layer,
        spacingCm: entry.spacingCm,
        rowGapCm: row.row_gap_cm,
        cropFamily: row.crop_family,
        daysToHarvest: row.days_to_harvest,
        benefitTag: row.benefit_tag,
        careTasks: row.care_tasks,
        isCompanion: row.is_companion,
        successionWeek: row.succession_week,
      } satisfies RowPlantInput;
    }
    if (companionSet.has(entry.name)) {
      return {
        id: entry.id,
        name: entry.name,
        layer: entry.layer,
        spacingCm: entry.spacingCm,
        isCompanion: true,
      } satisfies RowPlantInput;
    }
    return {
      id: entry.id,
      name: entry.name,
      layer: entry.layer,
      spacingCm: entry.spacingCm,
    } satisfies RowPlantInput;
  });
}
