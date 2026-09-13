import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import { PLANT_CATEGORIES } from '@/utils/plantCategories';
import { PLANT_NAME_ALIASES, toLookupKey } from '@/utils/plantAliases';
import { PLANT_CARE_OVERRIDES } from '@/utils/plantCareDefaults/overrides';
import { buildProfileKey } from '@/utils/plantCareDefaults/profileKey';

/**
 * Invariants on the catalog record itself.
 *
 * These replace the tests that used to assert two hand-maintained lists still
 * agreed with each other. `PLANT_VARIETIES_BY_TYPE` is now derived from these
 * entries, so that check became a tautology; what is worth asserting instead
 * is that the single list is internally coherent and that everything keyed off
 * a plant name still resolves to a row.
 */
describe('PLANT_CATALOG_ENTRIES', () => {
  it('gives every entry the fields the UI reads', () => {
    for (const entry of PLANT_CATALOG_ENTRIES) {
      expect(entry.name.trim()).not.toBe('');
      expect(entry.tamilName.trim()).not.toBe('');
      expect(entry.shortDescription.trim()).not.toBe('');
      expect(PLANT_CATEGORIES).toContain(entry.plantType);
      // Absent, never empty: `buildPlantCatalog` omits the key entirely for a
      // row with no varieties, and callers check for undefined.
      if (entry.varieties) expect(entry.varieties.length).toBeGreaterThan(0);
    }
  });

  it('names every row exactly once', () => {
    const names = PLANT_CATALOG_ENTRIES.map((e) => e.name);
    expect(names).toHaveLength(new Set(names).size);
  });

  // The parallel-map shape could not express this: two rows differing only by
  // casing or a double space were two distinct keys, but one lookup key. Every
  // alias, reference-image and companion lookup normalises through
  // `toLookupKey`, so a collision makes one of the pair unreachable.
  it('leaves no two rows sharing a lookup key', () => {
    const keys = PLANT_CATALOG_ENTRIES.map((e) => toLookupKey(e.name));
    expect(keys).toHaveLength(new Set(keys).size);
  });

  it('fills every category the app offers', () => {
    for (const category of PLANT_CATEGORIES) {
      expect(PLANT_CATALOG_ENTRIES.some((e) => e.plantType === category)).toBe(true);
    }
  });

  // Replaces the alias half of `plantAliases.test.ts`: an alias asserts two
  // names are the same catalog row, so the canonical side has to be one.
  it('resolves every alias onto a real row, and aliases nothing that is one', () => {
    const rowKeys = new Set(PLANT_CATALOG_ENTRIES.map((e) => toLookupKey(e.name)));
    for (const [alias, canonical] of Object.entries(PLANT_NAME_ALIASES)) {
      expect(rowKeys.has(canonical)).toBe(true);
      expect(rowKeys.has(alias)).toBe(false);
    }
  });

  // An override whose (type, name) is not a row still lands in
  // `PLANT_CARE_PROFILES` via Object.assign, and `getPlantingCandidates()`
  // enumerates every key — so a leftover has the dashboard suggesting a crop
  // the catalog no longer offers.
  it('has a row behind every care-override key', () => {
    const rowKeys = new Set(
      PLANT_CATALOG_ENTRIES.map((e) => buildProfileKey(e.plantType, e.name))
    );
    const orphans = Object.keys(PLANT_CARE_OVERRIDES).filter((key) => !rowKeys.has(key));
    expect(orphans).toEqual([]);
  });
});
