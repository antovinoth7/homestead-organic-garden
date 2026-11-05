import type { HealthStatus, Plant } from '@/types/database.types';

/**
 * The one ordering rule for plant names.
 *
 * The catalog used to render in the array-literal order of
 * `DEFAULT_PLANT_CATALOG` — a hand-curated top 25 followed by whatever batch was
 * appended when a feature landed — which reads as random past the first
 * screenful. Every surface that lists plant names now sorts through here so the
 * catalog, the add-plant dropdown and the picker sheet cannot drift apart.
 */

/**
 * Case- and accent-insensitive so `ash gourd` cannot land in a different letter
 * group from `Ash Gourd`, and numeric so a user's `Tomato 10` follows
 * `Tomato 2` rather than preceding it.
 *
 * This is the app's first deliberate use of `localeCompare` options. Hermes
 * without full `Intl` ignores them and falls back to a code-unit comparison,
 * which is acceptable here: catalog names are ASCII, and Tamil names live in a
 * separate field that is never used for ordering.
 */
export function comparePlantNames(a: string, b: string): number {
  const collator = getNameCollator();
  return collator ? collator.compare(a, b) : a.localeCompare(b, undefined, NAME_COLLATION);
}

const NAME_COLLATION: Intl.CollatorOptions = { sensitivity: 'base', numeric: true };

/**
 * One collator for every comparison. `localeCompare` with options is specified
 * as building a fresh `Intl.Collator` per call, which is the slow path when
 * sorting a whole list; `collator.compare` gives the same order. Built lazily,
 * and skipped where `Intl` is missing (the `localeCompare` fallback above).
 */
let nameCollator: Intl.Collator | null | undefined;
function getNameCollator(): Intl.Collator | null {
  if (nameCollator === undefined) {
    try {
      nameCollator =
        typeof Intl !== 'undefined' && typeof Intl.Collator === 'function'
          ? new Intl.Collator(undefined, NAME_COLLATION)
          : null;
    } catch {
      nameCollator = null;
    }
  }
  return nameCollator;
}

/** A–Z copy of `names`, leaving the caller's array untouched. */
export function sortPlantNames(names: readonly string[]): string[] {
  return [...names].sort(comparePlantNames);
}

/**
 * The letter group a name belongs to. Anything not starting with a letter —
 * a user-added `123 Gourd`, say — buckets under `#` so it still gets a header.
 */
export function plantNameSectionLetter(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

/** The Plants list's sort menu. */
export type PlantSortOption = 'name' | 'newest' | 'oldest' | 'health' | 'age';

/** Healthy first, then recovering, stressed, sick. */
const HEALTH_SORT_ORDER: Record<HealthStatus, number> = {
  healthy: 0,
  recovering: 1,
  stressed: 2,
  sick: 3,
};

/** Epoch ms of an ISO date, or 0 when it is missing or unparseable. */
const timeOf = (iso: string | null | undefined): number => {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
};

/**
 * A sorted copy of `plants` for the Plants list. Each key is computed once per
 * plant rather than twice per comparison (the old comparators parsed two dates
 * on every call), and ties keep their input order — Firestore's newest-first.
 * Names sort through `comparePlantNames`, like every other plant-name list.
 */
export function sortPlantsBy(plants: readonly Plant[], sortBy: PlantSortOption): Plant[] {
  if (sortBy === 'name') {
    return [...plants].sort((a, b) => comparePlantNames(a.name, b.name));
  }

  const keyOf =
    sortBy === 'health'
      ? (plant: Plant): number => HEALTH_SORT_ORDER[plant.health_status || 'healthy'] ?? 0
      : sortBy === 'age'
        ? (plant: Plant): number => timeOf(plant.planting_date)
        : (plant: Plant): number => timeOf(plant.created_at);
  // Newest is the only descending order; `age` puts the oldest planting first.
  const direction = sortBy === 'newest' ? -1 : 1;

  return plants
    .map((plant, index) => ({ plant, index, key: keyOf(plant) }))
    .sort((a, b) => (a.key - b.key) * direction || a.index - b.index)
    .map(({ plant }) => plant);
}
