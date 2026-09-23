import {
  buildCatalogMetaLine,
  buildCatalogSubtitle,
  coreCareSummary,
  diseasesSummary,
  formatCount,
  formatRangeLabel,
  growingInfoSummary,
  joinSummary,
  pestsSummary,
  plantInfoSummary,
  plantingSummary,
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

describe('formatRangeLabel', () => {
  it('formats a complete range', () => {
    expect(formatRangeLabel('75', '95', 'days')).toBe('75-95 days');
  });

  it('formats one-sided ranges', () => {
    expect(formatRangeLabel('75', '', 'days')).toBe('From 75 days');
    expect(formatRangeLabel('', '95', 'days')).toBe('Up to 95 days');
  });

  it('returns undefined when both sides are empty', () => {
    expect(formatRangeLabel('', '', 'days')).toBeUndefined();
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
    expect(summary).toBe('Solanum melongena • Annual • Tamil: கத்தரிக்காய்');
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
    ).toBe('Year Round • 75-95 days • Spacing 60 cm');
    expect(growingInfoSummary(makeCareForm())).toBe(
      'Harvest timing, spacing, and germination'
    );
  });

  it('digests Tolerances, including pet safety in both states', () => {
    expect(
      toleranceSummary({ heatToleranceLabel: 'High', droughtToleranceLabel: 'Low' }, true)
    ).toBe('Heat High • Drought Low • Pet toxic');
    expect(toleranceSummary({}, false)).toBe('Pet safe');
    expect(toleranceSummary({}, undefined)).toBe('Stress tolerance and safety info');
  });

  it('digests Pruning', () => {
    expect(
      pruningSummary(makeCareForm({ pruningFrequencyDays: '21', shapePruningTip: 'Keep 3' }), 3)
    ).toBe('Every 21 days • 3 tips • Shape pruning');
    expect(pruningSummary(makeCareForm(), 0)).toBe('Timing and pruning guidance');
  });

  it('digests Planting', () => {
    expect(plantingSummary('Seedling')).toBe('Starts at Seedling');
    expect(plantingSummary(undefined)).toBe('Default growth stage');
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
  // The row gives one truncated line; a harvest window is a fact a grower can
  // compare between rows, where a description is a sentence they cannot finish.
  it('leads with the harvest window', () => {
    expect(buildCatalogMetaLine({ min: 55, max: 70 }, 'Annual', 'A trailing vine', 3)).toBe(
      '55–70 days'
    );
  });

  it('collapses a point range to a single figure', () => {
    expect(buildCatalogMetaLine({ min: 60, max: 60 }, undefined, undefined, 0)).toBe('60 days');
  });

  it('states a wait of a year or more in years', () => {
    expect(buildCatalogMetaLine({ min: 4380, max: 5475 }, undefined, undefined, 0)).toBe(
      '12–15 years'
    );
    expect(buildCatalogMetaLine({ min: 365, max: 365 }, undefined, undefined, 0)).toBe('1 year');
    expect(buildCatalogMetaLine({ min: 300, max: 400 }, undefined, undefined, 0)).toBe(
      '300–400 days'
    );
  });

  it('falls back to the lifecycle when there is no harvest window', () => {
    expect(buildCatalogMetaLine(undefined, 'Perennial', 'A trailing vine', 3)).toBe('Perennial');
  });

  it('falls back to the description when there is neither', () => {
    expect(buildCatalogMetaLine(undefined, undefined, 'A trailing vine', 3)).toBe(
      'A trailing vine'
    );
  });

  it('falls back to the variety count last, matching the old subtitle', () => {
    expect(buildCatalogMetaLine(undefined, undefined, undefined, 3)).toBe(
      buildCatalogSubtitle(undefined, 3)
    );
    expect(buildCatalogMetaLine(undefined, undefined, undefined, 3)).toBe('3 varieties');
  });

  it('returns undefined when a plant carries none of them', () => {
    expect(buildCatalogMetaLine(undefined, undefined, undefined, 0)).toBeUndefined();
  });

  it('falls back past a 0–0 range instead of printing "0 days"', () => {
    // Timber trees are never harvested; older data wrote that as 0–0.
    expect(buildCatalogMetaLine({ min: 0, max: 0 }, 'Permanent', 'Hardwood', 0)).toBe(
      'Permanent'
    );
  });

  it('ignores a malformed range rather than printing NaN', () => {
    expect(
      buildCatalogMetaLine({ min: Number.NaN, max: 70 }, 'Annual', undefined, 0)
    ).toBe('Annual');
  });
});
