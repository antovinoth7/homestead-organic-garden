import { activeSectionKey, scrollIntoViewOffset } from '@/utils/scrollSpy';
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

  describe('when bottomed out', () => {
    it('activates the last section even if it never reached the bar', () => {
      // A short trailing section the scroll view can never bring under the bar:
      // without atEnd, 'pictures' would stay active forever.
      expect(activeSectionKey(offsets, 1000, BAR)).toBe('pictures');
      expect(activeSectionKey(offsets, 1000, BAR, true)).toBe('history');
    });

    it('picks the last section by offset, not by argument order', () => {
      const shuffled: SectionOffset<Key>[] = [
        { key: 'history', y: 1500 },
        { key: 'care', y: 0 },
        { key: 'pictures', y: 900 },
        { key: 'info', y: 400 },
      ];
      expect(activeSectionKey(shuffled, 0, BAR, true)).toBe('history');
    });

    it('still returns null when there are no sections', () => {
      expect(activeSectionKey([], 0, BAR, true)).toBeNull();
    });
  });
});

describe('scrollIntoViewOffset', () => {
  // A 5-pill bar: viewport 360, content 520, so 160px of overflow.
  const VIEWPORT = 360;
  const CONTENT = 520;

  it('leaves the offset alone before the viewport is measured', () => {
    expect(scrollIntoViewOffset({ x: 400, width: 90 }, 20, 0, CONTENT)).toBe(20);
  });

  it('does not scroll for an item already fully in view', () => {
    expect(scrollIntoViewOffset({ x: 100, width: 80 }, 0, VIEWPORT, CONTENT)).toBe(0);
  });

  it('scrolls right just enough to reveal an item past the trailing edge', () => {
    // Trailing edge 430 + 16 pad = 446; 446 - 360 viewport = 86.
    expect(scrollIntoViewOffset({ x: 350, width: 80 }, 0, VIEWPORT, CONTENT)).toBe(86);
  });

  it('scrolls left just enough to reveal an item before the leading edge', () => {
    // Leading edge 40 - 16 pad = 24.
    expect(scrollIntoViewOffset({ x: 40, width: 80 }, 100, VIEWPORT, CONTENT)).toBe(24);
  });

  it('clamps to the start rather than scrolling past it', () => {
    expect(scrollIntoViewOffset({ x: 0, width: 80 }, 50, VIEWPORT, CONTENT)).toBe(0);
  });

  it('clamps to the end of the scrollable range', () => {
    // Last pill: trailing edge + pad would exceed the max offset of 160.
    expect(scrollIntoViewOffset({ x: 440, width: 80 }, 0, VIEWPORT, CONTENT)).toBe(160);
  });

  it('does not scroll when the content fits in the viewport', () => {
    expect(scrollIntoViewOffset({ x: 200, width: 80 }, 0, VIEWPORT, 300)).toBe(0);
  });
});
