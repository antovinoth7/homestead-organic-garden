import {
  buildCatalogMetaLine,
  buildCatalogSubtitle,
  coreCareSummary,
  diseasesSummary,
  formatCount,
  growingInfoSummary,
  joinSummary,
  pestsSummary,
  plantInfoSummary,
  pruningSummary,
  toleranceSummary,
  varietiesSummary,
} from '@/utils/catalogSummaries';
import type { CareFormState } from '@/utils/catalogDraft';

function makeCareForm(overrides: Partial<CareFormState> = {}): CareFormState {
  return {
    waterRequirement: 'medium',
    wateringFrequencyDays: '',
    fertilisingFrequencyDays: '',
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',
    pruningFrequencyDays: '',
    pruningTips: '',
    shapePruningTip: '',
    shapePruningMonths: '',
    flowerPruningTip: '',
    flowerPruningMonths: '',
    scientificName: '',
    taxonomicFamily: '',
    lifecycle: '',
    description: '',
    tamilName: '',
    growingSeason: '',
    daysToHarvestMin: '',
    daysToHarvestMax: '',
    yearsToFirstHarvest: '',
    heightCmMin: '',
    heightCmMax: '',
    spacingCm: '',
    plantingDepthCm: '',
    germinationDaysMin: '',
    germinationDaysMax: '',
    germinationTempMin: '',
    germinationTempMax: '',
    soilPhMin: '',
    soilPhMax: '',
    heatTolerance: '',
    droughtTolerance: '',
    feedingIntensity: '',
    customPests: [],
    customDiseases: [],
    ...overrides,
  };
}

describe('joinSummary', () => {
  it('joins present values with a bullet', () => {
    expect(joinSummary(['a', 'b', 'c'])).toBe('a • b • c');
  });

  it('drops null, undefined, empty and whitespace-only parts', () => {
    expect(joinSummary(['a', null, undefined, '', '   ', 'b'])).toBe('a • b');
  });

  it('returns undefined when nothing survives, so callers can fall back', () => {
    expect(joinSummary([null, undefined, '', '  '])).toBeUndefined();
  });
});

describe('formatCount', () => {
  it('uses the singular for one', () => {
    expect(formatCount(1, 'tip')).toBe('1 tip');
  });

  it('appends s by default for other counts', () => {
    expect(formatCount(0, 'tip')).toBe('0 tips');
    expect(formatCount(3, 'tip')).toBe('3 tips');
  });

  it('honours an explicit plural', () => {
    expect(formatCount(2, 'linked disease', 'linked diseases')).toBe('2 linked diseases');
    expect(formatCount(1, 'linked disease', 'linked diseases')).toBe('1 linked disease');
  });
});

describe('section summaries', () => {
  it('describes the section when Plant Info is empty', () => {
    expect(plantInfoSummary(makeCareForm(), {})).toBe('Name, identity, and description');
  });

  it('digests Plant Info when filled', () => {
    const summary = plantInfoSummary(
      makeCareForm({ scientificName: 'Solanum melongena', tamilName: 'கத்தரிக்காய்' }),
      { lifecycleLabel: 'Annual' }
    );
    expect(summary).toBe('கத்தரிக்காய் • Annual • Solanum melongena');
  });

  it('digests Core Care', () => {
    expect(
      coreCareSummary(makeCareForm({ wateringFrequencyDays: '2' }), {
        waterRequirementLabel: 'Medium',
        sunlightLabel: 'Full Sun',
      })
    ).toBe('Medium • Water every 2 days • Full Sun');
    expect(coreCareSummary(makeCareForm(), {})).toBe('Water, sunlight, and soil defaults');
  });

  it('digests Growing Info', () => {
    expect(
      growingInfoSummary(
        makeCareForm({
          growingSeason: 'Year Round',
          daysToHarvestMin: '75',
          daysToHarvestMax: '95',
          spacingCm: '60',
        })
      )
    ).toBe('Year Round • Harvest in 75–95 days • Spacing 60 cm');
    expect(growingInfoSummary(makeCareForm())).toBe('Harvest timing, spacing, and germination');
  });

  it('digests Tolerances, including pet safety in both states', () => {
    expect(
      toleranceSummary({ heatToleranceLabel: 'High', droughtToleranceLabel: 'Low' }, true)
    ).toBe('Heat High • Drought Low • Toxic to pets');
    expect(toleranceSummary({}, false)).toBe('Safe for pets');
    expect(toleranceSummary({}, undefined)).toBe('Stress tolerance and safety info');
  });

  it('digests Pruning', () => {
    expect(
      pruningSummary(makeCareForm({ pruningFrequencyDays: '21', shapePruningTip: 'Keep 3' }), 3)
    ).toBe('Every 21 days • 3 tips • Shape pruning');
    expect(pruningSummary(makeCareForm(), 0)).toBe('Timing and pruning guidance');
  });


  it('digests the linked-list sections with their empty fallbacks', () => {
    expect(pestsSummary(7)).toBe('7 linked pests');
    expect(pestsSummary(1)).toBe('1 linked pest');
    expect(pestsSummary(0)).toBe('No linked pests');

    expect(diseasesSummary(6)).toBe('6 linked diseases');
    expect(diseasesSummary(1)).toBe('1 linked disease');
    expect(diseasesSummary(0)).toBe('No linked diseases');

    expect(varietiesSummary(2)).toBe('2 saved varieties');
    expect(varietiesSummary(1)).toBe('1 saved variety');
    expect(varietiesSummary(0)).toBe('No saved varieties');
  });
});

describe('buildCatalogMetaLine', () => {
  const base = { treeLike: false, varietyCount: 0 };

  // The row gives one truncated line; a harvest window is a fact a grower can
  // compare between rows, where a description is a sentence they cannot finish.
  it('leads with the harvest window, saying what it measures', () => {
    expect(
      buildCatalogMetaLine({
        ...base,
        daysToHarvest: { min: 55, max: 70 },
        lifecycleLabel: 'Annual',
        description: 'A trailing vine',
        varietyCount: 3,
      })
    ).toBe('Harvest in 55–70 days');
  });

  it('collapses a point range to a single figure', () => {
    expect(buildCatalogMetaLine({ ...base, daysToHarvest: { min: 60, max: 60 } })).toBe(
      'Harvest in 60 days'
    );
  });

  it('states a wait of a year or more in years', () => {
    expect(buildCatalogMetaLine({ ...base, daysToHarvest: { min: 4380, max: 5475 } })).toBe(
      'Harvest in 12–15 years'
    );
    expect(buildCatalogMetaLine({ ...base, daysToHarvest: { min: 365, max: 365 } })).toBe(
      'Harvest in 1 year'
    );
    expect(buildCatalogMetaLine({ ...base, daysToHarvest: { min: 300, max: 400 } })).toBe(
      'Harvest in 300–400 days'
    );
  });

  it('gives a tree its years to first harvest, not its fruit-development days', () => {
    // Mango: fruit takes 90–150 days to develop, the sapling 5 years to bear.
    expect(
      buildCatalogMetaLine({
        ...base,
        treeLike: true,
        daysToHarvest: { min: 90, max: 150 },
        yearsToFirstHarvest: 5,
      })
    ).toBe('First harvest in 5 years');
    expect(buildCatalogMetaLine({ ...base, treeLike: true, yearsToFirstHarvest: 1 })).toBe(
      'First harvest in 1 year'
    );
  });

  it('keeps days for a tree with no years figure', () => {
    expect(
      buildCatalogMetaLine({ ...base, treeLike: true, daysToHarvest: { min: 270, max: 365 } })
    ).toBe('Harvest in 270–365 days');
  });

  it('falls back to the lifecycle when there is no harvest window', () => {
    expect(
      buildCatalogMetaLine({ ...base, lifecycleLabel: 'Perennial', description: 'A vine' })
    ).toBe('Perennial');
  });

  it('skips a lifecycle that only repeats the habit shown beside it', () => {
    expect(
      buildCatalogMetaLine({
        ...base,
        lifecycleLabel: 'Annual',
        habitLabel: 'Annual',
        description: 'A leafy green',
      })
    ).toBe('A leafy green');
  });

  it('falls back to the description when there is neither', () => {
    expect(buildCatalogMetaLine({ ...base, description: 'A trailing vine', varietyCount: 3 })).toBe(
      'A trailing vine'
    );
  });

  it('falls back to the variety count last, matching the old subtitle', () => {
    expect(buildCatalogMetaLine({ ...base, varietyCount: 3 })).toBe(
      buildCatalogSubtitle(undefined, 3)
    );
    expect(buildCatalogMetaLine({ ...base, varietyCount: 3 })).toBe('3 varieties');
  });

  it('returns undefined when a plant carries none of them', () => {
    expect(buildCatalogMetaLine(base)).toBeUndefined();
  });

  it('falls back past a 0–0 range instead of printing "0 days"', () => {
    // Timber trees are never harvested; older data wrote that as 0–0.
    expect(
      buildCatalogMetaLine({
        ...base,
        daysToHarvest: { min: 0, max: 0 },
        lifecycleLabel: 'Permanent',
      })
    ).toBe('Permanent');
  });

  it('ignores a malformed range rather than printing NaN', () => {
    expect(
      buildCatalogMetaLine({
        ...base,
        daysToHarvest: { min: Number.NaN, max: 70 },
        lifecycleLabel: 'Annual',
      })
    ).toBe('Annual');
  });
});
