import {
  ALERT_ICON_KEYS,
  BED_LAYER_ICON_KEYS,
  BED_TYPE_ICON_KEYS,
  GROWTH_STAGE_ICON_KEYS,
  ICON_REGISTRY,
  PLANT_TYPE_ICON_KEYS,
  QUALITY_ICON_KEYS,
  TASK_ICON_KEYS,
  TREATMENT_ICON_KEYS,
  WEATHER_ICON_KEYS,
} from '@/config/iconRegistry';

describe('semantic icon registry', () => {
  it.each([
    ['tasks', TASK_ICON_KEYS],
    ['alerts', ALERT_ICON_KEYS],
    ['weather conditions', WEATHER_ICON_KEYS],
    ['growth stages', GROWTH_STAGE_ICON_KEYS],
    ['plant types', PLANT_TYPE_ICON_KEYS],
    ['bed types', BED_TYPE_ICON_KEYS],
    ['bed layers', BED_LAYER_ICON_KEYS],
    ['treatment methods', TREATMENT_ICON_KEYS],
    ['quality states', QUALITY_ICON_KEYS],
  ])('resolves every %s mapping', (_label, mapping) => {
    for (const iconKey of Object.values(mapping)) {
      expect(ICON_REGISTRY[iconKey]).toBeDefined();
    }
  });

  it('registers seven custom bed glyphs', () => {
    const bedIcons = Object.values(ICON_REGISTRY).filter((entry) => entry.kind === 'bed');
    expect(bedIcons).toHaveLength(7);
    expect(Object.values(BED_TYPE_ICON_KEYS)).toHaveLength(7);
  });

  it('gives every plant type a distinct semantic key and registers five custom glyphs', () => {
    const iconKeys = Object.values(PLANT_TYPE_ICON_KEYS);
    const plantIcons = Object.values(ICON_REGISTRY).filter((entry) => entry.kind === 'plant');

    expect(iconKeys).toHaveLength(8);
    expect(new Set(iconKeys).size).toBe(iconKeys.length);
    expect(plantIcons).toHaveLength(5);
  });
});
