import { shortenSeasonLabel, getSeasonLabel } from '@/utils/seasonHelpers';

describe('shortenSeasonLabel', () => {
  it('drops the trailing month-range parenthetical', () => {
    expect(shortenSeasonLabel('SW Monsoon (Jun–Sep)')).toBe('SW Monsoon');
    expect(shortenSeasonLabel('Summer (Mar–May)')).toBe('Summer');
  });

  it('leaves labels without a parenthetical untouched', () => {
    expect(shortenSeasonLabel('SW Monsoon')).toBe('SW Monsoon');
    expect(shortenSeasonLabel('')).toBe('');
  });

  it('only strips a trailing group, not one mid-label', () => {
    expect(shortenSeasonLabel('NE Monsoon (heavy) rains')).toBe('NE Monsoon (heavy) rains');
  });

  it('shortens every real zone season label to a non-empty name', () => {
    for (const month of [0, 3, 6, 10]) {
      const short = shortenSeasonLabel(getSeasonLabel(new Date(2026, month, 15)));
      expect(short.length).toBeGreaterThan(0);
      expect(short).not.toContain('(');
    }
  });
});
