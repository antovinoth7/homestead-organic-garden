/// <reference types="jest" />
import { computeTargetIndex } from '../../utils/dragRowMath';

const STEP = 118;

describe('computeTargetIndex', () => {
  it('returns startIndex when translation is zero', () => {
    expect(computeTargetIndex(2, 0, 5, STEP)).toBe(2);
  });

  it('shifts right by N when translation is N tile-steps', () => {
    expect(computeTargetIndex(0, STEP * 2, 5, STEP)).toBe(2);
    expect(computeTargetIndex(1, STEP * 3, 5, STEP)).toBe(4);
  });

  it('shifts left when translation is negative', () => {
    expect(computeTargetIndex(3, -STEP, 5, STEP)).toBe(2);
    expect(computeTargetIndex(4, -STEP * 4, 5, STEP)).toBe(0);
  });

  it('clamps to the bounds of [0, totalCount-1]', () => {
    expect(computeTargetIndex(0, -STEP * 10, 5, STEP)).toBe(0);
    expect(computeTargetIndex(4, STEP * 10, 5, STEP)).toBe(4);
  });

  it('rounds half-step translations to the nearer index', () => {
    expect(computeTargetIndex(0, STEP * 0.4, 5, STEP)).toBe(0);
    expect(computeTargetIndex(0, STEP * 0.6, 5, STEP)).toBe(1);
  });

  it('returns 0 when totalCount is 0', () => {
    expect(computeTargetIndex(0, 0, 0, STEP)).toBe(0);
    expect(computeTargetIndex(2, STEP * 3, 0, STEP)).toBe(0);
  });

  it('respects a custom step argument', () => {
    expect(computeTargetIndex(0, 200, 5, 100)).toBe(2);
    expect(computeTargetIndex(2, -150, 5, 100)).toBe(1);
  });
});
