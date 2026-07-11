import { buildCarePlanRows } from '@/utils/carePlanDisplay';
import type { CarePlanInput, CarePlanRow } from '@/utils/carePlanDisplay';

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
