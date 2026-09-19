import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import { KANYAKUMARI_PLANTING_CALENDAR } from '@/config/kanyakumariPlantingCalendar';
import { DEFAULT_PLANT_PROFILES, toPlantCatalogShape } from '@/services/plantProfiles';
import { sortPlantNames } from '@/utils/plantSort';
import { PLANT_CARE_OVERRIDES } from '@/utils/plantCareDefaults/overrides';
import { buildProfileKey } from '@/utils/plantCareDefaults/profileKey';
import type { PlantType } from '@/types/database.types';

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
      'Roselle',
      'False Daisy',
      'Madras Pea Pumpkin',
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

  // The Tamil Nadu edibles pass. Ivy Gourd and Turkey Berry are the two the
  // catalog was most conspicuously missing.
  it('carries the Tamil Nadu edible staples with complete display metadata', () => {
    const additions: Record<string, string[]> = {
      vegetable: ['Ivy Gourd', 'Turkey Berry', 'Sesame'],
      spinach: ['Roselle', 'False Daisy', 'Madras Pea Pumpkin'],
      herb: ['Adamant Creeper', 'Clove', 'Cinnamon', 'Mango Ginger'],
      fruit_tree: [
        'Tamarind',
        'Jamun',
        'Cashew',
        'Wood Apple',
        'Indian Jujube',
        'Palm Tree',
        'Sweet Lime',
      ],
    };

    for (const [type, names] of Object.entries(additions)) {
      const category =
        DEFAULT_PLANT_CATALOG.categories[type as keyof typeof DEFAULT_PLANT_CATALOG.categories];
      expect(category.plants).toEqual(expect.arrayContaining(names));
      for (const plant of names) {
        expect(category.tamilNames?.[plant]).toBeTruthy();
        expect(category.descriptions?.[plant]).toBeTruthy();
        expect(PLANT_CARE_OVERRIDES[buildProfileKey(type as PlantType, plant)]).toBeDefined();
      }
    }
  });

  // நாவல் is Syzygium cumini, which is now its own row, Jamun. Water Apple is
  // Syzygium aqueum — a different species in the same genus — and had carried
  // Jamun's name since the catalog was written. Two rows under one Tamil name
  // would send a search for நாவல் to whichever sorted first.
  it('gives நாவல் to Jamun alone, not to Water Apple', () => {
    const fruit = DEFAULT_PLANT_CATALOG.categories.fruit_tree;

    expect(fruit.tamilNames?.Jamun).toBe('நாவல்');
    expect(fruit.tamilNames?.['Water Apple']).toBe('ஜாம்பு');

    const tamilNames = Object.values(DEFAULT_PLANT_CATALOG.categories).flatMap((category) =>
      Object.values(category.tamilNames ?? {})
    );
    expect(tamilNames.filter((name) => name === 'நாவல்')).toHaveLength(1);
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
