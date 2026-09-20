import { cloneDraft, isCatalogDraftDirty, toOptNum, toRange } from '@/utils/catalogDraft';
import type { CareFormState, CatalogDraft } from '@/utils/catalogDraft';

function makeCareForm(overrides: Partial<CareFormState> = {}): CareFormState {
  return {
    waterRequirement: 'medium',
    wateringFrequencyDays: '2',
    fertilisingFrequencyDays: '14',
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',
    pruningFrequencyDays: '21',
    pruningTips: 'Remove suckers',
    shapePruningTip: '',
    shapePruningMonths: '',
    flowerPruningTip: '',
    flowerPruningMonths: '',
    scientificName: 'Solanum melongena',
    taxonomicFamily: 'Solanaceae',
    lifecycle: 'annual',
    description: 'Elongated purple eggplant',
    tamilName: 'நீள கத்தரிக்காய்',
    growingSeason: 'Year Round',
    daysToHarvestMin: '75',
    daysToHarvestMax: '95',
    yearsToFirstHarvest: '',
    heightCmMin: '45',
    heightCmMax: '120',
    spacingCm: '60',
    plantingDepthCm: '1',
    germinationDaysMin: '7',
    germinationDaysMax: '14',
    germinationTempMin: '22',
    germinationTempMax: '30',
    soilPhMin: '5.5',
    soilPhMax: '6.8',
    heatTolerance: 'high',
    droughtTolerance: 'low',
    feedingIntensity: 'heavy',
    customPests: ['Whiteflies'],
    customDiseases: ['Bacterial Wilt'],
    ...overrides,
  };
}

function makeDraft(overrides: Partial<CatalogDraft> = {}): CatalogDraft {
  return {
    name: 'Long Brinjal',
    careForm: makeCareForm(),
    varieties: ['Mattu Gulla', 'Pusa Purple Long'],
    varietyDetails: {
      'Mattu Gulla': { daysToMaturity: 85, seasonSuitability: ['Year Round'], seedSource: 'TNAU' },
    },
    ...overrides,
  };
}

describe('isCatalogDraftDirty', () => {
  it('is clean while the entry is still loading', () => {
    expect(isCatalogDraftDirty(null, makeDraft())).toBe(false);
  });

  it('is clean for an untouched draft', () => {
    const baseline = cloneDraft(makeDraft());
    expect(isCatalogDraftDirty(baseline, makeDraft())).toBe(false);
  });

  it('ignores a whitespace-only name change', () => {
    const baseline = cloneDraft(makeDraft());
    expect(isCatalogDraftDirty(baseline, makeDraft({ name: '  Long Brinjal  ' }))).toBe(false);
  });

  it('flags a real name change', () => {
    const baseline = cloneDraft(makeDraft());
    expect(isCatalogDraftDirty(baseline, makeDraft({ name: 'Short Brinjal' }))).toBe(true);
  });

  it.each([
    ['waterRequirement', { waterRequirement: 'low' as const }],
    ['wateringFrequencyDays', { wateringFrequencyDays: '3' }],
    ['lifecycle', { lifecycle: 'perennial' as const }],
    ['description', { description: 'Changed' }],
    ['soilPhMax', { soilPhMax: '7.0' }],
    ['feedingIntensity', { feedingIntensity: 'light' as const }],
  ])('flags a change to %s', (_label, patch) => {
    const baseline = cloneDraft(makeDraft());
    const current = makeDraft({ careForm: makeCareForm(patch) });
    expect(isCatalogDraftDirty(baseline, current)).toBe(true);
  });

  it('flags added and removed custom pests', () => {
    const baseline = cloneDraft(makeDraft());
    const added = makeDraft({ careForm: makeCareForm({ customPests: ['Whiteflies', 'Thrips'] }) });
    const removed = makeDraft({ careForm: makeCareForm({ customPests: [] }) });
    expect(isCatalogDraftDirty(baseline, added)).toBe(true);
    expect(isCatalogDraftDirty(baseline, removed)).toBe(true);
  });

  it('flags a reordered custom pest list', () => {
    const baseline = cloneDraft(makeDraft({ careForm: makeCareForm({ customPests: ['a', 'b'] }) }));
    const current = makeDraft({ careForm: makeCareForm({ customPests: ['b', 'a'] }) });
    expect(isCatalogDraftDirty(baseline, current)).toBe(true);
  });

  it('flags variety add and removal', () => {
    const baseline = cloneDraft(makeDraft());
    expect(isCatalogDraftDirty(baseline, makeDraft({ varieties: ['Mattu Gulla'] }))).toBe(true);
    expect(
      isCatalogDraftDirty(baseline, makeDraft({ varieties: [...makeDraft().varieties, 'New'] }))
    ).toBe(true);
  });

  it('flags a variety detail edit', () => {
    const baseline = cloneDraft(makeDraft());
    const current = makeDraft({
      varietyDetails: {
        'Mattu Gulla': {
          daysToMaturity: 90,
          seasonSuitability: ['Year Round'],
          seedSource: 'TNAU',
        },
      },
    });
    expect(isCatalogDraftDirty(baseline, current)).toBe(true);
  });

  it('flags a seasonSuitability change', () => {
    const baseline = cloneDraft(makeDraft());
    const current = makeDraft({
      varietyDetails: {
        'Mattu Gulla': {
          daysToMaturity: 85,
          seasonSuitability: ['Summer (Feb–May)'],
          seedSource: 'TNAU',
        },
      },
    });
    expect(isCatalogDraftDirty(baseline, current)).toBe(true);
  });

  it('stays clean when varietyDetails keys are inserted in a different order', () => {
    const first: CatalogDraft = makeDraft({
      varieties: ['A', 'B'],
      varietyDetails: { A: { notes: 'a' }, B: { notes: 'b' } },
    });
    const reordered: CatalogDraft = makeDraft({
      varieties: ['A', 'B'],
      varietyDetails: { B: { notes: 'b' }, A: { notes: 'a' } },
    });
    expect(isCatalogDraftDirty(cloneDraft(first), reordered)).toBe(false);
  });

  it('is clean after an edit is reverted', () => {
    const baseline = cloneDraft(makeDraft());
    const edited = makeDraft({ careForm: makeCareForm({ spacingCm: '90' }) });
    expect(isCatalogDraftDirty(baseline, edited)).toBe(true);
    expect(isCatalogDraftDirty(baseline, makeDraft())).toBe(false);
  });
});

describe('cloneDraft', () => {
  it('does not alias arrays into the original', () => {
    const original = makeDraft();
    const copy = cloneDraft(original);
    copy.careForm.customPests.push('Aphids');
    copy.varieties.push('Another');
    expect(original.careForm.customPests).toEqual(['Whiteflies']);
    expect(original.varieties).toHaveLength(2);
  });
});

describe('toRange / toOptNum', () => {
  it('returns undefined when either side is missing', () => {
    expect(toRange('', '95')).toBeUndefined();
    expect(toRange('75', '')).toBeUndefined();
  });

  it('parses a complete range, including decimals', () => {
    expect(toRange('75', '95')).toEqual({ min: 75, max: 95 });
    expect(toRange('5.5', '6.8')).toEqual({ min: 5.5, max: 6.8 });
  });

  it('parses optional scalars', () => {
    expect(toOptNum('60')).toBe(60);
    expect(toOptNum('')).toBeUndefined();
    expect(toOptNum('abc')).toBeUndefined();
  });
});
