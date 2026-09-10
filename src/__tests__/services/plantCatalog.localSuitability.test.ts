import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import { KANYAKUMARI_PLANTING_CALENDAR } from '@/config/kanyakumariPlantingCalendar';
import {
  DEFAULT_PLANT_PROFILES,
  toPlantCatalogShape,
} from '@/services/plantProfiles';
import { sortPlantNames } from '@/utils/plantSort';
import { PLANT_CARE_OVERRIDES } from '@/utils/plantCareDefaults/overrides';
import { buildProfileKey } from '@/utils/plantCareDefaults/profileKey';
import { PLANT_VARIETIES_BY_TYPE } from '@/utils/plantCareDefaults/varieties';

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } },
  refreshAuthToken: jest.fn(async () => true),
}));

jest.mock('@/utils/firestoreTimeout', () => ({
  withTimeoutAndRetry: jest.fn(async <T>(op: () => Promise<T>) => op()),
  FIRESTORE_READ_TIMEOUT_MS: 15000,
  FIRESTORE_WRITE_TIMEOUT_MS: 15000,
}));

describe('Tamil Nadu and Kanyakumari default plant catalog', () => {
  it('uses real leafy crop names rather than varieties or placeholder labels', () => {
    const spinach = DEFAULT_PLANT_CATALOG.categories.spinach;

    // Malabar Spinach and Amaranth Greens were dropped as duplicates of the
    // rows that carried the care profiles; those rows — Amaranthus and Pasalai
    // Keerai (Basella alba) — then moved here from `vegetable`, along with
    // Purslane and Fenugreek (vendhaya keerai). Agathi followed from `shrub`:
    // agathi keerai is a keerai whatever the plant's habit. Only Palak is
    // really spinach, which is why the tab is labelled "Greens".
    expect(spinach.plants).toEqual([
      'Palak',
      'Water Spinach',
      'Ponnanganni Keerai',
      'Manathakkali Keerai',
      'Mustard Greens',
      'Vallarai Keerai',
      'Purslane',
      'Amaranthus',
      'Pasalai Keerai',
      'Fenugreek',
      'Agathi',
    ]);
    expect(spinach.plants).not.toEqual(
      expect.arrayContaining(['Hybrid Leafy', 'Local Green', 'Winter Spinach'])
    );
  });

  it('points cool-season spinach prompts to the selectable Palak crop', () => {
    for (const month of [9, 10]) {
      expect(KANYAKUMARI_PLANTING_CALENDAR[month]).toContainEqual({
        plantType: 'spinach',
        variety: 'Palak',
        action: 'sow',
      });
    }
  });

  it('includes additional locally useful vegetables with complete display metadata', () => {
    const vegetables = DEFAULT_PLANT_CATALOG.categories.vegetable;
    // Turnip was removed in the September relevance pass — cool-season, and
    // named only by transliteration (டர்னிப்).
    const additions = [
      'Knol Khol',
      'Green Peas',
      'Lablab Bean',
      'Winged Bean',
      'Sword Bean',
      'Watermelon',
      'Muskmelon',
    ];

    expect(vegetables.plants).toEqual(expect.arrayContaining(additions));
    for (const plant of additions) {
      expect(vegetables.varieties[plant]?.length).toBeGreaterThan(0);
      expect(vegetables.tamilNames?.[plant]).toBeTruthy();
      expect(vegetables.descriptions?.[plant]).toBeTruthy();
    }
  });

  it('lists named coconut cultivars and Tamil Nadu hybrids', () => {
    const varieties = DEFAULT_PLANT_CATALOG.categories.coconut_tree.varieties;

    expect(varieties['Dwarf Coconut']).toEqual(
      expect.arrayContaining(['Chowghat Orange Dwarf', 'Chowghat Green Dwarf'])
    );
    expect(varieties['Tall Coconut']).toContain('West Coast Tall');
    expect(varieties['Hybrid Coconut']).toEqual(
      expect.arrayContaining(['VHC 1', 'VHC 2', 'VHC 3'])
    );
  });

  // Membership, not order: the seed array's order is no longer the display
  // order — `getPlantNamesForType` sorts A–Z — so comparing the two literally
  // would only re-assert the sort. What must not drift is the set of names.
  it('builds default profiles from the catalog without a second drifting seed list', () => {
    const bridged = toPlantCatalogShape(DEFAULT_PLANT_PROFILES);
    for (const [type, category] of Object.entries(DEFAULT_PLANT_CATALOG.categories)) {
      const built = bridged.categories[type as keyof typeof bridged.categories];
      expect(sortPlantNames(built.plants)).toEqual(sortPlantNames(category.plants));
      expect(built.plants).toHaveLength(category.plants.length);
      expect(built.varieties).toEqual(category.varieties);
      expect(built.tamilNames).toEqual(category.tamilNames);
      expect(built.descriptions).toEqual(category.descriptions);
    }
  });

  // `PLANT_VARIETIES_BY_TYPE` is a second copy of the catalog's plant names,
  // and it is the one `getKnownPlantNames()` and the whole care registry read.
  // Nothing checked the two agreed until this test: a plant added to one and
  // not the other silently loses its care profile or its reference image.
  it('keeps PLANT_VARIETIES_BY_TYPE in step with the catalog', () => {
    for (const [type, category] of Object.entries(DEFAULT_PLANT_CATALOG.categories)) {
      const varieties = PLANT_VARIETIES_BY_TYPE[type as keyof typeof PLANT_VARIETIES_BY_TYPE];
      expect(sortPlantNames([...varieties])).toEqual(sortPlantNames(category.plants));
    }
  });

  // An override whose (type, name) is not a catalog row still lands in
  // `PLANT_CARE_PROFILES` via Object.assign, and `getPlantingCandidates()`
  // enumerates every key — so a leftover key has the dashboard suggesting you
  // plant something the catalog no longer offers.
  it('has no care-override key without a matching catalog plant', () => {
    const known = new Set<string>();
    for (const [type, category] of Object.entries(DEFAULT_PLANT_CATALOG.categories)) {
      for (const name of category.plants) {
        known.add(buildProfileKey(type as keyof typeof DEFAULT_PLANT_CATALOG.categories, name));
      }
    }
    const orphans = Object.keys(PLANT_CARE_OVERRIDES).filter((key) => !known.has(key));

    expect(orphans).toEqual([]);
  });

  it('presents every category A–Z', () => {
    const bridged = toPlantCatalogShape(DEFAULT_PLANT_PROFILES);
    for (const category of Object.values(bridged.categories)) {
      expect(category.plants).toEqual(sortPlantNames(category.plants));
    }
  });
});
