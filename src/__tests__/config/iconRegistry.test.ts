import {
  BED_LAYER_ICON_KEYS,
  BED_TYPE_ICON_KEYS,
  CATALOG_GROUP_ICON_KEYS,
  GROWTH_STAGE_ICON_KEYS,
  ICON_REGISTRY,
  SEASON_ICON_KEYS,
  TASK_ICON_KEYS,
  TREATMENT_ICON_KEYS,
  getSeasonIconKey,
} from '@/config/iconRegistry';

describe('semantic icon registry', () => {
  it.each([
    ['tasks', TASK_ICON_KEYS],
    ['seasons', SEASON_ICON_KEYS],
    ['growth stages', GROWTH_STAGE_ICON_KEYS],
    ['catalog groups', CATALOG_GROUP_ICON_KEYS],
    ['bed types', BED_TYPE_ICON_KEYS],
    ['bed layers', BED_LAYER_ICON_KEYS],
    ['treatment methods', TREATMENT_ICON_KEYS],
  ])('resolves every %s mapping', (_label, mapping) => {
    for (const iconKey of Object.values(mapping)) {
      expect(ICON_REGISTRY[iconKey]).toBeDefined();
    }
  });

  it.each([
    ['sw_monsoon', 'weather.rain'],
    ['ne_monsoon', 'weather.rain'],
    ['summer', 'weather.hot'],
    ['cool_dry', 'weather.clear'],
  ])('draws %s as %s', (seasonId, expected) => {
    expect(getSeasonIconKey(seasonId)).toBe(expected);
  });

  // Zones declare their own season ids, so an unrecognised one has to resolve to
  // something drawable rather than crash the Today header.
  it('falls back to a registered key for an unknown season', () => {
    const fallback = getSeasonIconKey('wet');
    expect(ICON_REGISTRY[fallback]).toBeDefined();
  });

  // A watering glyph here would tell a monsoon reader to irrigate, and it is the
  // same Ionicon the watering task and the water-needed alert already own.
  it('never draws a season with the watering icon', () => {
    for (const iconKey of Object.values(SEASON_ICON_KEYS)) {
      expect(iconKey).not.toBe('task.water');
      expect(iconKey).not.toBe('alert.water_needed');
    }
  });

  it('registers seven custom bed glyphs', () => {
    const bedIcons = Object.values(ICON_REGISTRY).filter((entry) => entry.kind === 'bed');
    expect(bedIcons).toHaveLength(7);
    expect(Object.values(BED_TYPE_ICON_KEYS)).toHaveLength(7);
  });

  it('registers five custom plant glyphs', () => {
    const plantIcons = Object.values(ICON_REGISTRY).filter((entry) => entry.kind === 'plant');
    expect(plantIcons).toHaveLength(5);
  });
});
