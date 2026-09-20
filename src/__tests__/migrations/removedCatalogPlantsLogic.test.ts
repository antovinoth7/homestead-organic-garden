import {
  MERGED_SURVIVOR_TYPE_V13,
  REMOVED_CATALOG_PLANTS_V13,
  RENAMED_PLANT_NAMES_V13,
  planRemovedCatalogPrune,
  planStrandedRename,
} from '@/migrations/removedCatalogPlantsLogic';
import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';

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

const createEmptyProfiles = (): PlantProfiles =>
  PLANT_TYPES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantProfiles);

const withEntry = (type: PlantType, name: string, entry: Partial<PlantProfile>): PlantProfiles => {
  const profiles = createEmptyProfiles();
  profiles[type] = { [name]: { plantType: type, name, ...entry } };
  return profiles;
};

/** The entry migration 003 would have left for a plant still on its seed. */
const seededEntry = (type: PlantType, name: string): PlantProfiles => {
  const seed = REMOVED_CATALOG_PLANTS_V13[type]?.[name];
  if (!seed) throw new Error(`${name} has no seed to build from`);
  return withEntry(type, name, {
    tamilName: seed.tamilName,
    description: seed.description,
    ...(seed.varieties ? { varieties: seed.varieties } : {}),
  });
};

const NONE = new Set<string>();

describe('REMOVED_CATALOG_PLANTS_V13', () => {
  // If one of these is ever re-added to the catalog, the migration would
  // tombstone a plant the app is actively offering. Fail loudly instead.
  it('names nothing the bundled catalog still offers', () => {
    const current = new Set(PLANT_CATALOG_ENTRIES.map((entry) => entry.name));
    for (const names of Object.values(REMOVED_CATALOG_PLANTS_V13)) {
      for (const name of Object.keys(names)) {
        expect(current.has(name)).toBe(false);
      }
    }
  });

  it('leaves the alias and reference-only names alone', () => {
    const listed = new Set(
      Object.values(REMOVED_CATALOG_PLANTS_V13).flatMap((names) => Object.keys(names))
    );
    for (const safe of [
      'Palak',
      'Coconut',
      'Cashew Nut',
      'Elephant Foot Yam',
      'Amaranth',
      'Taro',
      'Corn',
    ]) {
      expect(listed.has(safe)).toBe(false);
    }
  });

  it('renames rather than prunes a plant that still exists', () => {
    const listed = new Set(
      Object.values(REMOVED_CATALOG_PLANTS_V13).flatMap((names) => Object.keys(names))
    );
    expect(listed.has('Pepper')).toBe(false);
    expect(RENAMED_PLANT_NAMES_V13.Pepper).toBe('Capsicum');
  });
});

describe('planRemovedCatalogPrune', () => {
  it('tombstones a stale entry that still matches its seed', () => {
    const next = planRemovedCatalogPrune(
      seededEntry('spinach', 'Saag'),
      REMOVED_CATALOG_PLANTS_V13,
      NONE
    );
    expect(next!.spinach.Saag).toEqual(
      expect.objectContaining({ isDeleted: true, isDismissed: true })
    );
  });

  it('tombstones a scaffold name carrying only identity keys', () => {
    const profiles = withEntry('vegetable', 'Broccoli', {
      tamilName: 'ப்ரோக்கோலி',
      description: 'Cool-season brassica',
      varieties: [],
    });
    const next = planRemovedCatalogPrune(profiles, REMOVED_CATALOG_PLANTS_V13, NONE);
    expect(next!.vegetable.Broccoli!.isDeleted).toBe(true);
  });

  it('leaves a scaffold name the user has opened in the entry form', () => {
    const profiles = withEntry('vegetable', 'Broccoli', {
      tamilName: 'ப்ரோக்கோலி',
      spacingCm: 45,
    });
    expect(planRemovedCatalogPrune(profiles, REMOVED_CATALOG_PLANTS_V13, NONE)).toBeNull();
  });

  it('leaves an entry the user has edited away from its seed', () => {
    const profiles = seededEntry('vegetable', 'Lettuce');
    profiles.vegetable.Lettuce!.description = 'My own note about lettuce';
    expect(planRemovedCatalogPrune(profiles, REMOVED_CATALOG_PLANTS_V13, NONE)).toBeNull();
  });

  it('leaves an entry whose variety list has been reordered', () => {
    const profiles = seededEntry('vegetable', 'Lettuce');
    profiles.vegetable.Lettuce!.varieties = ['Romaine', 'Iceberg', 'Butterhead', 'Loose Leaf'];
    expect(planRemovedCatalogPrune(profiles, REMOVED_CATALOG_PLANTS_V13, NONE)).toBeNull();
  });

  it('leaves a name a garden plant is still planted as', () => {
    const profiles = seededEntry('vegetable', 'Lettuce');
    const inUse = new Set(['Lettuce']);
    expect(planRemovedCatalogPrune(profiles, REMOVED_CATALOG_PLANTS_V13, inUse)).toBeNull();
  });

  it('leaves a same-named entry filed under another category', () => {
    // Coleus is listed under `shrub`; a user's own flower of that name is not
    // the plant the catalog dropped.
    const profiles = withEntry('flower', 'Coleus', {
      tamilName: 'கொல்லியஸ்',
      description: 'Ornamental shade-tolerant shrub used as living mulch in coconut intercrop systems',
    });
    expect(planRemovedCatalogPrune(profiles, REMOVED_CATALOG_PLANTS_V13, NONE)).toBeNull();
  });

  it('returns null when there is nothing stale', () => {
    expect(
      planRemovedCatalogPrune(createEmptyProfiles(), REMOVED_CATALOG_PLANTS_V13, NONE)
    ).toBeNull();
  });

  it('is idempotent', () => {
    const first = planRemovedCatalogPrune(
      seededEntry('spinach', 'Saag'),
      REMOVED_CATALOG_PLANTS_V13,
      NONE
    );
    expect(planRemovedCatalogPrune(first!, REMOVED_CATALOG_PLANTS_V13, NONE)).toBeNull();
  });

  it('records the deletion time when one is given', () => {
    const next = planRemovedCatalogPrune(
      seededEntry('herb', 'Rosemary'),
      REMOVED_CATALOG_PLANTS_V13,
      NONE,
      1_700_000_000_000
    );
    expect(next!.herb.Rosemary!.deletedAt).toBe(1_700_000_000_000);
  });
});

describe('planStrandedRename', () => {
  const pepper = (): PlantProfiles =>
    withEntry('vegetable', 'Pepper', {
      tamilName: 'குடைமிளகாய்',
      description: 'Warm-season fruiting plant producing sweet or mildly hot fruits',
      spacingCm: 45,
    });

  it('moves the entry onto the surviving name and tombstones the old one', () => {
    const next = planStrandedRename(pepper(), RENAMED_PLANT_NAMES_V13, MERGED_SURVIVOR_TYPE_V13)!;
    expect(next.vegetable.Capsicum).toEqual(
      expect.objectContaining({ name: 'Capsicum', plantType: 'vegetable', spacingCm: 45 })
    );
    expect(next.vegetable.Pepper!.isDeleted).toBe(true);
  });

  it('does not overwrite edits already made under the surviving name', () => {
    const profiles = pepper();
    profiles.vegetable.Capsicum = {
      plantType: 'vegetable',
      name: 'Capsicum',
      description: 'What I actually grow',
    };
    const next = planStrandedRename(profiles, RENAMED_PLANT_NAMES_V13, MERGED_SURVIVOR_TYPE_V13)!;
    expect(next.vegetable.Capsicum!.description).toBe('What I actually grow');
    expect(next.vegetable.Pepper!.isDeleted).toBe(true);
  });

  it('returns null when nothing is stranded, and is idempotent', () => {
    expect(
      planStrandedRename(createEmptyProfiles(), RENAMED_PLANT_NAMES_V13, MERGED_SURVIVOR_TYPE_V13)
    ).toBeNull();

    const once = planStrandedRename(pepper(), RENAMED_PLANT_NAMES_V13, MERGED_SURVIVOR_TYPE_V13)!;
    expect(
      planStrandedRename(once, RENAMED_PLANT_NAMES_V13, MERGED_SURVIVOR_TYPE_V13)
    ).toBeNull();
  });
});
