import { blockReasonForStep } from '@/hooks/bedWizardValidation';
import type { Step2Data, WizardStepData } from '@/hooks/useBedCreationWizard';

// A fully-valid Step 2 payload; individual tests override the fields under test.
const validStep2: Step2Data = {
  name: 'North Bed',
  sunlight: 'full_sun',
  soil_type: 'garden_soil',
  slope: 'flat',
  wind: 'sheltered',
  parent_location: null,
  child_location: null,
  prev_crop_family: null,
  prev_crop_season: null,
  pest_history: [],
  waterlogging_risk: false,
  construction_type: 'in_ground',
};

describe('blockReasonForStep', () => {
  it('step 1: asks for a crop type when none is chosen', () => {
    const data: Partial<WizardStepData> = { 1: { bed_type: null } };
    expect(blockReasonForStep(1, data, false)).toMatch(/crop type/i);
  });

  it('step 1: returns null once a crop type is chosen', () => {
    const data: Partial<WizardStepData> = { 1: { bed_type: 'leafy' } };
    expect(blockReasonForStep(1, data, false)).toBeNull();
  });

  it('step 2: asks for a bed name when blank', () => {
    const data: Partial<WizardStepData> = { 2: { ...validStep2, name: '  ' } };
    expect(blockReasonForStep(2, data, false)).toMatch(/bed name/i);
  });

  it('step 2: explains the solanaceae block', () => {
    const data: Partial<WizardStepData> = {
      2: { ...validStep2, prev_crop_family: 'solanaceae' },
    };
    expect(blockReasonForStep(2, data, false)).toMatch(/solanaceae/i);
  });

  it('step 2: asks for a section/direction when one is required', () => {
    const data: Partial<WizardStepData> = { 2: validStep2 };
    expect(blockReasonForStep(2, data, true)).toMatch(/section|direction/i);
  });

  it('step 2: returns null when valid', () => {
    const data: Partial<WizardStepData> = { 2: validStep2 };
    expect(blockReasonForStep(2, data, false)).toBeNull();
  });

  it('step 3: asks for positive dimensions', () => {
    const data: Partial<WizardStepData> = {
      3: { width_m: 0, length_m: 0, area_sqm: 0, sizeRecommendation: null },
    };
    expect(blockReasonForStep(3, data, false)).toMatch(/width and length/i);
  });

  it('step 3: returns null with positive dimensions', () => {
    const data: Partial<WizardStepData> = {
      3: { width_m: 1, length_m: 2, area_sqm: 2, sizeRecommendation: null },
    };
    expect(blockReasonForStep(3, data, false)).toBeNull();
  });

  it('step 4: asks for at least one crop', () => {
    const data: Partial<WizardStepData> = { 4: { plant_entries: [] } };
    expect(blockReasonForStep(4, data, false)).toMatch(/at least one crop/i);
  });

  it('steps 5 and 6: never block', () => {
    expect(blockReasonForStep(5, {}, false)).toBeNull();
    expect(blockReasonForStep(6, {}, false)).toBeNull();
  });
});
