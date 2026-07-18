import { careScheduleErrors, plantFormBlockReason } from '@/hooks/plantFormValidation';
import type { CareScheduleInput, PlantFormGateInput } from '@/hooks/plantFormValidation';

const validCare: CareScheduleInput = {
  wateringEnabled: true,
  wateringFrequency: '3',
  fertilisingEnabled: true,
  fertilisingFrequency: '30',
  pruningEnabled: false,
  pruningFrequency: '',
};

const validGate: PlantFormGateInput = {
  plantVariety: 'Guava',
  parentLocation: 'Home Garden',
  childLocation: 'North',
  careProfilesLoaded: true,
  care: validCare,
};

describe('careScheduleErrors', () => {
  it('passes a fully seeded schedule', () => {
    expect(careScheduleErrors(validCare)).toEqual([]);
  });

  it('requires watering frequency only while the toggle is on', () => {
    expect(careScheduleErrors({ ...validCare, wateringFrequency: '' })).toEqual([
      'Please enter a valid watering frequency (number of days)',
    ]);
    expect(
      careScheduleErrors({ ...validCare, wateringEnabled: false, wateringFrequency: '' })
    ).toEqual([]);
  });

  it('requires feeding frequency only while the toggle is on', () => {
    expect(careScheduleErrors({ ...validCare, fertilisingFrequency: '0' })).toEqual([
      'Please enter a valid fertilising frequency (number of days)',
    ]);
    expect(
      careScheduleErrors({ ...validCare, fertilisingEnabled: false, fertilisingFrequency: '' })
    ).toEqual([]);
  });

  it('lets pruning frequency stay empty but rejects an invalid value', () => {
    expect(careScheduleErrors({ ...validCare, pruningEnabled: true })).toEqual([]);
    expect(
      careScheduleErrors({ ...validCare, pruningEnabled: true, pruningFrequency: '0' })
    ).toEqual(['Please enter a valid pruning frequency (number of days)']);
  });
});

describe('plantFormBlockReason', () => {
  it('passes a fully valid form', () => {
    expect(plantFormBlockReason(validGate)).toBeNull();
  });

  it('requires a plant first', () => {
    expect(plantFormBlockReason({ ...validGate, plantVariety: '  ' })).toMatch(/select a plant/i);
  });

  it('requires main location and direction', () => {
    expect(plantFormBlockReason({ ...validGate, parentLocation: '' })).toMatch(/main location/i);
    expect(plantFormBlockReason({ ...validGate, childLocation: '' })).toMatch(
      /direction or section/i
    );
  });

  it('reports the plant before the location when both are missing', () => {
    expect(
      plantFormBlockReason({ ...validGate, plantVariety: '', parentLocation: '' })
    ).toMatch(/select a plant/i);
  });

  it('waits for care profiles to load', () => {
    expect(plantFormBlockReason({ ...validGate, careProfilesLoaded: false })).toMatch(
      /loading care plan/i
    );
  });

  it('blocks an enabled schedule missing its frequency', () => {
    expect(
      plantFormBlockReason({
        ...validGate,
        care: { ...validCare, wateringFrequency: '' },
      })
    ).toMatch(/watering frequency/i);
  });

  it('skips frequencies for disabled schedules (profile with no watering task)', () => {
    expect(
      plantFormBlockReason({
        ...validGate,
        care: {
          ...validCare,
          wateringEnabled: false,
          wateringFrequency: '',
          fertilisingEnabled: false,
          fertilisingFrequency: '',
        },
      })
    ).toBeNull();
  });
});
