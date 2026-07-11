/// <reference types="jest" />
import {
  computeExpectedGrowthStage,
  computeAnnualCycleStage,
  getEffectiveGrowthStage,
  getValidStagesForPlant,
  COCONUT_STAGE_DURATIONS,
  STAGE_ORDER,
} from '../../utils/plantHelpers';
import { DEFAULT_PROFILES_BY_TYPE } from '../../utils/plantCareDefaults/typeDefaults';
import type {
  GrowthStageDurations,
  AnnualCycleDurations,
  Plant,
  PlantCareProfile,
} from '../../types/database.types';

function plantingDateDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

describe('computeExpectedGrowthStage', () => {
  const tomatoDurations: GrowthStageDurations = {
    seedling: 21,
    vegetative: 25,
    flowering: 15,
    fruiting: 40,
    mature: 20,
  };

  it('returns seedling on day 1', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 1);
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('seedling');
    expect(result!.daysSinceStageStart).toBe(1);
  });

  it('returns vegetative after seedling days', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 25); // 25 days ago (past 21-day seedling)
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('vegetative');
  });

  it('returns flowering at correct time', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 50); // seedling(21) + vegetative(25) + 4 = flowering
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('flowering');
  });

  it('returns last stage when past all durations', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 200); // way past total of 121 days
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('mature');
  });

  it('returns null for empty durations', () => {
    const result = computeExpectedGrowthStage('2025-01-01', {});
    expect(result).toBeNull();
  });

  it('computes percentComplete correctly', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 10); // 10 days into 21-day seedling
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('seedling');
    expect(result!.percentComplete).toBeCloseTo((10 / 21) * 100, 0);
    expect(result!.daysUntilNextStage).toBe(11);
  });
});

describe('computeAnnualCycleStage', () => {
  const mangoCycle: AnnualCycleDurations = {
    flowering: 45,
    fruiting: 90,
    vegetative: 120,
    dormant: 110,
  };

  it('returns null if tree is too young', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 365); // 1 year old
    const result = computeAnnualCycleStage(
      plantingDate.toISOString().slice(0, 10),
      5, // 5 years to first harvest
      mangoCycle,
      11 // flowering starts November
    );
    expect(result).toBeNull();
  });

  it('returns a stage for a mature tree', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setFullYear(plantingDate.getFullYear() - 10); // 10 years old
    const result = computeAnnualCycleStage(
      plantingDate.toISOString().slice(0, 10),
      5,
      mangoCycle,
      11
    );
    expect(result).not.toBeNull();
    expect(STAGE_ORDER).toContain(result!.stage);
  });
});

describe('getEffectiveGrowthStage', () => {
  const basePlant = {
    id: 'test-1',
    user_id: 'u1',
    name: 'Tomato',
    plant_type: 'vegetable' as const,
    plant_variety: 'Tomato',
    planting_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    location: 'Garden',
    space_type: 'ground' as const,
    photo_url: null,
    growth_stage: 'seedling' as const,
    health_status: 'healthy' as const,
  } satisfies Partial<Plant> as Plant;

  const baseProfile: PlantCareProfile = {
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: undefined,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    waterRequirement: 'medium',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',

    growthStageDurations: {
      seedling: 21,
      vegetative: 25,
      flowering: 15,
      fruiting: 40,
      mature: 20,
    },
  };

  it('returns pinned stage when plant has growth_stage_pinned', () => {
    const plant = { ...basePlant, growth_stage_pinned: 'flowering' as const };
    const result = getEffectiveGrowthStage(plant, baseProfile);
    expect(result.stage).toBe('flowering');
    expect(result.source).toBe('pinned');
  });

  it('returns computed stage from durations', () => {
    const result = getEffectiveGrowthStage(basePlant, baseProfile);
    expect(result.source).toBe('computed');
    expect(STAGE_ORDER).toContain(result.stage);
  });

  it('returns manual fallback when no durations', () => {
    const profileNoDurations = { ...baseProfile, growthStageDurations: undefined };
    const result = getEffectiveGrowthStage(basePlant, profileNoDurations);
    expect(result.stage).toBe('seedling');
    expect(result.source).toBe('manual');
  });

  it('returns coconut source for coconut_tree', () => {
    const coconutPlant: Plant = {
      ...basePlant,
      plant_type: 'coconut_tree',
      plant_variety: 'East Coast Tall',
      planting_date: new Date(Date.now() - 365 * 5 * 86400000).toISOString().slice(0, 10),
    };
    const coconutProfile = { ...baseProfile, growthStageDurations: undefined };
    const result = getEffectiveGrowthStage(coconutPlant, coconutProfile);
    expect(result.source).toBe('coconut');
  });

  it('attaches timeline metrics to the coconut stage', () => {
    const coconutPlant: Plant = {
      ...basePlant,
      plant_type: 'coconut_tree',
      plant_variety: 'East Coast Tall',
      planting_date: plantingDateDaysAgo(Math.round(365.25 * 4.5)), // 4.5 years → flowering
    };
    const result = getEffectiveGrowthStage(coconutPlant, null);
    expect(result.source).toBe('coconut');
    expect(result.stage).toBe('flowering');
    expect(result.percentComplete).toBeGreaterThanOrEqual(0);
    expect(result.daysSinceStageStart).toBeGreaterThan(0);
  });

  it('maps coconut ages to the expected stages', () => {
    const stageAt = (years: number): string => {
      const plant: Plant = {
        ...basePlant,
        plant_type: 'coconut_tree',
        planting_date: plantingDateDaysAgo(Math.round(365.25 * years)),
      };
      return getEffectiveGrowthStage(plant, null).stage;
    };
    expect(stageAt(2)).toBe('vegetative');
    expect(stageAt(4.5)).toBe('flowering');
    expect(stageAt(10)).toBe('fruiting');
    expect(stageAt(25)).toBe('mature');
  });

  it('reaches an annual-cycle stage for an unknown fruit-tree variety on the type default', () => {
    const treePlant: Plant = {
      ...basePlant,
      plant_type: 'fruit_tree',
      plant_variety: 'Some Unknown Tree',
      planting_date: plantingDateDaysAgo(365 * 6), // 6 years > default yearsToFirstHarvest
    };
    const result = getEffectiveGrowthStage(treePlant, DEFAULT_PROFILES_BY_TYPE.fruit_tree);
    expect(result.source).toBe('annual_cycle');
    expect(['flowering', 'fruiting', 'dormant']).toContain(result.stage);
  });
});

describe('dormant-after-mature ordering (turmeric/ginger die-back)', () => {
  const turmericDurations: GrowthStageDurations = {
    seedling: 30,
    vegetative: 120,
    mature: 90,
    dormant: 30,
  };

  it('is mature after vegetative, not dormant', () => {
    // Day 160: past seedling(30)+vegetative(120)=150, inside mature(90).
    const result = computeExpectedGrowthStage(plantingDateDaysAgo(160), turmericDurations);
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('mature');
  });

  it('reaches dormant only after the mature phase ends', () => {
    // Day 250: past 30+120+90=240, inside dormant.
    const result = computeExpectedGrowthStage(plantingDateDaysAgo(250), turmericDurations);
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('dormant');
  });

  it('orders dormant after mature in STAGE_ORDER', () => {
    expect(STAGE_ORDER.indexOf('dormant')).toBeGreaterThan(STAGE_ORDER.indexOf('mature'));
  });
});

describe('getValidStagesForPlant', () => {
  const makePlantOfType = (plant_type: Plant['plant_type']): Plant =>
    ({
      id: 'p1',
      user_id: 'u1',
      name: 'Test',
      plant_type,
      photo_url: null,
      space_type: 'ground',
      location: 'Garden',
      created_at: '2026-01-01T00:00:00.000Z',
    }) as Plant;

  const profileWith = (
    growthStageDurations?: GrowthStageDurations,
    annualCycleDurations?: AnnualCycleDurations
  ): PlantCareProfile =>
    ({
      growthStageDurations,
      annualCycleDurations,
    }) as PlantCareProfile;

  it('excludes stages a vegetable can never be in', () => {
    const stages = getValidStagesForPlant(
      makePlantOfType('vegetable'),
      profileWith({ seedling: 18, vegetative: 25, flowering: 15, fruiting: 22 })
    );
    expect(stages).toEqual(['seedling', 'vegetative', 'flowering', 'fruiting']);
  });

  it('excludes reproductive stages for timber trees', () => {
    const stages = getValidStagesForPlant(
      makePlantOfType('timber_tree'),
      profileWith({ seedling: 150, vegetative: 1460, mature: 730 })
    );
    expect(stages).toEqual(['seedling', 'vegetative', 'mature']);
  });

  it('unions linear and annual-cycle stages for fruit trees', () => {
    const stages = getValidStagesForPlant(
      makePlantOfType('fruit_tree'),
      profileWith({ seedling: 150, vegetative: 1310 }, { flowering: 45, fruiting: 120, dormant: 200 })
    );
    expect(stages).toEqual(['seedling', 'vegetative', 'flowering', 'fruiting', 'dormant']);
  });

  it('uses the coconut lifecycle for coconut trees', () => {
    const stages = getValidStagesForPlant(makePlantOfType('coconut_tree'), profileWith());
    expect(stages).toEqual(['seedling', 'vegetative', 'flowering', 'fruiting', 'mature']);
  });

  it('falls back to all stages when there is no profile data', () => {
    expect(getValidStagesForPlant(makePlantOfType('vegetable'), null)).toEqual([...STAGE_ORDER]);
  });
});

describe('COCONUT_STAGE_DURATIONS', () => {
  it('covers the coconut lifecycle stages in order', () => {
    const stages = STAGE_ORDER.filter(
      (s) => COCONUT_STAGE_DURATIONS[s] !== undefined && COCONUT_STAGE_DURATIONS[s]! > 0
    );
    expect(stages).toEqual(['seedling', 'vegetative', 'flowering', 'fruiting', 'mature']);
  });
});
