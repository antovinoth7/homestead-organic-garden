import { RENAMED_SEASONS_V15, planSeasonRename } from '@/migrations/renamedSeasonsLogic';
import { GROWING_SEASON_OPTIONS } from '@/utils/plantLabels';
import { makePlantProfile, makePlantProfiles } from '../fixtures/plant.fixtures';

const OPTION_VALUES = new Set(GROWING_SEASON_OPTIONS.map((option) => option.value));

describe('migration 015 — retire Kharif/Rabi season names', () => {
  it('renames onto values the season picker actually offers', () => {
    for (const target of Object.values(RENAMED_SEASONS_V15)) {
      expect(OPTION_VALUES.has(target)).toBe(true);
    }
  });

  it('renames a stored growingSeason', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ name: 'Cowpea', growingSeason: 'Kharif (Jun–Sep)' }),
    ]);

    const next = planSeasonRename(profiles);

    expect(next?.vegetable.Cowpea?.growingSeason).toBe('SW Monsoon (Jun–Sep)');
  });

  it('renames and de-duplicates variety season suitability', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({
        name: 'Tomato',
        varietyDetails: {
          PKM1: {
            daysToMaturity: 70,
            seasonSuitability: ['Kharif (Jun–Sep)', 'SW Monsoon (Jun–Sep)', 'Rabi (Oct–Jan)'],
          },
          Untouched: { seasonSuitability: ['Year Round'] },
        },
      }),
    ]);

    const next = planSeasonRename(profiles);
    const details = next?.vegetable.Tomato?.varietyDetails;

    expect(details?.PKM1).toEqual({
      daysToMaturity: 70,
      seasonSuitability: ['SW Monsoon (Jun–Sep)', 'NE Monsoon + Winter (Oct–Feb)'],
    });
    expect(details?.Untouched).toBe(profiles.vegetable.Tomato?.varietyDetails?.Untouched);
  });

  it('leaves free-text seasons as written', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ name: 'Okra', growingSeason: 'Southwest Monsoon (Jun–Sep)' }),
      makePlantProfile({ name: 'Brinjal', growingSeason: 'Year Round' }),
    ]);

    expect(planSeasonRename(profiles)).toBeNull();
  });

  it('does not mutate the input and writes nothing on a second run', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({
        plantType: 'spinach',
        name: 'Palak',
        growingSeason: 'Rabi + Summer',
      }),
    ]);

    const next = planSeasonRename(profiles);

    expect(profiles.spinach.Palak?.growingSeason).toBe('Rabi + Summer');
    expect(next?.spinach.Palak?.growingSeason).toBe('Winter + Summer (Jan–May)');
    // Untouched buckets are shared, not copied.
    expect(next?.vegetable).toBe(profiles.vegetable);
    expect(planSeasonRename(next!)).toBeNull();
  });
});
