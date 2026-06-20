import { describeArc, DONUT_RADIUS, DONUT_CENTER } from '@/utils/svgArc';

describe('describeArc', () => {
  it('returns a valid SVG arc command string', () => {
    const path = describeArc(DONUT_CENTER, DONUT_CENTER, DONUT_RADIUS, 0, 90);
    expect(path).toMatch(/^M [\d.-]+ [\d.-]+ A /);
  });

  it('uses the small-arc flag for sweeps under 180°', () => {
    const path = describeArc(50, 50, 40, 0, 90);
    // Flag sequence: "A r r 0 <largeArc> 1"
    expect(path).toContain('A 40 40 0 0 1');
  });

  it('uses the large-arc flag for sweeps over 180°', () => {
    const path = describeArc(50, 50, 40, 0, 270);
    expect(path).toContain('A 40 40 0 1 1');
  });

  it('clamps a full-circle sweep just under 360° to avoid render ambiguity', () => {
    // A full 360 would collapse start==end; clamping keeps two distinct points.
    const full = describeArc(50, 50, 40, 0, 360);
    expect(full).toContain('A 40 40 0 1 1');
  });
});
