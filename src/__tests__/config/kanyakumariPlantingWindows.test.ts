import {
  KANYAKUMARI_PLANTING_CALENDAR,
  getKanyakumariPlantingWindows,
} from '../../config/kanyakumariPlantingCalendar';

/** Month is 0-based in `Date`, so August is 7. */
function on(month: number, day = 15): Date {
  return new Date(2026, month, day);
}

function varieties(entries: readonly { variety: string }[]): string[] {
  return entries.map((entry) => entry.variety);
}

describe('getKanyakumariPlantingWindows', () => {
  it('returns the month unchanged as `current`', () => {
    const august = getKanyakumariPlantingWindows(on(7));
    expect(august.current).toEqual(KANYAKUMARI_PLANTING_CALENDAR[8]);
  });

  it('closes the crops August has that September does not', () => {
    const { closing } = getKanyakumariPlantingWindows(on(7));
    expect(varieties(closing)).toEqual(['Amaranthus', 'Brinjal', 'Chilli', 'Cluster Beans']);
  });

  it('opens the crops September has that August does not', () => {
    const { openingNext } = getKanyakumariPlantingWindows(on(7));
    expect(varieties(openingNext)).toEqual(['Fenugreek', 'Palak', 'Turnip']);
  });

  it('keeps a crop out of both lists when its window spans the boundary', () => {
    // Fenugreek runs September through December, so October closes nothing of it.
    const { current, closing, openingNext } = getKanyakumariPlantingWindows(on(9));
    expect(varieties(current)).toContain('Fenugreek');
    expect(varieties(closing)).not.toContain('Fenugreek');
    expect(varieties(openingNext)).not.toContain('Fenugreek');
  });

  it('distinguishes sow from transplant for the same crop', () => {
    // Tomato transplants in December and January; the sow/transplant pair must
    // not collapse into one key and mask a genuinely closing window.
    const { current } = getKanyakumariPlantingWindows(on(11));
    const tomato = current.filter((entry) => entry.variety === 'Tomato');
    expect(tomato).toHaveLength(1);
    expect(tomato[0]?.action).toBe('transplant');
  });

  it('wraps December to January rather than closing every winter crop', () => {
    const december = getKanyakumariPlantingWindows(on(11));
    // Both months carry Radish, so it is not closing.
    expect(varieties(december.current)).toContain('Radish');
    expect(varieties(december.closing)).not.toContain('Radish');
    // January's cowpea is genuinely new.
    expect(varieties(december.openingNext)).toContain('Cowpea');
  });

  it('closes December crops that January drops', () => {
    const { closing } = getKanyakumariPlantingWindows(on(11));
    expect(varieties(closing)).toContain('Beetroot');
    expect(varieties(closing)).toContain('Fenugreek');
  });
});
