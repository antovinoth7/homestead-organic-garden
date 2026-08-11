import {
  ERROR_FIELD_ORDER,
  FIELD_TO_SECTION,
  SECTION_TO_TAB,
  firstErroredField,
  sectionHasError,
  validateCatalogDraft,
} from '@/utils/catalogValidation';
import type { CatalogSectionKey } from '@/utils/catalogValidation';
import type { CareFormState } from '@/utils/catalogDraft';

function makeCareForm(overrides: Partial<CareFormState> = {}): CareFormState {
  return {
    waterRequirement: 'medium',
    wateringFrequencyDays: '2',
    fertilisingFrequencyDays: '14',
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

describe('validateCatalogDraft — name', () => {
  it('requires a name', () => {
    expect(validateCatalogDraft('', makeCareForm()).name).toBeDefined();
    expect(validateCatalogDraft('   ', makeCareForm()).name).toBeDefined();
  });

  it('accepts a real name', () => {
    expect(validateCatalogDraft('Brinjal', makeCareForm()).name).toBeUndefined();
  });
});

describe('validateCatalogDraft — frequencies', () => {
  it.each(['', '0', 'abc'])('rejects watering frequency %p', (value) => {
    const errors = validateCatalogDraft('Brinjal', makeCareForm({ wateringFrequencyDays: value }));
    expect(errors.wateringFrequencyDays).toBeDefined();
  });

  it('accepts a watering frequency of 1 or more', () => {
    const errors = validateCatalogDraft('Brinjal', makeCareForm({ wateringFrequencyDays: '1' }));
    expect(errors.wateringFrequencyDays).toBeUndefined();
  });

  it.each(['', '0', 'abc'])('rejects fertilising frequency %p', (value) => {
    const errors = validateCatalogDraft(
      'Brinjal',
      makeCareForm({ fertilisingFrequencyDays: value })
    );
    expect(errors.fertilisingFrequencyDays).toBeDefined();
  });
});

describe('validateCatalogDraft — ranges', () => {
  const cases: [string, Partial<CareFormState>, keyof ReturnType<typeof validateCatalogDraft>][] = [
    ['daysToHarvest', { daysToHarvestMin: '95', daysToHarvestMax: '75' }, 'daysToHarvest'],
    ['heightCm', { heightCmMin: '120', heightCmMax: '45' }, 'heightCm'],
    ['germinationDays', { germinationDaysMin: '14', germinationDaysMax: '7' }, 'germinationDays'],
    [
      'germinationTempC',
      { germinationTempMin: '30', germinationTempMax: '22' },
      'germinationTempC',
    ],
    ['soilPhRange', { soilPhMin: '6.8', soilPhMax: '5.5' }, 'soilPhRange'],
  ];

  it.each(cases)('flags an inverted %s range', (_label, patch, key) => {
    expect(validateCatalogDraft('Brinjal', makeCareForm(patch))[key]).toBeDefined();
  });

  it('accepts a min equal to the max', () => {
    const errors = validateCatalogDraft(
      'Brinjal',
      makeCareForm({ daysToHarvestMin: '80', daysToHarvestMax: '80' })
    );
    expect(errors.daysToHarvest).toBeUndefined();
  });

  it('accepts a correctly ordered range', () => {
    const errors = validateCatalogDraft(
      'Brinjal',
      makeCareForm({ daysToHarvestMin: '75', daysToHarvestMax: '95' })
    );
    expect(errors.daysToHarvest).toBeUndefined();
  });

  it('ignores a half-filled range', () => {
    expect(
      validateCatalogDraft('Brinjal', makeCareForm({ daysToHarvestMin: '75' })).daysToHarvest
    ).toBeUndefined();
    expect(
      validateCatalogDraft('Brinjal', makeCareForm({ daysToHarvestMax: '95' })).daysToHarvest
    ).toBeUndefined();
  });

  it('ignores an entirely blank range', () => {
    expect(validateCatalogDraft('Brinjal', makeCareForm()).daysToHarvest).toBeUndefined();
  });
});

describe('firstErroredField', () => {
  it('returns null when the draft is valid', () => {
    expect(firstErroredField(validateCatalogDraft('Brinjal', makeCareForm()))).toBeNull();
  });

  it('returns errors in document order, not object-key order', () => {
    const errors = validateCatalogDraft(
      '',
      makeCareForm({ daysToHarvestMin: '95', daysToHarvestMax: '75' })
    );
    expect(firstErroredField(errors)).toBe('name');
  });

  it('falls through to the next field in order once earlier ones pass', () => {
    const errors = validateCatalogDraft(
      'Brinjal',
      makeCareForm({ wateringFrequencyDays: '0', soilPhMin: '7', soilPhMax: '5' })
    );
    expect(firstErroredField(errors)).toBe('wateringFrequencyDays');
  });
});

describe('sectionHasError', () => {
  it('attributes each error to its owning section', () => {
    const errors = validateCatalogDraft('', makeCareForm({ wateringFrequencyDays: '0' }));
    expect(sectionHasError(errors, 'plantInfo')).toBe(true);
    expect(sectionHasError(errors, 'coreCare')).toBe(true);
    expect(sectionHasError(errors, 'growingInfo')).toBe(false);
    expect(sectionHasError(errors, 'varieties')).toBe(false);
  });
});

describe('mapping tables', () => {
  it('maps every errorable field to a section', () => {
    for (const field of ERROR_FIELD_ORDER) {
      expect(FIELD_TO_SECTION[field]).toBeDefined();
    }
    expect(Object.keys(FIELD_TO_SECTION)).toHaveLength(ERROR_FIELD_ORDER.length);
  });

  it('maps every section to a tab', () => {
    const sections: CatalogSectionKey[] = [
      'plantInfo',
      'coreCare',
      'pruning',
      'growingInfo',
      'planting',
      'tolerances',
      'pests',
      'diseases',
      'varieties',
    ];
    for (const section of sections) {
      expect(SECTION_TO_TAB[section]).toBeDefined();
    }
    expect(Object.keys(SECTION_TO_TAB)).toHaveLength(sections.length);
  });

  it('routes every errorable field to a reachable tab', () => {
    for (const field of ERROR_FIELD_ORDER) {
      expect(['basics', 'care', 'growing', 'health', 'varieties']).toContain(
        SECTION_TO_TAB[FIELD_TO_SECTION[field]]
      );
    }
  });
});
