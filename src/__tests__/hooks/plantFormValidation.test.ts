import { careScheduleErrors, wizardStepBlockReason } from '@/hooks/plantFormValidation';
import type { CareScheduleInput, WizardGateInput } from '@/hooks/plantFormValidation';

const validCare: CareScheduleInput = {
  wateringEnabled: true,
  wateringFrequency: '3',
  fertilisingEnabled: true,
  fertilisingFrequency: '30',
  pruningEnabled: false,
  pruningFrequency: '',
};

const validGate: WizardGateInput = {
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

describe('wizardStepBlockReason', () => {
  it('step 1 requires a plant', () => {
    expect(wizardStepBlockReason(1, { ...validGate, plantVariety: '  ' })).toMatch(
      /select a plant/i
    );
    expect(wizardStepBlockReason(1, validGate)).toBeNull();
  });

  it('step 2 requires main location and direction', () => {
    expect(wizardStepBlockReason(2, { ...validGate, parentLocation: '' })).toMatch(
      /main location/i
    );
    expect(wizardStepBlockReason(2, { ...validGate, childLocation: '' })).toMatch(
      /direction or section/i
    );
    expect(wizardStepBlockReason(2, validGate)).toBeNull();
  });

  it('step 3 passes with seeded defaults', () => {
    expect(wizardStepBlockReason(3, validGate)).toBeNull();
  });

  it('step 3 waits for care profiles to load', () => {
    expect(wizardStepBlockReason(3, { ...validGate, careProfilesLoaded: false })).toMatch(
      /loading care plan/i
    );
  });

  it('step 3 blocks an enabled schedule missing its frequency', () => {
    expect(
      wizardStepBlockReason(3, {
        ...validGate,
        care: { ...validCare, wateringFrequency: '' },
      })
    ).toMatch(/watering frequency/i);
  });

  it('step 3 skips frequencies for disabled schedules (profile with no watering task)', () => {
    expect(
      wizardStepBlockReason(3, {
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
