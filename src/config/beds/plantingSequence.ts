import type { GuildTemplate, PlantRow } from './guildTemplates';

/** A single step in a bed's suggested planting timeline. */
export interface PlantingSequenceStep {
  /** Calendar week (0-based) when this wave of plants goes in. */
  week: number;
  /** Human-readable instruction for the wave. */
  action: string;
}

/** Weeks between successive sowing waves — matches the Three Sisters cadence (0, 2, 4). */
const WEEKS_PER_WAVE = 2;

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Build a suggested planting timeline for a guild. Three Sisters carries hand-authored
 * week-by-week instructions; every other guild is derived from each row's `succession_week`
 * so the wizard can show a sowing order for any bed type. Pure and config-only — no schema.
 */
export function getPlantingSequence(template: GuildTemplate): PlantingSequenceStep[] {
  // Prefer the richer authored sequence when present (Three Sisters).
  if (template.three_sisters_sequence && template.three_sisters_sequence.length > 0) {
    return template.three_sisters_sequence.map((s) => ({ week: s.week, action: s.action }));
  }

  // Group rows into waves by succession_week (defaulting unset rows to the first wave).
  const waves = new Map<number, PlantRow[]>();
  for (const row of template.plant_rows) {
    const wave = row.succession_week ?? 1;
    const bucket = waves.get(wave);
    if (bucket) bucket.push(row);
    else waves.set(wave, [row]);
  }

  // A single-wave guild has no meaningful sequence to show.
  if (waves.size < 2) return [];

  const sortedWaves = Array.from(waves.keys()).sort((a, b) => a - b);
  return sortedWaves.map((wave, index) => {
    const rows = waves.get(wave) ?? [];
    const mains = rows.filter((r) => r.is_companion !== true).map((r) => r.name);
    const companions = rows.filter((r) => r.is_companion === true).map((r) => r.name);

    const parts: string[] = [];
    if (mains.length > 0) parts.push(`Sow ${joinNames(mains)}`);
    if (companions.length > 0) parts.push(`interplant ${joinNames(companions)}`);

    return { week: index * WEEKS_PER_WAVE, action: parts.join('; ') };
  });
}
