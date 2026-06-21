import type { Plant, PlantType } from '@/types/database.types';
import { getGuildTemplate } from '@/config/beds';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';

// Pure days-to-harvest / lifecycle resolution for the Season Timeline. Kept out
// of the component so it can be unit-tested without React Native.

// Tree-like plant types where the annual sow→harvest model does not apply:
// they take years to first harvest and their catalog `daysToHarvest` is a
// recurring picking interval (e.g. coconut 60–90 days between nut harvests),
// not a sow-to-harvest duration. These render as a continuous "established" bar.
const TREE_LIKE_TYPES = new Set<PlantType>(['fruit_tree', 'timber_tree', 'coconut_tree']);

export interface HarvestRange {
  min: number;
  max: number;
  /** Where the numbers came from. */
  source: 'profile' | 'guild' | 'fallback';
  /** True when min/max come from real catalog/guild data; false = generic fallback. */
  known: boolean;
}

// Build a guild-template harvest-days index keyed by plant name.
const GUILD_HARVEST_DAYS_CACHE = new Map<string, number>();
let guildCacheBuilt = false;

function buildGuildCacheIfNeeded(): void {
  if (guildCacheBuilt) return;
  guildCacheBuilt = true;
  const BED_TYPES = [
    'leafy', 'fruiting', 'spice', 'root_legume',
    'climber_trellis', 'three_sisters', 'medicinal_guild',
  ] as const;
  for (const t of BED_TYPES) {
    for (const row of getGuildTemplate(t).plant_rows) {
      if (row.days_to_harvest !== undefined && !GUILD_HARVEST_DAYS_CACHE.has(row.name)) {
        GUILD_HARVEST_DAYS_CACHE.set(row.name, row.days_to_harvest);
      }
    }
  }
}

// Resolve days-to-harvest using the catalog variety first, then the display
// name. Plants saved with a custom name (≠ catalog variety) still recover their
// real maturity via `plant_variety`. Only genuinely unknown crops hit the
// generic 55–75 day fallback (flagged `known: false`).
export function getDaysToHarvestRange(plant: Plant): HarvestRange {
  const variety = plant.plant_variety ?? plant.name;
  const type = plant.plant_type ?? undefined;

  let profile = getPlantCareProfile(variety, type);
  if (!profile?.daysToHarvest && plant.plant_variety && plant.plant_variety !== plant.name) {
    profile = getPlantCareProfile(plant.name, type) ?? profile;
  }
  const range = profile?.daysToHarvest;
  if (range) return { min: range.min, max: range.max, source: 'profile', known: true };

  buildGuildCacheIfNeeded();
  const fromGuild =
    GUILD_HARVEST_DAYS_CACHE.get(plant.name) ?? GUILD_HARVEST_DAYS_CACHE.get(variety);
  if (fromGuild !== undefined) {
    return { min: fromGuild, max: fromGuild, source: 'guild', known: true };
  }

  return { min: 55, max: 75, source: 'fallback', known: false };
}

// True for trees/woody perennials whose timeline should be a single continuous
// "established" bar instead of a fabricated annual grow→harvest window. Keyed on
// plant type: lifecycle-perennial *vegetables* (tapioca, drumstick, garlic) keep
// their meaningful sow-to-harvest window; only genuine trees are continuous.
export function isTreeLikePlant(plant: Plant): boolean {
  return TREE_LIKE_TYPES.has(plant.plant_type);
}
