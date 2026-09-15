import { buildSowNowView } from '@/utils/catalogSowNow';
import { TAMIL_NADU_PLANTING_RULES } from '@/config/tamilNaduPlantingCalendar';

const titles = (items: ReturnType<typeof buildSowNowView>['items']): string[] =>
  items.filter((i) => i.kind === 'section').map((i) => (i.kind === 'section' ? i.title : ''));

const names = (items: ReturnType<typeof buildSowNowView>['items']): string[] =>
  items.filter((i) => i.kind === 'browse').map((i) => (i.kind === 'browse' ? i.name : ''));

/** A month with a known window: Radish is the one year-round rule. */
const FEBRUARY = new Date('2026-02-15T12:00:00');

describe('buildSowNowView', () => {
  it('asks for a farm location before guessing a zone', () => {
    const view = buildSowNowView(null, {});
    expect(view.items).toEqual([]);
    expect(view.message).toContain('Settings');
  });

  it('sections what to sow now and what opens next', () => {
    const view = buildSowNowView('high_rainfall', {}, FEBRUARY);
    expect(view.message).toBeNull();
    const sections = titles(view.items);
    expect(sections[0]).toBe('Sow now');
    for (const title of sections) {
      expect(title === 'Sow now' || /^Opens in /.test(title)).toBe(true);
    }
  });

  it('lists every plant exactly once', () => {
    // `closing` is a subset of `current`, so giving it its own section listed
    // those crops twice.
    const listed = names(buildSowNowView('high_rainfall', {}, FEBRUARY).items);
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('marks a closing window on the row instead of duplicating it', () => {
    // Look across the year for a month where something is closing.
    const withClosing = Array.from({ length: 12 }, (_, index) =>
      buildSowNowView(
        'high_rainfall',
        {},
        new Date(`2026-${String(index + 1).padStart(2, '0')}-15T12:00:00`)
      )
    ).find((view) =>
      view.items.some((i) => i.kind === 'browse' && i.subtitle?.includes('last month'))
    );
    expect(withClosing).toBeDefined();
    const listed = names(withClosing!.items);
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('says what a row is for — sow or transplant, and the window', () => {
    const view = buildSowNowView('high_rainfall', {}, FEBRUARY);
    const rows = view.items.filter((i) => i.kind === 'browse');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      if (row.kind !== 'browse') continue;
      expect(row.subtitle).toMatch(/^(Sow|Transplant) · /);
    }
  });

  it('carries the garden count and each plant’s own type and habit', () => {
    const view = buildSowNowView('high_rainfall', { Radish: 3 }, FEBRUARY);
    const radish = view.items.find((i) => i.kind === 'browse' && i.name === 'Radish');
    expect(radish?.kind === 'browse' && radish.count).toBe(3);
    expect(radish?.kind === 'browse' && radish.plantType).toBe('vegetable');
    expect(radish?.kind === 'browse' && radish.habit).toBe('annual_bed');
  });

  it('marks section boundaries so each renders as its own card', () => {
    const view = buildSowNowView('high_rainfall', {}, FEBRUARY);
    let sawSection = false;
    let previous: (typeof view.items)[number] | null = null;
    for (const item of view.items) {
      if (item.kind === 'section') {
        sawSection = true;
        if (previous?.kind === 'browse') expect(previous.isLast).toBe(true);
      } else if (item.kind === 'browse' && previous?.kind === 'section') {
        expect(item.isFirst).toBe(true);
      }
      previous = item;
    }
    expect(sawSection).toBe(true);
    if (previous?.kind === 'browse') expect(previous.isLast).toBe(true);
  });

  it('hides the windows rather than showing them stale past their review date', () => {
    // Every rule carries a `validUntil`; well past it the registry reports
    // `review_expired` and this view must explain itself, not render empty.
    const view = buildSowNowView('high_rainfall', {}, new Date('2099-01-01T12:00:00'));
    expect(view.items).toEqual([]);
    expect(view.message).toContain('review date');
  });

  it('only ever lists plants the reviewed rule set covers', () => {
    // A reminder in test form: the view is limited by the data, not by itself.
    const covered = new Set(TAMIL_NADU_PLANTING_RULES.map((rule) => rule.plantName));
    expect(covered.size).toBeLessThanOrEqual(20);
    for (let month = 1; month <= 12; month += 1) {
      const view = buildSowNowView(
        'high_rainfall',
        {},
        new Date(`2026-${String(month).padStart(2, '0')}-15T12:00:00`)
      );
      for (const name of names(view.items)) expect(covered).toContain(name);
    }
  });
});
