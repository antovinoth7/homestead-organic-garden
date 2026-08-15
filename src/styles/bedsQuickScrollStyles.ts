import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/** Card geometry — shared with BedsQuickScroll so the grid lines can be laid out without measuring. */
export const BED_CARD_WIDTH = 152;
export const BED_CARD_PADDING = 12;
export const BED_PREVIEW_HEIGHT = 44;
/** Grid-paper pitch, in px. Matches the mock's 12px ruling. */
export const BED_PREVIEW_CELL = 12;
export const BED_PREVIEW_WIDTH = BED_CARD_WIDTH - BED_CARD_PADDING * 2;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    section: {
      // No panel chrome: the rail sits directly on the page background like
      // every other block on the dashboard.
      paddingBottom: 4,
    },
    listContent: {
      paddingHorizontal: 16,
      gap: 10,
    },
    card: {
      width: BED_CARD_WIDTH,
      padding: BED_CARD_PADDING,
      borderRadius: 12,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    // ── Grid-paper preview tile ──────────────────────────────────────────────
    preview: {
      height: BED_PREVIEW_HEIGHT,
      borderRadius: 8,
      backgroundColor: theme.background,
      overflow: 'hidden',
    },
    gridLineV: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: theme.primary + '24',
    },
    gridLineH: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: theme.primary + '24',
    },
    pinRow: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    pinPlaceholder: {
      opacity: 0.35,
    },
    // ── Card body ────────────────────────────────────────────────────────────
    bedName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
      marginTop: 9,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 5,
    },
    statusChip: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusChipText: {
      fontSize: 10,
      fontWeight: '700',
    },
    plantCount: {
      flexShrink: 1,
      fontSize: 10.5,
      color: theme.textTertiary,
    },
    // ── Ghost "New bed" tile ─────────────────────────────────────────────────
    ghostCard: {
      width: 74,
      padding: BED_CARD_PADDING,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.primary + '80',
      backgroundColor: theme.primary + '0a',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    ghostText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: theme.primary,
      textAlign: 'center',
    },
  });
