import { buildPlantPickerItems, derivePlantSeasonLabel } from '@/utils/plantPickerItems';
import { PLANT_CATEGORIES } from '@/services/plantProfiles';
import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';

// plantPickerItems imports the plantProfiles service for the default catalog;
// stub the service's infra imports (jest hoists these above the imports) so
// the pure helpers run without Firebase env/native modules. Firestore itself
// is never mocked (per project rules) — no Firestore call paths run here.
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

const emptyProfiles = (): PlantProfiles =>
  PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantProfiles);

const profile = (overrides: Partial<PlantProfile> = {}): PlantProfile => ({
  plantType: 'vegetable',
  name: 'Test Plant',
  ...overrides,
});

describe('buildPlantPickerItems', () => {
  it('flattens default catalog plants across all categories in category order', () => {
    const items = buildPlantPickerItems(emptyProfiles());

    const brinjal = items.find((i) => i.name === 'Brinjal');
    expect(brinjal?.plantType).toBe('vegetable');

    // Category blocks follow PLANT_CATEGORIES display order.
    const typeSequence: PlantType[] = [];
    for (const item of items) {
      if (typeSequence[typeSequence.length - 1] !== item.plantType) {
        typeSequence.push(item.plantType);
      }
    }
    expect(typeSequence).toEqual(PLANT_CATEGORIES.filter((t) => typeSequence.includes(t)));
  });

  it('includes user-added plants after the defaults of their category', () => {
    const profiles = emptyProfiles();
    profiles.vegetable['My Custom Veg'] = profile({
      name: 'My Custom Veg',
      isUserAdded: true,
    });

    const items = buildPlantPickerItems(profiles);
    const vegetables = items.filter((i) => i.plantType === 'vegetable');
    const custom = vegetables[vegetables.length - 1];
    expect(custom?.name).toBe('My Custom Veg');
  });

  it('prefers user profile data over defaults for the same plant name', () => {
    const profiles = emptyProfiles();
    profiles.vegetable['Brinjal'] = profile({
      name: 'Brinjal',
      growingSeason: 'Summer (Feb–May)',
      varieties: ['Local Purple'],
    });

    const items = buildPlantPickerItems(profiles);
    const brinjal = items.find((i) => i.name === 'Brinjal');
    expect(brinjal?.seasonLabel).toBe('Summer (Feb–May)');
    expect(brinjal?.hasVarieties).toBe(true);
  });
});

describe('derivePlantSeasonLabel', () => {
  it('uses the plant-level growingSeason when present', () => {
    expect(derivePlantSeasonLabel(profile({ growingSeason: 'Year Round' }))).toBe('Year Round');
    expect(derivePlantSeasonLabel(profile({ growingSeason: '  Rabi (Oct–Jan)  ' }))).toBe(
      'Rabi (Oct–Jan)'
    );
  });

  it('returns null when no season data exists', () => {
    expect(derivePlantSeasonLabel(profile())).toBeNull();
    expect(
      derivePlantSeasonLabel(profile({ varietyDetails: { A: { seasonSuitability: ['  '] } } }))
    ).toBeNull();
  });

  it('shows a single variety season phrase as-is', () => {
    expect(
      derivePlantSeasonLabel(
        profile({
          varietyDetails: {
            A: { seasonSuitability: ['Kharif (Jun–Sep)'] },
            B: { seasonSuitability: ['Kharif (Jun–Sep)'] },
          },
        })
      )
    ).toBe('Kharif (Jun–Sep)');
  });

  it('collapses mixed partial coverage to Multi-season', () => {
    expect(
      derivePlantSeasonLabel(
        profile({
          varietyDetails: {
            A: { seasonSuitability: ['Kharif (Jun–Sep)'] },
            B: { seasonSuitability: ['Summer (Feb–May)'] },
          },
        })
      )
    ).toBe('Multi-season');
  });

  it('collapses full-year coverage to Year Round', () => {
    expect(
      derivePlantSeasonLabel(
        profile({
          varietyDetails: {
            A: { seasonSuitability: ['Kharif (Jun–Sep)', 'Rabi (Oct–Jan)'] },
            B: { seasonSuitability: ['Summer (Feb–May)'] },
          },
        })
      )
    ).toBe('Year Round');
  });
});
