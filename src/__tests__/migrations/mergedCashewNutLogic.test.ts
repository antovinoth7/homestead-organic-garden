import {
  MERGED_PLANT_NAMES_V16,
  MERGED_SURVIVOR_TYPE_V16,
  planCashewNutMerge,
} from '@/migrations/mergedCashewNutLogic';
import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import type { PlantProfile, PlantType } from '@/types/database.types';
import { makePlantProfile, makePlantProfiles } from '../fixtures/plant.fixtures';

/** Stands in for the bundled Cashew record the migration reads at runtime. */
const CURATED_CASHEW: PlantProfile = makePlantProfile({
  plantType: 'fruit_tree',
  name: 'Cashew',
  description: 'Salt- and drought-tolerant coastal tree',
  wateringFrequencyDays: 10,
  varieties: ['VRI 3', 'Ullal 3'],
});

const bundled = (type: PlantType, name: string): PlantProfile | undefined =>
  type === 'fruit_tree' && name === 'Cashew' ? CURATED_CASHEW : undefined;

const isCatalogRow = (type: PlantType, name: string): boolean =>
  PLANT_CATALOG_ENTRIES.some((entry) => entry.plantType === type && entry.name === name);

/** A user-added entry as the catalog form saved it: a full, generic record. */
const cashewNut = (overrides: Partial<PlantProfile> = {}): PlantProfile =>
  makePlantProfile({
    plantType: 'fruit_tree',
    name: 'Cashew Nut',
    isUserAdded: true,
    description: 'Generic fruit tree default',
    wateringFrequencyDays: 3,
    varieties: ['VRI 3', 'Local'],
    varietyDetails: { 'VRI 3': { daysToMaturity: 900, notes: 'From the farm fair' } },
    customPests: ['Tea Mosquito Bug'],
    ...overrides,
  });

describe('migration 016 — Cashew Nut → Cashew', () => {
  it('merges onto a row the bundled catalog actually has', () => {
    for (const [from, to] of Object.entries(MERGED_PLANT_NAMES_V16)) {
      const type = MERGED_SURVIVOR_TYPE_V16[to]!;
      expect(isCatalogRow(type, to)).toBe(true);
      expect(isCatalogRow(type, from)).toBe(false);
    }
  });

  it('keeps the curated Cashew record and folds in only the user’s additions', () => {
    const next = planCashewNutMerge(makePlantProfiles([cashewNut()]), bundled, 1000);
    const cashew = next?.fruit_tree.Cashew;

    expect(cashew?.description).toBe(CURATED_CASHEW.description);
    expect(cashew?.wateringFrequencyDays).toBe(10);
    // Case-insensitive union with the bundled list; "VRI 3" is not repeated.
    expect(cashew?.varieties).toEqual(['VRI 3', 'Ullal 3', 'Local']);
    expect(cashew?.varietyDetails?.['VRI 3']?.notes).toBe('From the farm fair');
    expect(cashew?.customPests).toContain('Tea Mosquito Bug');
  });

  it('writes no undefined fields when seeding from a bundled record that has them', () => {
    // The bundled records carry explicit undefined keys; Firestore rejects them.
    const sparse = (type: PlantType, name: string): PlantProfile | undefined =>
      type === 'fruit_tree' && name === 'Cashew'
        ? { ...CURATED_CASHEW, tamilName: undefined, varietyDetails: undefined }
        : undefined;
    const next = planCashewNutMerge(
      makePlantProfiles([cashewNut({ varietyDetails: undefined })]),
      sparse,
      1000
    );
    const cashew = next?.fruit_tree.Cashew;

    expect(cashew).toBeDefined();
    expect(Object.values(cashew ?? {})).not.toContain(undefined);
  });

  it('tombstones the retired name so it leaves the catalog', () => {
    const next = planCashewNutMerge(makePlantProfiles([cashewNut()]), bundled, 1000);

    expect(next?.fruit_tree['Cashew Nut']).toEqual({
      plantType: 'fruit_tree',
      name: 'Cashew Nut',
      isDeleted: true,
      deletedAt: 1000,
    });
  });

  it('builds on the user’s own Cashew edits when they exist, and keeps them winning', () => {
    const edited = makePlantProfile({
      plantType: 'fruit_tree',
      name: 'Cashew',
      description: 'My own notes',
      varieties: ['vri 3'],
      varietyDetails: { 'VRI 3': { notes: 'Mine' } },
    });

    const next = planCashewNutMerge(makePlantProfiles([edited, cashewNut()]), bundled);
    const cashew = next?.fruit_tree.Cashew;

    expect(cashew?.description).toBe('My own notes');
    // Case-insensitive union: "VRI 3" is already there as "vri 3".
    expect(cashew?.varieties).toEqual(['vri 3', 'Local']);
    expect(cashew?.varietyDetails?.['VRI 3']).toEqual({ notes: 'Mine' });
  });

  it('leaves the account alone when the user hid Cashew', () => {
    const hidden = makePlantProfile({ plantType: 'fruit_tree', name: 'Cashew', isDeleted: true });

    expect(planCashewNutMerge(makePlantProfiles([hidden, cashewNut()]), bundled)).toBeNull();
  });

  it('writes nothing on a second run or for an account without the entry', () => {
    const first = planCashewNutMerge(makePlantProfiles([cashewNut()]), bundled);

    expect(first).not.toBeNull();
    expect(planCashewNutMerge(first!, bundled)).toBeNull();
    expect(planCashewNutMerge(makePlantProfiles([]), bundled)).toBeNull();
  });
});
