import {
  BOTANICAL_TO_CROP_FAMILY,
  CATALOG_GROUP_DEFAULT_TYPE,
  CATALOG_GROUP_ORDER,
  PLANT_TAXONOMY,
  PLANT_TYPE_TO_GROUP,
  SUB_GROUP_ORDER,
  getAllCatalogPlantNames,
  getCropFamily,
  getTaxonomy,
} from '@/config/plants/catalogTaxonomy';
import { CATALOG_GROUP_LABELS, HABIT_LABELS, SUB_GROUP_LABELS, TAG_LABELS } from '@/utils/plantLabels';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { getCanonicalPlantKey } from '@/utils/plantAliases';
import type { CatalogGroup, PlantType } from '@/types/database.types';

const PLANT_TYPES: PlantType[] = [
  'vegetable',
  'herb',
  'flower',
  'fruit_tree',
  'timber_tree',
  'coconut_tree',
  'shrub',
  'spinach',
];

/**
 * The drift guard. The alias table had to be merged from three partial copies
 * that each missed what the others had; this is what stops the taxonomy going
 * the same way. Adding a plant to the catalog without classifying it fails here.
 */
describe('catalog taxonomy completeness', () => {
  const catalogNames = getAllCatalogPlantNames();

  it('classifies every catalog plant exactly once', () => {
    const unclassified = catalogNames.filter((name) => {
      const key = getCanonicalPlantKey(name);
      return !key || !PLANT_TAXONOMY[key];
    });
    expect(unclassified).toEqual([]);
  });

  it('has no entry for a plant the catalog does not offer', () => {
    const catalogKeys = new Set(catalogNames.map((name) => getCanonicalPlantKey(name)));
    const orphans = Object.keys(PLANT_TAXONOMY).filter((key) => !catalogKeys.has(key));
    expect(orphans).toEqual([]);
  });

  it('covers all 129 catalog plants', () => {
    expect(catalogNames).toHaveLength(129);
    expect(Object.keys(PLANT_TAXONOMY)).toHaveLength(129);
  });

  it('leaves no group empty', () => {
    const counts = new Map<CatalogGroup, number>(CATALOG_GROUP_ORDER.map((g) => [g, 0]));
    for (const row of Object.values(PLANT_TAXONOMY)) {
      counts.set(row.group, (counts.get(row.group) ?? 0) + 1);
    }
    expect([...counts.entries()].filter(([, n]) => n === 0)).toEqual([]);
  });

  it('keeps the four coconuts as four entries', () => {
    // They look like varieties of one palm, but each carries its own variety
    // list, Tamil name and care profile — first harvest at 3/6/4/4 years and
    // mature height 5-8 m to 15-30 m. Dwarf vs Tall is a real planting choice.
    for (const name of ['Dwarf Coconut', 'Tall Coconut', 'Hybrid Coconut', 'King Coconut']) {
      expect(getTaxonomy(name, 'coconut_tree').subGroup).toBe('plantation_crops');
      expect(getTaxonomy(name, 'coconut_tree').habit).toBe('palm');
    }
  });
});

describe('catalog taxonomy structure', () => {
  it('declares every sub-group it uses in SUB_GROUP_ORDER', () => {
    const undeclared = Object.entries(PLANT_TAXONOMY)
      .filter(([, row]) => row.subGroup && !SUB_GROUP_ORDER[row.group].includes(row.subGroup))
      .map(([key, row]) => `${key} -> ${row.group}/${row.subGroup}`);
    expect(undeclared).toEqual([]);
  });

  it('uses every sub-group it declares', () => {
    const used = new Set(
      Object.values(PLANT_TAXONOMY)
        .filter((row) => row.subGroup)
        .map((row) => `${row.group}/${row.subGroup}`)
    );
    const unused = CATALOG_GROUP_ORDER.flatMap((group) =>
      SUB_GROUP_ORDER[group]
        .filter((sub) => !used.has(`${group}/${sub}`))
        .map((sub) => `${group}/${sub}`)
    );
    expect(unused).toEqual([]);
  });

  it('gives a plant a sub-group exactly when its group declares any', () => {
    const wrong = Object.entries(PLANT_TAXONOMY)
      .filter(([, row]) => (SUB_GROUP_ORDER[row.group].length > 0) !== Boolean(row.subGroup))
      .map(([key]) => key);
    expect(wrong).toEqual([]);
  });

  it('labels every group, sub-group, habit and tag', () => {
    expect(CATALOG_GROUP_ORDER.filter((g) => !CATALOG_GROUP_LABELS[g])).toEqual([]);
    const subs = CATALOG_GROUP_ORDER.flatMap((g) => SUB_GROUP_ORDER[g]);
    expect(subs.filter((s) => !SUB_GROUP_LABELS[s])).toEqual([]);
    const rows = Object.values(PLANT_TAXONOMY);
    expect(rows.filter((r) => !HABIT_LABELS[r.habit])).toEqual([]);
    expect(rows.flatMap((r) => r.tags).filter((t) => !TAG_LABELS[t])).toEqual([]);
  });

  it('orders exactly the eight groups, with no duplicates', () => {
    expect(CATALOG_GROUP_ORDER).toHaveLength(8);
    expect(new Set(CATALOG_GROUP_ORDER).size).toBe(8);
    expect(Object.keys(SUB_GROUP_ORDER).sort()).toEqual([...CATALOG_GROUP_ORDER].sort());
  });

  it('carries no duplicate tags on a plant', () => {
    const dupes = Object.entries(PLANT_TAXONOMY)
      .filter(([, row]) => new Set(row.tags).size !== row.tags.length)
      .map(([key]) => key);
    expect(dupes).toEqual([]);
  });

});

describe('crop family derivation', () => {
  it('derives from the care profile rather than being hand-assigned', () => {
    expect(getCropFamily('Tomato', 'vegetable')).toBe('solanaceae');
    expect(getCropFamily('Potato', 'vegetable')).toBe('solanaceae');
    expect(getCropFamily('Bitter Gourd', 'vegetable')).toBe('cucurbit');
    expect(getCropFamily('Cowpea', 'vegetable')).toBe('legume');
    expect(getCropFamily('Cabbage', 'vegetable')).toBe('brassica');
    expect(getCropFamily('Onion', 'vegetable')).toBe('allium');
    expect(getCropFamily('Carrot', 'vegetable')).toBe('apiaceae');
    expect(getCropFamily('Tulsi', 'herb')).toBe('lamiaceae');
  });

  it('separates the crops that used to collide in `other`', () => {
    // The rotation gap this fixes: keerai -> beetroot -> palak is one family.
    expect(getCropFamily('Amaranthus', 'spinach')).toBe('amaranthaceae');
    expect(getCropFamily('Beetroot', 'vegetable')).toBe('amaranthaceae');
    expect(getCropFamily('Palak', 'spinach')).toBe('amaranthaceae');
    expect(getCropFamily('Ladies Finger', 'vegetable')).toBe('malvaceae');
    expect(getCropFamily('Sweet Potato', 'vegetable')).toBe('convolvulaceae');
    expect(getCropFamily('Taro', 'vegetable')).toBe('araceae');
    expect(getCropFamily('Turmeric', 'herb')).toBe('zingiberaceae');
    expect(getCropFamily('Maize', 'vegetable')).toBe('poaceae');
  });

  it('is `other` for the tree and palm families, which are never rotated', () => {
    expect(getCropFamily('Mango', 'fruit_tree')).toBe('other');
    expect(getCropFamily('Tall Coconut', 'coconut_tree')).toBe('other');
    expect(getCropFamily('Jackfruit', 'fruit_tree')).toBe('other');
    // Teak is genuinely Lamiaceae, like Tulsi and Mint. Harmless: a timber tree
    // never enters a rotated bed, so its family is never read for rotation.
    expect(getCropFamily('Teak', 'timber_tree')).toBe('lamiaceae');
  });

  it('is `other` for a plant with no care profile', () => {
    expect(getCropFamily('Totally Made Up Plant', 'vegetable')).toBe('other');
  });

  it('maps every botanical family the catalog actually uses', () => {
    // A family appearing on a bed crop but missing from the map is a silent
    // rotation gap, so name it rather than letting it fall through to `other`.
    const unmapped = new Set<string>();
    for (const name of getAllCatalogPlantNames()) {
      for (const type of PLANT_TYPES) {
        const family = getPlantCareProfile(name, type)?.taxonomicFamily;
        if (family && !BOTANICAL_TO_CROP_FAMILY[family]) unmapped.add(family);
      }
    }
    // Tree, palm and other non-rotated families are deliberately unmapped.
    expect([...unmapped].sort()).toMatchSnapshot('unmapped botanical families');
  });
});

describe('getTaxonomy', () => {
  it('resolves a bundled plant through the alias table', () => {
    expect(getTaxonomy('Okra', 'vegetable').group).toBe('vegetables');
    expect(getTaxonomy('Ladies Finger', 'vegetable').subGroup).toBe('fruit_vegetables');
    expect(getTaxonomy('Methi', 'spinach').group).toBe('greens');
    expect(getTaxonomy('Pepper', 'vegetable').subGroup).toBe('fruit_vegetables');
  });

  it('files a tree harvested as a vegetable under Vegetables, badged Tree', () => {
    const drumstick = getTaxonomy('Drumstick', 'vegetable');
    expect(drumstick.group).toBe('vegetables');
    expect(drumstick.habit).toBe('tree');
    expect(drumstick.tags).toContain('keerai');
  });

  it('falls back to the plant type for a plant the user added', () => {
    const entry = getTaxonomy('My Own Gourd', 'vegetable');
    expect(entry.group).toBe('vegetables');
    expect(entry.subGroup).toBeUndefined();
    expect(entry.habit).toBe('annual_bed');
    expect(entry.tags).toEqual([]);
  });

  it('maps every plant type to a group and a default type', () => {
    for (const type of PLANT_TYPES) {
      expect(CATALOG_GROUP_ORDER).toContain(PLANT_TYPE_TO_GROUP[type]);
    }
    for (const group of CATALOG_GROUP_ORDER) {
      expect(PLANT_TYPES).toContain(CATALOG_GROUP_DEFAULT_TYPE[group]);
    }
  });
});
