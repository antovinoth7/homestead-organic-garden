import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import { GUILD_TEMPLATES } from '@/config/beds/guildTemplates';
import { getCanonicalPlantKey, toLookupKey } from '@/utils/plantAliases';
import type { CropFamily } from '@/types/database.types';

/**
 * Crop family for a plant name, used for rotation tracking and for the family
 * stamped onto a `Plant` when a wizard placeholder is persisted.
 *
 * This used to scan guild templates only, which meant a family existed solely
 * for the handful of plants some template happened to mention — 101 of the 128
 * catalog rows answered null, including Onion, Garlic, Cabbage, Potato and
 * Cucumber. The rotation filter in `bedPlantCatalog.ts` therefore did nothing
 * for them, silently. Worse, the scan matched on the raw name, so the
 * parenthetical template rows `Black Gram (Urad)` and `Pigeon Pea (Arhar)`
 * never matched the catalog's `Black Gram` and `Pigeon Pea` — two of the
 * three headline legumes had no family at all.
 *
 * The catalog record is now the source. The template scan stays as a fallback
 * for the few names that are template rows but not catalog rows.
 */
const CATALOG_FAMILIES = new Map<string, CropFamily>();
for (const entry of PLANT_CATALOG_ENTRIES) {
  if (entry.cropFamily) CATALOG_FAMILIES.set(toLookupKey(entry.name), entry.cropFamily);
}

function fromGuildTemplates(target: string): CropFamily | null {
  for (const template of Object.values(GUILD_TEMPLATES)) {
    for (const row of template.plant_rows) {
      if (toLookupKey(row.name) === target) return row.crop_family;
    }
  }
  return null;
}

export function cropFamilyFromName(name: string): CropFamily | null {
  const target = toLookupKey(name);
  if (!target) return null;

  const direct = CATALOG_FAMILIES.get(target);
  if (direct !== undefined) return direct;

  // Resolves alternative spellings onto the row that owns the family, so a
  // plant stored as "Okra" answers the same as "Ladies Finger".
  const canonical = getCanonicalPlantKey(name);
  if (canonical) {
    const viaAlias = CATALOG_FAMILIES.get(canonical);
    if (viaAlias !== undefined) return viaAlias;
  }

  return fromGuildTemplates(target);
}
