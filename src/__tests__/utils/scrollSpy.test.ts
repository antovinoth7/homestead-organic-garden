import { activeSectionKey, lastSectionMinHeight } from '@/utils/scrollSpy';
import type { SectionOffset } from '@/utils/scrollSpy';

type Key = 'care' | 'info' | 'pictures' | 'history';

const offsets: SectionOffset<Key>[] = [
  { key: 'care', y: 0 },
  { key: 'info', y: 400 },
  { key: 'pictures', y: 900 },
  { key: 'history', y: 1500 },
];

const BAR = 48;

describe('activeSectionKey', () => {
  it('returns null when there are no sections', () => {
    expect(activeSectionKey([], 0, BAR)).toBeNull();
  });

  it('returns the first section at the top of the page', () => {
    expect(activeSectionKey(offsets, 0, BAR)).toBe('care');
  });

  it('activates a section once its top passes under the bar', () => {
    // info top (400) - bar (48) = 352; just before vs just after.
    expect(activeSectionKey(offsets, 351, BAR)).toBe('care');
    expect(activeSectionKey(offsets, 352, BAR)).toBe('info');
  });

  it('activates the last section once scrolled past its top', () => {
    // history top (1500) - bar (48) = 1452.
    expect(activeSectionKey(offsets, 1452, BAR)).toBe('history');
  });

  it('keeps the last section active when scrolled to the very bottom', () => {
    expect(activeSectionKey(offsets, 5000, BAR)).toBe('history');
  });

  it('does not require offsets to be pre-sorted', () => {
    const shuffled: SectionOffset<Key>[] = [
      { key: 'history', y: 1500 },
      { key: 'care', y: 0 },
      { key: 'pictures', y: 900 },
      { key: 'info', y: 400 },
    ];
    expect(activeSectionKey(shuffled, 950, BAR)).toBe('pictures');
  });
});

describe('lastSectionMinHeight', () => {
  it('returns 0 before the viewport is measured', () => {
    expect(lastSectionMinHeight(0, 0)).toBe(0);
  });

  it('returns the viewport minus the sticky bar', () => {
    expect(lastSectionMinHeight(800, 48)).toBe(752);
  });

  it('never returns negative when the bar is taller than the viewport', () => {
    expect(lastSectionMinHeight(40, 48)).toBe(0);
  });
});
