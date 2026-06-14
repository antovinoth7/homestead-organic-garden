import { estimatePlantCapacity } from '@/utils/plantCapacity';

describe('estimatePlantCapacity', () => {
  it('returns a max at least one greater than the min', () => {
    const { min, max } = estimatePlantCapacity('leafy', 1.2, 3.0);
    expect(max).toBeGreaterThan(min);
  });

  it('grows monotonically with bed length', () => {
    const small = estimatePlantCapacity('root_legume', 1.2, 2.0).max;
    const large = estimatePlantCapacity('root_legume', 1.2, 6.0).max;
    expect(large).toBeGreaterThanOrEqual(small);
  });

  it('handles a null bed type with an area-based estimate', () => {
    const { min, max } = estimatePlantCapacity(null, 1.0, 2.0);
    expect(min).toBeGreaterThanOrEqual(1);
    expect(max).toBeGreaterThanOrEqual(min);
  });
});
