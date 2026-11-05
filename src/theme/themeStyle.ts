/**
 * Non-colour identity of a palette: type faces, shape, shadows, tab bar, hero
 * and photo treatment.
 *
 * Every shape / type / shadow token is optional. A palette that leaves a token
 * out keeps the value each style factory has always hard-coded — that is how
 * Garden (the original look) stays pixel-identical while Meadow overrides it.
 * Style factories read tokens through the helpers in `@/theme/styleTokens`,
 * which take that original value as the fallback.
 *
 * Font names are the Expo Google Fonts exports loaded in `App.tsx`. Radii,
 * widths and sizes are in dp. Shadows are CSS `boxShadow` strings, which RN
 * supports on all three platforms under the New Architecture.
 */

export type ThemePalette = 'garden' | 'meadow';

export type FontRole =
  | 'display'
  | 'title'
  | 'body'
  | 'bodyMedium'
  | 'bodyStrong'
  | 'bodyBold'
  | 'readout';

export type RadiusRole =
  | 'card'
  | 'tile'
  | 'chip'
  | 'button'
  | 'input'
  | 'photo'
  | 'bar'
  | 'sheet'
  | 'iconButton'
  | 'dialog'
  | 'hero'
  | 'tabBar';

export type BorderRole = 'card' | 'chip' | 'rule' | 'input';

export type TypeRole =
  | 'title'
  | 'compactTitle'
  | 'hero'
  | 'h3'
  | 'cardTitle'
  | 'sheetTitle'
  | 'modalTitle'
  | 'dialogTitle';

export type ShadowRole =
  | 'card'
  | 'button'
  | 'iconButton'
  | 'chip'
  | 'tabBar'
  | 'sheet'
  | 'dialog'
  | 'photo';

/** One shadow layer set, spread into a style object. */
export interface ShadowStyle {
  boxShadow?: string;
}

export type ThemeShadows = Partial<Record<ShadowRole, ShadowStyle>>;

export interface ThemeStyle {
  fonts: Partial<Record<FontRole, string>>;
  type: Partial<Record<TypeRole, number>> & {
    /** Small section labels: uppercase + tracked in Garden, sentence case in Meadow. */
    eyebrowUppercase: boolean;
    eyebrowSize?: number;
    eyebrowTracking?: number;
  };
  radii: Partial<Record<RadiusRole, number>>;
  borders: Partial<Record<BorderRole, number>>;
  tabBar: {
    /** Inset pill bar with rounded corners instead of the docked edge-to-edge bar. */
    floating: boolean;
    /** Gap between a floating bar and the screen edges / safe-area bottom. */
    inset: number;
    activeMark: 'none' | 'pill';
  };
  /** Icon tiles carry a primary-tint fill behind the glyph. */
  icons: { strokeWidth: number; duotone: boolean };
  photos: { treatment: 'natural' | 'soft-wash' };
  hero: { texture: 'none' | 'soft-circles' };
}

/** Garden: no overrides — every factory keeps its original literal values. */
export const gardenStyle: ThemeStyle = {
  fonts: {},
  type: { eyebrowUppercase: true },
  radii: {},
  borders: {},
  tabBar: { floating: false, inset: 0, activeMark: 'none' },
  icons: { strokeWidth: 1.5, duotone: false },
  photos: { treatment: 'natural' },
  hero: { texture: 'none' },
};

export const meadowStyle: ThemeStyle = {
  fonts: {
    display: 'Outfit_500Medium',
    title: 'Outfit_600SemiBold',
    readout: 'Outfit_600SemiBold',
    body: 'Figtree_400Regular',
    bodyMedium: 'Figtree_500Medium',
    bodyStrong: 'Figtree_600SemiBold',
    bodyBold: 'Figtree_700Bold',
  },
  type: {
    title: 28,
    compactTitle: 21,
    hero: 31,
    h3: 17,
    cardTitle: 15.5,
    sheetTitle: 19,
    modalTitle: 18,
    dialogTitle: 20,
    eyebrowUppercase: false,
    eyebrowSize: 13,
    eyebrowTracking: 0,
  },
  radii: {
    card: 24,
    tile: 18,
    chip: 999,
    button: 999,
    input: 16,
    photo: 22,
    bar: 999,
    sheet: 28,
    iconButton: 999,
    dialog: 24,
    hero: 38,
    tabBar: 30,
  },
  borders: { card: 0, chip: 0, rule: 1, input: 1.5 },
  tabBar: { floating: true, inset: 12, activeMark: 'pill' },
  icons: { strokeWidth: 1.9, duotone: true },
  photos: { treatment: 'soft-wash' },
  hero: { texture: 'soft-circles' },
};

/** `rgba()` of a 6-digit hex colour. */
const tint = (hex: string, alpha: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

/** Meadow light shadows are tinted with the palette primary (#287647). */
const MEADOW_PRIMARY = '#287647';

export const meadowLightShadows: ThemeShadows = {
  card: {
    boxShadow: `0 8px 26px ${tint(MEADOW_PRIMARY, 0.1)}, 0 1px 3px ${tint(MEADOW_PRIMARY, 0.07)}`,
  },
  button: { boxShadow: `0 8px 18px ${tint(MEADOW_PRIMARY, 0.28)}` },
  iconButton: { boxShadow: `0 4px 12px ${tint(MEADOW_PRIMARY, 0.26)}` },
  chip: { boxShadow: `0 2px 8px ${tint(MEADOW_PRIMARY, 0.1)}` },
  tabBar: { boxShadow: `0 10px 30px ${tint(MEADOW_PRIMARY, 0.18)}` },
  sheet: { boxShadow: '0 -10px 30px rgba(0,0,0,0.18)' },
  dialog: { boxShadow: '0 18px 44px rgba(0,0,0,0.30)' },
  photo: { boxShadow: `0 8px 20px ${tint(MEADOW_PRIMARY, 0.16)}` },
};

export const meadowDarkShadows: ThemeShadows = {
  card: { boxShadow: '0 10px 26px rgba(0,0,0,0.38)' },
  button: { boxShadow: '0 8px 18px rgba(0,0,0,0.35)' },
  iconButton: { boxShadow: '0 4px 12px rgba(0,0,0,0.40)' },
  chip: { boxShadow: '0 2px 8px rgba(0,0,0,0.30)' },
  tabBar: { boxShadow: '0 10px 30px rgba(0,0,0,0.50)' },
  sheet: { boxShadow: '0 -10px 30px rgba(0,0,0,0.18)' },
  dialog: { boxShadow: '0 18px 44px rgba(0,0,0,0.30)' },
  photo: {},
};
