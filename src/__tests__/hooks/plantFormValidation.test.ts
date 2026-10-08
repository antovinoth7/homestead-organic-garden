import { careScheduleErrors } from '@/hooks/plantFormValidation';
import type { CareScheduleInput } from '@/hooks/plantFormValidation';

const validCare: CareScheduleInput = {
  wateringEnabled: true,
  wateringFrequency: '3',
  fertilisingEnabled: true,
  fertilisingFrequency: '30',
  pruningEnabled: false,
  pruningFrequency: '',
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
