import {
  ALERT_ICON_KEYS,
  BED_LAYER_ICON_KEYS,
  BED_TYPE_ICON_KEYS,
  GROWTH_STAGE_ICON_KEYS,
  ICON_REGISTRY,
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
    ['bed types', BED_TYPE_ICON_KEYS],
    ['bed layers', BED_LAYER_ICON_KEYS],
    ['treatment methods', TREATMENT_ICON_KEYS],
    ['quality states', QUALITY_ICON_KEYS],
  ])('resolves every %s mapping', (_label, mapping) => {
    for (const iconKey of Object.values(mapping)) {
      expect(ICON_REGISTRY[iconKey]).toBeDefined();
    }
  });

  it('uses the custom SVG family only for the seven bed types', () => {
    const customIcons = Object.values(ICON_REGISTRY).filter((entry) => entry.kind === 'bed');
    expect(customIcons).toHaveLength(7);
    expect(Object.values(BED_TYPE_ICON_KEYS)).toHaveLength(7);
  });
});
