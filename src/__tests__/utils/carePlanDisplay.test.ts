import { buildCarePlanRows, buildPlantSummaryRows } from '@/utils/carePlanDisplay';
import type { CarePlanInput, CarePlanRow, PlantSummaryInput } from '@/utils/carePlanDisplay';

const baseInput: CarePlanInput = {
  sunlight: 'full_sun',
  waterRequirement: 'medium',
  soilType: 'red_laterite',
  preferredFertiliser: 'panchagavya',
  wateringEnabled: true,
  wateringFrequency: '3',
  fertilisingEnabled: true,
  fertilisingFrequency: '30',
};

const rowByKey = (input: CarePlanInput, key: string): CarePlanRow => {
  const row = buildCarePlanRows(input).find((r) => r.key === key);
  if (!row) throw new Error(`row ${key} missing`);
  return row;
};

describe('buildCarePlanRows', () => {
  it('maps a typical profile to labelled rows', () => {
    const rows = buildCarePlanRows(baseInput);
    expect(rows.map((r) => r.key)).toEqual([
      'sunlight',
      'waterNeeds',
      'watering',
      'feeding',
      'soil',
      'fertiliser',
    ]);
    expect(rowByKey(baseInput, 'sunlight').value).toBe('Full Sun');
    expect(rowByKey(baseInput, 'waterNeeds').value).toBe('Medium');
    expect(rowByKey(baseInput, 'watering').value).toBe('Every 3 days');
    expect(rowByKey(baseInput, 'feeding').value).toBe('Every 30 days');
    expect(rowByKey(baseInput, 'soil').value).toBe('Red Laterite (Seivaal)');
    expect(rowByKey(baseInput, 'fertiliser').value).toBe('Panchagavya');
  });

  it('shows friendly detail only for named cadences', () => {
    expect(rowByKey({ ...baseInput, wateringFrequency: '7' }, 'watering').detail).toBe('Weekly');
    expect(rowByKey({ ...baseInput, fertilisingFrequency: '30' }, 'feeding').detail).toBe(
      'Monthly'
    );
    // "Every 3 days" would just repeat the value line.
    expect(rowByKey(baseInput, 'watering').detail).toBeUndefined();
  });

  it('describes daily watering without a redundant unit', () => {
    expect(rowByKey({ ...baseInput, wateringFrequency: '1' }, 'watering').value).toBe('Every day');
  });

  it('uses "no task" copy when a schedule toggle is off', () => {
    const input = { ...baseInput, wateringEnabled: false, fertilisingEnabled: false };
    expect(rowByKey(input, 'watering').value).toBe('No task · rain-fed or manual');
    expect(rowByKey(input, 'feeding').value).toBe('No task · manual feeding only');
    expect(rowByKey(input, 'watering').detail).toBeUndefined();
  });

  it('falls back to "Not set" for an enabled schedule with no frequency', () => {
    expect(rowByKey({ ...baseInput, wateringFrequency: '' }, 'watering').value).toBe('Not set');
  });

  it('omits pruning unless requested, includes it when provided', () => {
    expect(buildCarePlanRows(baseInput).some((r) => r.key === 'pruning')).toBe(false);
    const withPruning = buildCarePlanRows({
      ...baseInput,
      pruningEnabled: true,
      pruningFrequency: '90',
    });
    expect(withPruning.find((r) => r.key === 'pruning')?.value).toBe('Every 90 days');
    const pruningOff = buildCarePlanRows({ ...baseInput, pruningEnabled: false });
    expect(pruningOff.find((r) => r.key === 'pruning')?.value).toBe('No pruning task scheduled');
  });

  it('appends growth stage and lifecycle only when provided', () => {
    const rows = buildCarePlanRows(baseInput);
    expect(rows.some((r) => r.key === 'growthStage')).toBe(false);
    expect(rows.some((r) => r.key === 'lifecycle')).toBe(false);

    const enriched = buildCarePlanRows({
      ...baseInput,
      growthStage: 'seedling',
      lifecycle: 'perennial',
    });
    expect(enriched.find((r) => r.key === 'growthStage')?.value).toBe('Seedling');
    expect(enriched.find((r) => r.key === 'lifecycle')?.value).toBe('Perennial');
  });
});

const basePlant: PlantSummaryInput = {
  plantVariety: 'Long Brinjal',
  plantType: 'vegetable',
  variety: '',
  plantingDate: '',
  harvestSeason: '',
  location: '',
  parentLocation: '',
  childLocation: '',
  landmarks: '',
  spaceType: 'ground',
  potSize: '',
  bedName: '',
  name: '',
};

const plantRow = (input: PlantSummaryInput, key: string): CarePlanRow => {
  const row = buildPlantSummaryRows(input).find((r) => r.key === key);
  if (!row) throw new Error(`row ${key} missing`);
  return row;
};

describe('buildPlantSummaryRows', () => {
  it('shows the plant with its category, and growing space, by default', () => {
    const rows = buildPlantSummaryRows(basePlant);
    // Only plant + growing space when nothing optional is filled.
    expect(rows.map((r) => r.key)).toEqual(['plant', 'space']);
    expect(plantRow(basePlant, 'plant').value).toBe('Long Brinjal');
    expect(plantRow(basePlant, 'plant').detail).toBe('Vegetable');
    expect(plantRow(basePlant, 'space').value).toBe('Ground');
  });

  it('omits optional rows when their value is empty', () => {
    const rows = buildPlantSummaryRows(basePlant);
    for (const key of ['variety', 'plantingDate', 'harvestSeason', 'location', 'nickname']) {
      expect(rows.some((r) => r.key === key)).toBe(false);
    }
  });

  it('formats the planting date and keeps harvest season verbatim', () => {
    const input = { ...basePlant, plantingDate: '2026-03-15', harvestSeason: 'Summer (Mar-May)' };
    expect(plantRow(input, 'plantingDate').value).toBe('Mar 15, 2026');
    expect(plantRow(input, 'harvestSeason').value).toBe('Summer (Mar-May)');
  });

  it('combines parent/child location and surfaces landmark as detail', () => {
    const input = {
      ...basePlant,
      parentLocation: 'Backyard',
      childLocation: 'East',
      landmarks: 'Near the well',
    };
    expect(plantRow(input, 'location').value).toBe('Backyard · East');
    expect(plantRow(input, 'location').detail).toBe('Near the well');
  });

  it('prefers the combined location preview when present', () => {
    const input = { ...basePlant, location: 'Terrace Garden', parentLocation: 'Backyard' };
    expect(plantRow(input, 'location').value).toBe('Terrace Garden');
  });

  it('appends pot size for pots and bed name for beds', () => {
    expect(plantRow({ ...basePlant, spaceType: 'pot', potSize: '12' }, 'space').value).toBe(
      'Pot · 12"'
    );
    const bed = plantRow({ ...basePlant, spaceType: 'bed', bedName: 'Bed A' }, 'space');
    expect(bed.value).toBe('Raised Bed');
    expect(bed.detail).toBe('Bed A');
  });

  it('includes the nickname when set', () => {
    expect(plantRow({ ...basePlant, name: 'My Brinjal' }, 'nickname').value).toBe('My Brinjal');
  });
});
