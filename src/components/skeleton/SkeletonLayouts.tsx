import React, { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/skeletonStyles';
import { Skeleton } from './Skeleton';
import { SkeletonBlock } from './SkeletonBlock';

/**
 * Ready-made placeholder layouts. Each wraps itself in a `Skeleton`, so a call
 * site is one line; nested inside a larger `Skeleton` they share its pulse.
 */

type Styles = ReturnType<typeof createStyles>;

function useSkeletonStyles(): Styles {
  const theme = useTheme();
  return useMemo(() => createStyles(theme), [theme]);
}

function useIndexes(count: number): number[] {
  return useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
}

// ── SkeletonList ──────────────────────────────────────────────────────────

interface ListProps {
  label: string;
  /** Rows to draw — roughly one screenful. */
  count?: number;
  thumb?: 'square' | 'round' | 'none';
  /** Drop the list gutter, for a host (sheet, section) that pads itself. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
}

const THUMB_STYLE = {
  square: 'thumbSquare',
  round: 'thumbRound',
  none: null,
} as const;

/** Card rows of thumb + two text lines — plant, bed and picker lists. */
function SkeletonListComponent({
  label,
  count = 6,
  thumb = 'square',
  flush = false,
  style,
}: Readonly<ListProps>): React.JSX.Element {
  const styles = useSkeletonStyles();
  const rows = useIndexes(count);
  const thumbKey = THUMB_STYLE[thumb];
  const thumbStyle = thumbKey ? styles[thumbKey] : null;

  return (
    <Skeleton label={label} style={[styles.list, flush && styles.listFlush, style]}>
      {rows.map((index) => (
        <View
          key={index}
          style={[styles.row, index === rows.length - 1 && rows.length > 2 && styles.faded]}
        >
          {thumbStyle && <SkeletonBlock style={thumbStyle} />}
          <View style={styles.rowBody}>
            <SkeletonBlock style={styles.lineWide} />
            <SkeletonBlock style={styles.lineNarrow} tone="soft" />
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

export const SkeletonList = React.memo(SkeletonListComponent);

// ── SkeletonCards ─────────────────────────────────────────────────────────

export type SkeletonCardSize = 'short' | 'medium' | 'tall';

interface CardsProps {
  label: string;
  /** One entry per card, top to bottom. */
  cards?: readonly SkeletonCardSize[];
  /** Drop the list gutter, for a host that pads itself. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_CARDS: readonly SkeletonCardSize[] = ['medium', 'short', 'short'];

const CARD_SIZE_STYLE = {
  short: 'cardShort',
  medium: 'cardMedium',
  tall: 'cardTall',
} as const satisfies Record<SkeletonCardSize, string>;

/** A stack of plain card blocks; the last one fades, as on the Care Plan. */
function SkeletonCardsComponent({
  label,
  cards = DEFAULT_CARDS,
  flush = false,
  style,
}: Readonly<CardsProps>): React.JSX.Element {
  const styles = useSkeletonStyles();

  return (
    <Skeleton label={label} style={[styles.cards, flush && styles.listFlush, style]}>
      {cards.map((size, index) => (
        <View key={index} style={index === cards.length - 1 && cards.length > 1 && styles.faded}>
          <SkeletonBlock style={[styles.card, styles[CARD_SIZE_STYLE[size]]]} />
        </View>
      ))}
    </Skeleton>
  );
}

export const SkeletonCards = React.memo(SkeletonCardsComponent);

// ── SkeletonDetail ────────────────────────────────────────────────────────

interface DetailProps {
  label: string;
  /** `photo` matches a full-bleed plant hero, `compact` a coloured banner. */
  hero?: 'photo' | 'compact' | 'none';
  /** Section cards below the title. */
  sections?: number;
  style?: StyleProp<ViewStyle>;
}

/** A detail screen: hero, title and subtitle, a chip row, section cards. */
function SkeletonDetailComponent({
  label,
  hero = 'photo',
  sections = 2,
  style,
}: Readonly<DetailProps>): React.JSX.Element {
  const styles = useSkeletonStyles();
  const sectionIndexes = useIndexes(sections);

  return (
    <Skeleton label={label} style={[styles.detail, style]}>
      {hero !== 'none' && (
        <SkeletonBlock style={hero === 'photo' ? styles.hero : styles.heroCompact} tone="soft" />
      )}
      <View style={styles.detailBody}>
        <SkeletonBlock style={styles.lineTitle} />
        <SkeletonBlock style={styles.lineNarrow} tone="soft" />
        <View style={styles.chipRow}>
          <SkeletonBlock style={styles.chip} tone="soft" />
          <SkeletonBlock style={styles.chip} tone="soft" />
          <SkeletonBlock style={styles.chip} tone="soft" />
        </View>
        {sectionIndexes.map((index) => (
          <View key={index} style={index === sections - 1 && sections > 1 && styles.faded}>
            <SkeletonBlock style={styles.section} />
          </View>
        ))}
      </View>
    </Skeleton>
  );
}

export const SkeletonDetail = React.memo(SkeletonDetailComponent);

// ── SkeletonForm ──────────────────────────────────────────────────────────

interface FormProps {
  label: string;
  /** Label + field pairs to draw. */
  fields?: number;
  style?: StyleProp<ViewStyle>;
}

/** A form being filled from saved data: label lines over input blocks. */
function SkeletonFormComponent({
  label,
  fields = 5,
  style,
}: Readonly<FormProps>): React.JSX.Element {
  const styles = useSkeletonStyles();
  const fieldIndexes = useIndexes(fields);

  return (
    <Skeleton label={label} style={[styles.form, style]}>
      {fieldIndexes.map((index) => (
        <View key={index} style={index === fields - 1 && fields > 1 && styles.faded}>
          <SkeletonBlock style={styles.fieldLabel} tone="soft" />
          <SkeletonBlock style={styles.field} />
        </View>
      ))}
    </Skeleton>
  );
}

export const SkeletonForm = React.memo(SkeletonFormComponent);

// ── SkeletonGrid ──────────────────────────────────────────────────────────

interface GridProps {
  label: string;
  /** Square tiles to draw, three to a row. */
  count?: number;
  style?: StyleProp<ViewStyle>;
}

/** A three-column photo grid. */
function SkeletonGridComponent({
  label,
  count = 6,
  style,
}: Readonly<GridProps>): React.JSX.Element {
  const styles = useSkeletonStyles();
  const cells = useIndexes(count);

  return (
    <Skeleton label={label} style={[styles.grid, style]}>
      {cells.map((index) => (
        <View key={index} style={styles.gridCell}>
          <SkeletonBlock style={styles.gridTile} />
        </View>
      ))}
    </Skeleton>
  );
}

export const SkeletonGrid = React.memo(SkeletonGridComponent);

// ── SkeletonTiles ─────────────────────────────────────────────────────────

interface TilesProps {
  label: string;
  /** Equal tiles across one row. */
  count?: number;
  /** Taller tiles, for photo suggestion tiles rather than stat tiles. */
  tall?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** One row of equal tiles — stat tiles, suggestion tiles. */
function SkeletonTilesComponent({
  label,
  count = 2,
  tall = false,
  style,
}: Readonly<TilesProps>): React.JSX.Element {
  const styles = useSkeletonStyles();
  const tiles = useIndexes(count);

  return (
    <Skeleton label={label} style={[styles.tiles, style]}>
      {tiles.map((index) => (
        <SkeletonBlock key={index} style={[styles.tile, tall && styles.tileTall]} />
      ))}
    </Skeleton>
  );
}

export const SkeletonTiles = React.memo(SkeletonTilesComponent);
