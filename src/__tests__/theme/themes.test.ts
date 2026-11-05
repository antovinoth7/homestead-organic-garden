/* eslint-disable import/first */
// Node-only Jest preset: typography.ts resolves a per-platform monospace face.
jest.mock('react-native', () => ({
  Platform: { select: (spec: { default: unknown }) => spec.default },
}));

import { darkTheme, lightTheme } from '@/theme/colors';
import { DEFAULT_PALETTE, isThemePalette, PALETTE_ORDER, themeMeta, themes } from '@/theme/themes';
import type { Theme } from '@/theme/colors';
import { border, eyebrow, font, labelCase, radius, shadow, typeSize } from '@/theme/styleTokens';
import { mono, monoMeta, MONO_FONT, MONO_META } from '@/styles/typography';
import { taskColor, TASK_TYPE_ORDER } from '@/utils/taskConstants';

const ALL: [string, Theme][] = Object.entries(themes).flatMap(([palette, modes]) =>
  Object.entries(modes).map(([mode, theme]) => [`${palette} ${mode}`, theme] as [string, Theme])
);

/** WCAG 2.x relative luminance of a #rrggbb colour. */
const luminance = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe('palettes', () => {
  it('defaults to Meadow, with Garden still offered', () => {
    expect(DEFAULT_PALETTE).toBe('meadow');
    expect(PALETTE_ORDER).toEqual(['meadow', 'garden']);
    expect(themeMeta.garden.name).toBe('Garden');
    expect(themeMeta.meadow.name).toBe('Meadow');
  });

  it('recognises only known palettes', () => {
    expect(isThemePalette('meadow')).toBe(true);
    expect(isThemePalette('garden')).toBe(true);
    expect(isThemePalette('terracotta')).toBe(false);
    expect(isThemePalette(null)).toBe(false);
  });

  it('keeps Garden as the original light and dark themes', () => {
    expect(themes.garden.light).toBe(lightTheme);
    expect(themes.garden.dark).toBe(darkTheme);
  });

  it.each(ALL)('%s has exactly the Garden token set', (_name, theme) => {
    expect(Object.keys(theme).sort()).toEqual(Object.keys(lightTheme).sort());
    expect(Object.keys(theme.layerColors).sort()).toEqual(
      Object.keys(lightTheme.layerColors).sort()
    );
    expect(Object.keys(theme.taskColors).sort()).toEqual([...TASK_TYPE_ORDER].sort());
  });
});

describe('Meadow contrast (WCAG AA)', () => {
  const meadow: [string, Theme][] = [
    ['light', themes.meadow.light],
    ['dark', themes.meadow.dark],
  ];

  it.each(meadow)('%s: text pairs reach 4.5:1', (_mode, t) => {
    const pairs: [string, string][] = [
      [t.text, t.background],
      [t.textSecondary, t.background],
      [t.textTertiary, t.card],
      [t.textInverse, t.primary],
      [t.buttonText, t.primary],
      [t.textInverse, t.error],
      [t.primaryDark, t.primaryLight],
      [t.inputText, t.inputBackground],
      [t.inputPlaceholder, t.inputBackground],
      [t.tabBarActive, t.tabBarBackground],
      [t.tabBarInactive, t.tabBarBackground],
      [t.successDark, t.successLight],
      [t.warningDark, t.warningLight],
      [t.errorDark, t.errorLight],
      [t.infoDark, t.infoLight],
      [t.timeWarmText, t.timeWarmBg],
      [t.timeCoolText, t.timeCoolBg],
      [t.heroText, t.heroGradientStart],
      [t.heroText, t.heroGradientEnd],
    ];
    for (const [fg, bg] of pairs) {
      expect({ fg, bg, ratio: contrast(fg, bg) >= 4.5 }).toEqual({ fg, bg, ratio: true });
    }
  });

  it.each(meadow)('%s: input border and task colours reach 3:1', (_mode, t) => {
    expect(contrast(t.inputBorder, t.inputBackground)).toBeGreaterThanOrEqual(3);
    for (const type of TASK_TYPE_ORDER) {
      expect({ type, ok: contrast(taskColor(t, type), t.card) >= 3 }).toEqual({ type, ok: true });
    }
  });

  it('puts dark ink on the light dark-mode primary', () => {
    expect(luminance(themes.meadow.dark.textInverse)).toBeLessThan(0.05);
    expect(themes.meadow.dark.buttonText).toBe(themes.meadow.dark.textInverse);
  });
});

describe('taskColor', () => {
  it('reads the colour from the palette', () => {
    expect(taskColor(lightTheme, 'water')).toBe('#2196F3');
    expect(taskColor(themes.meadow.light, 'water')).toBe('#2480cf');
    expect(taskColor(themes.meadow.dark, 'water')).toBe('#6ab4f2');
  });
});

describe('style tokens', () => {
  const garden = themes.garden.light;
  const meadow = themes.meadow.light;

  it('returns the factory literal for Garden', () => {
    expect(radius(garden, 'card', 12)).toBe(12);
    expect(border(garden, 'card', 1)).toBe(1);
    expect(typeSize(garden, 'title', 22)).toBe(22);
    expect(font(garden, 'title', '700')).toEqual({ fontWeight: '700' });
    expect(font(garden, 'body')).toEqual({});
    expect(shadow(garden, 'card')).toEqual({});
    expect(labelCase(garden)).toEqual({});
    expect(eyebrow(garden, { fontSize: 11, letterSpacing: 0.8, fontWeight: '700' })).toEqual({
      fontSize: 11,
      letterSpacing: 0.8,
      fontWeight: '700',
    });
  });

  it("returns Meadow's own values", () => {
    expect(radius(meadow, 'card', 12)).toBe(24);
    expect(radius(meadow, 'sheet', 20)).toBe(28);
    expect(border(meadow, 'card', 1)).toBe(0);
    expect(typeSize(meadow, 'title', 22)).toBe(28);
    expect(font(meadow, 'title', '700')).toEqual({
      fontFamily: 'Outfit_600SemiBold',
      fontWeight: 'normal',
    });
    expect(shadow(meadow, 'card')).toMatchObject({ elevation: 0, shadowOpacity: 0 });
    expect(shadow(meadow, 'card').boxShadow).toContain('rgba(40,118,71,0.1)');
    expect(labelCase(meadow)).toEqual({ textTransform: 'none', letterSpacing: 0 });
    expect(eyebrow(meadow, { fontSize: 11, letterSpacing: 0.8 })).toMatchObject({
      fontSize: 13,
      letterSpacing: 0,
      textTransform: 'none',
      fontFamily: 'Figtree_600SemiBold',
    });
  });

  it('uses the palette readout face for numbers', () => {
    expect(mono(garden, '700')).toEqual({ fontFamily: MONO_FONT, fontWeight: '700' });
    expect(monoMeta(garden)).toEqual({ ...MONO_META, fontFamily: MONO_FONT });
    expect(monoMeta(meadow, '700')).toEqual({
      fontFamily: 'Outfit_600SemiBold',
      fontWeight: 'normal',
      fontVariant: ['tabular-nums'],
      letterSpacing: 0,
    });
  });
});
