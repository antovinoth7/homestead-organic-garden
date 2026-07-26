import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * Shared card metrics for the dashboard's inset blocks. Every card on the
 * Today screen — here and in WeatherCard / SeasonPanel / TipStrip — uses the same gutter, radius, padding and
 * vertical rhythm, so the scroll reads as one surface.
 */
const CARD_MARGIN_HORIZONTAL = 16;
const CARD_MARGIN_TOP = 12;
const CARD_MARGIN_BOTTOM = 4;
const CARD_RADIUS = 12;
const CARD_PADDING = 14;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    // Scroll body — the DashboardHero scrolls with it, so nothing is fixed
    // except the status-bar backdrop below.
    scrollArea: {
      flex: 1,
    },
    // Keeps the status-bar strip green once the hero has scrolled under it.
    statusBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.heroGradientStart,
      zIndex: 1,
    },
    // Pre-monsoon prep card
    preMonsoonCard: {
      marginHorizontal: CARD_MARGIN_HORIZONTAL,
      marginTop: CARD_MARGIN_TOP,
      marginBottom: CARD_MARGIN_BOTTOM,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: CARD_RADIUS,
      padding: CARD_PADDING,
      borderWidth: 1,
      borderColor: theme.primary + '40',
    },
    preMonsoonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    preMonsoonTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    preMonsoonClose: {
      padding: 2,
    },
    preMonsoonTaskRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 6,
    },
    preMonsoonTaskIcon: {
      fontSize: 18,
      lineHeight: 22,
    },
    preMonsoonTaskText: {
      flex: 1,
    },
    preMonsoonTaskTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    preMonsoonTaskDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 16,
      marginTop: 2,
    },
    // Green-manure suggestion — a seasonal prompt, not an alert, so it nests
    // inside SeasonPanel rather than the "Falling behind" rail. The panel
    // supplies the gutter, hence no horizontal margin here.
    greenManureCard: {
      marginTop: CARD_MARGIN_TOP,
      backgroundColor: theme.background,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    greenManureHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    greenManureTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    greenManureClose: {
      padding: 2,
    },
    greenManureMessage: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    // Empty state
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      marginTop: 48,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    emptyButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.primary,
      borderRadius: 24,
    },
    emptyButtonText: {
      color: theme.textInverse,
      fontSize: 15,
      fontWeight: '600',
    },
    // First-paint loading spinner (matches the rest of the app)
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
  });
