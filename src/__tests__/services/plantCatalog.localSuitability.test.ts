import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import { KANYAKUMARI_PLANTING_CALENDAR } from '@/config/kanyakumariPlantingCalendar';
import {
  DEFAULT_PLANT_PROFILES,
  toPlantCatalogShape,
} from '@/services/plantProfiles';

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

    expect(spinach.plants).toEqual([
      'Palak',
      'Malabar Spinach',
      'Water Spinach',
      'Amaranth Greens',
      'Ponnanganni Keerai',
      'Manathakkali Keerai',
      'Mustard Greens',
      'Vallarai Keerai',
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
    const additions = [
      'Turnip',
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

  it('builds default profiles from the catalog without a second drifting seed list', () => {
    const bridged = toPlantCatalogShape(DEFAULT_PLANT_PROFILES);
    for (const [type, category] of Object.entries(DEFAULT_PLANT_CATALOG.categories)) {
      const built = bridged.categories[type as keyof typeof bridged.categories];
      expect(built.plants).toEqual(category.plants);
      expect(built.varieties).toEqual(category.varieties);
      expect(built.tamilNames).toEqual(category.tamilNames);
      expect(built.descriptions).toEqual(category.descriptions);
    }
  });
});
