import { BED_PLANT_CATALOG } from '@/config/beds/bedPlantCatalog';
import { ANTAGONIST_PAIR_NAMES } from '@/config/beds/companionRules';
import { COMPANION_TABLE_NAMES, COMPANION_FALLBACK_TARGETS } from '@/utils/plantHelpers';
import { NAME_TYPE_ALIASES, resolvePlantType } from '@/utils/plantTypeFromName';
import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import { getCanonicalPlantKey, toLookupKey } from '@/utils/plantAliases';

/**
 * Lists elsewhere in the app are keyed by plant name, and nothing tied them to
 * the catalog — so when the Tamil Nadu pass dropped rows, entries here were
 * left stranded on names that resolve to nothing. They do not throw; the
 * lookup just silently returns nothing, which is why it went unnoticed.
 *
 * The invariant is `resolvePlantType(name) !== null`, not "is a catalog row":
 * `NAME_TYPE_ALIASES` is the deliberate bridge for the handful of names that
 * are not rows but should still resolve.
 *
 * Guild-template rows and dynamic accumulators are already covered by
 * `plantTypeFromName.test.ts` and are not repeated here.
 */
const unresolvable = (names: readonly string[]): string[] =>
  [...new Set(names)].filter((name) => resolvePlantType(name) === null);

describe('names the app looks plants up by', () => {
  it('offers only real plants in the bed-type catalog', () => {
    expect(unresolvable(Object.values(BED_PLANT_CATALOG).flat())).toEqual([]);
  });

  it('keys the companion tables only by names something resolves to', () => {
    // The four coconut cultivars ship instead of the species, so the companion
    // lookup folds them onto `Coconut` rather than aliasing the names — see
    // COMPANION_NAME_FALLBACKS. Those targets are reachable by design.
    const fallbackTargets = new Set(COMPANION_FALLBACK_TARGETS.map((n) => n.toLowerCase()));
    const stranded = unresolvable(COMPANION_TABLE_NAMES).filter(
      (name) => !fallbackTargets.has(name.toLowerCase())
    );
    expect(stranded).toEqual([]);
  });

  it('names only real plants in the antagonist pairs', () => {
    expect(unresolvable(ANTAGONIST_PAIR_NAMES)).toEqual([]);
  });

  // The bridge exists for names the catalog cannot resolve on its own. An
  // entry a real row has since made redundant is dead weight, and worse, it is
  // consulted first — so it would pin a name to a category the catalog may
  // have moved it out of.
  it('keeps no alias the catalog has made redundant', () => {
    const rowKeys = new Set(PLANT_CATALOG_ENTRIES.map((entry) => toLookupKey(entry.name)));
    const redundant = Object.keys(NAME_TYPE_ALIASES).filter((name) => {
      if (rowKeys.has(name)) return true;
      const canonical = getCanonicalPlantKey(name);
      return canonical !== null && rowKeys.has(canonical);
    });
    expect(redundant).toEqual([]);
  });
});
