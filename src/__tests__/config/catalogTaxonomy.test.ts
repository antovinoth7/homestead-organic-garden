import {
  CATALOG_GROUP_DEFAULT_TYPE,
  CATALOG_GROUP_ORDER,
  PLANT_TYPE_TO_GROUP,
  SUB_GROUP_ORDER,
  getTaxonomy,
} from '@/config/plants/catalogTaxonomy';
import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import { CATALOG_GROUP_LABELS, HABIT_LABELS, SUB_GROUP_LABELS, TAG_LABELS } from '@/utils/plantLabels';
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
 * the same way. Because the fields live on `PlantCatalogEntry`, TypeScript
 * already refuses a row without a `group`, `habit` and `tags` — these cover what
 * the type cannot: that the values are coherent with each other.
 */
describe('catalog taxonomy completeness', () => {
  it('resolves every catalog row through the alias table', () => {
    const unreachable = PLANT_CATALOG_ENTRIES.filter(
      (entry) => getTaxonomy(entry.name, entry.plantType).group !== entry.group
    ).map((entry) => entry.name);
    expect(unreachable).toEqual([]);
  });

  it('leaves no group empty', () => {
    const counts = new Map<CatalogGroup, number>(CATALOG_GROUP_ORDER.map((g) => [g, 0]));
    for (const entry of PLANT_CATALOG_ENTRIES) {
      counts.set(entry.group, (counts.get(entry.group) ?? 0) + 1);
    }
    expect([...counts.entries()].filter(([, n]) => n === 0)).toEqual([]);
  });

  it('declares every sub-group it uses in SUB_GROUP_ORDER', () => {
    const undeclared = PLANT_CATALOG_ENTRIES.filter(
      (entry) => entry.subGroup && !SUB_GROUP_ORDER[entry.group].includes(entry.subGroup)
    ).map((entry) => `${entry.name} -> ${entry.group}/${entry.subGroup}`);
    expect(undeclared).toEqual([]);
  });

  it('uses every sub-group it declares', () => {
    const used = new Set(
      PLANT_CATALOG_ENTRIES.filter((e) => e.subGroup).map((e) => `${e.group}/${e.subGroup}`)
    );
    const unused = CATALOG_GROUP_ORDER.flatMap((group) =>
      SUB_GROUP_ORDER[group].filter((sub) => !used.has(`${group}/${sub}`)).map((sub) => `${group}/${sub}`)
    );
    expect(unused).toEqual([]);
  });

  it('gives a row a sub-group exactly when its group declares any', () => {
    const wrong = PLANT_CATALOG_ENTRIES.filter(
      (entry) => (SUB_GROUP_ORDER[entry.group].length > 0) !== Boolean(entry.subGroup)
    ).map((entry) => entry.name);
    expect(wrong).toEqual([]);
  });

  it('labels every group, sub-group, habit and tag', () => {
    expect(CATALOG_GROUP_ORDER.filter((g) => !CATALOG_GROUP_LABELS[g])).toEqual([]);
    const subs = CATALOG_GROUP_ORDER.flatMap((g) => SUB_GROUP_ORDER[g]);
    expect(subs.filter((s) => !SUB_GROUP_LABELS[s])).toEqual([]);
    expect(PLANT_CATALOG_ENTRIES.filter((e) => !HABIT_LABELS[e.habit]).map((e) => e.name)).toEqual([]);
    expect(
      PLANT_CATALOG_ENTRIES.flatMap((e) => e.tags).filter((t) => !TAG_LABELS[t])
    ).toEqual([]);
  });

  it('orders exactly the eight groups, with no duplicates', () => {
    expect(CATALOG_GROUP_ORDER).toHaveLength(8);
    expect(new Set(CATALOG_GROUP_ORDER).size).toBe(8);
    expect(Object.keys(SUB_GROUP_ORDER).sort()).toEqual([...CATALOG_GROUP_ORDER].sort());
  });

  it('carries no duplicate tags on a row', () => {
    const dupes = PLANT_CATALOG_ENTRIES.filter(
      (entry) => new Set(entry.tags).size !== entry.tags.length
    ).map((entry) => entry.name);
    expect(dupes).toEqual([]);
  });
});

describe('purpose and care model are independent', () => {
  it('files Castor by what it is for, not by how it is cared for', () => {
    // The clearest case of the split: retyped to `herb` for its care defaults,
    // but it is grown to repel pests around the beds.
    const castor = getTaxonomy('Castor', 'herb');
    expect(castor.group).toBe('farm_support');
    expect(castor.tags).toContain('pest_repellent');
  });

  it('files a tree harvested as a vegetable under Vegetables, badged Tree', () => {
    const drumstick = getTaxonomy('Drumstick', 'vegetable');
    expect(drumstick.group).toBe('vegetables');
    expect(drumstick.habit).toBe('tree');
    expect(drumstick.tags).toContain('keerai');
  });

  it('files a tapped palm as plantation, though its care model is fruit_tree', () => {
    const palmyra = getTaxonomy('Palmyra', 'fruit_tree');
    expect(palmyra.group).toBe('plantation_timber');
    expect(palmyra.habit).toBe('palm');
  });

  it('splits one plant_type across two groups', () => {
    // Turmeric and Tulsi are both `herb`; only one of them is a spice.
    expect(getTaxonomy('Turmeric', 'herb').group).toBe('spices');
    expect(getTaxonomy('Tulsi', 'herb').group).toBe('herbs_medicinal');
  });
});

describe('getTaxonomy', () => {
  it('resolves a bundled plant through the alias table', () => {
    expect(getTaxonomy('Okra', 'vegetable').subGroup).toBe('fruit_vegetables');
    expect(getTaxonomy('Methi', 'spinach').group).toBe('greens');
    // "Pepper" was the row's old name; the alias keeps saved plants resolving.
    expect(getTaxonomy('Pepper', 'vegetable').subGroup).toBe('fruit_vegetables');
  });

  it('carries the row’s rotation family rather than deriving a second one', () => {
    expect(getTaxonomy('Tomato', 'vegetable').cropFamily).toBe('solanaceae');
    expect(getTaxonomy('Cowpea', 'vegetable').cropFamily).toBe('legume');
  });

  it('falls back to the plant type for a plant the user added', () => {
    const entry = getTaxonomy('My Own Gourd', 'vegetable');
    expect(entry.group).toBe('vegetables');
    expect(entry.subGroup).toBeUndefined();
    expect(entry.habit).toBe('annual_bed');
    expect(entry.cropFamily).toBe('other');
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
