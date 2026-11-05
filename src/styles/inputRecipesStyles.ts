import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, eyebrow, font, radius, shadow } from '@/theme/styleTokens';

/**
 * "Make your own" recipe calculator.
 *
 * The header deliberately uses the same light treatment as the organic-input
 * and pest browse lists (background surface, green back pill, dark title)
 * rather than the dark-green block in the design reference, so all three
 * organic-input screens read as one flow.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },
    scrollContent: { paddingBottom: 24 },

    // Header block — back button, title + subtitle
    headerBlock: {
      paddingHorizontal: 18,
      paddingBottom: 14,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: radius(theme, 'iconButton', 12),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
    headerTitleGroup: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 20,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.inputPlaceholder,
      marginTop: 1,
      ...font(theme, 'body'),
    },

    // Recipe tabs — chip row on a light surface. These are navigation tabs, not
    // filters, so they stayed put when the browse screens moved their category
    // chips into `ReferenceFilterSheet`.
    tabScroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    tabRow: {
      paddingHorizontal: 18,
      paddingTop: 13,
      paddingBottom: 13,
      gap: 7,
      alignItems: 'center',
    },
    tab: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    tabText: {
      fontSize: 12.5,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    tabTextActive: {
      color: theme.textInverse,
    },

    // Recipe intro
    recipeHeader: { paddingHorizontal: 18, paddingTop: 16 },
    recipeName: {
      fontSize: 24,
      lineHeight: 27,
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },
    recipeTamilName: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 3,
      ...font(theme, 'body'),
    },
    recipeDescription: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
      marginTop: 9,
      ...font(theme, 'body'),
    },

    // Land-size scaler
    scaler: {
      marginHorizontal: 18,
      marginTop: 14,
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    scalerBody: { flex: 1, minWidth: 0 },
    scalerLabel: {
      fontSize: 10,
      letterSpacing: 0.8,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    scalerValue: {
      fontSize: 13.5,
      color: theme.primary,
      marginTop: 3,
      ...font(theme, 'bodyStrong', '600'),
    },
    scalerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    scalerButton: {
      width: 32,
      height: 32,
      borderRadius: radius(theme, 'iconButton', 10),
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scalerButtonDisabled: {
      opacity: 0.4,
    },

    // Section headings
    sectionLabel: {
      paddingHorizontal: 18,
      paddingTop: 22,
      paddingBottom: 6,
      textTransform: 'uppercase',
      color: theme.textTertiary,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 0.9, fontWeight: '700' }),
    },

    // Ingredients
    ingredientCard: {
      marginHorizontal: 18,
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 16),
      paddingHorizontal: 14,
      ...shadow(theme, 'card'),
    },
    ingredientRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    ingredientRowFirst: {
      borderTopWidth: 0,
    },
    ingredientBody: { flex: 1, minWidth: 0 },
    ingredientName: { fontSize: 14, color: theme.text, ...font(theme, 'bodyStrong', '600') },
    ingredientNote: {
      fontSize: 11.5,
      lineHeight: 16,
      color: theme.inputPlaceholder,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    ingredientQty: {
      fontSize: 15,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },

    // Preparation steps
    stepList: {
      paddingHorizontal: 18,
      gap: 9,
    },
    stepRow: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 11,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 8,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberText: { fontSize: 11.5, color: theme.textInverse, ...font(theme, 'bodyBold', '700') },
    stepText: {
      flex: 1,
      minWidth: 0,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.text,
      ...font(theme, 'body'),
    },

    // When to apply
    applyCard: {
      marginHorizontal: 18,
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 16),
      padding: 14,
      ...shadow(theme, 'card'),
    },
    applyText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.text,
      ...font(theme, 'body'),
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    frequencyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius(theme, 'chip', 16),
      backgroundColor: theme.primaryLight,
    },
    frequencyBadgeText: { fontSize: 11.5, color: theme.primary, ...font(theme, 'bodyBold', '700') },
    seasonBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius(theme, 'chip', 16),
      backgroundColor: theme.backgroundTertiary,
    },
    seasonBadgeText: { fontSize: 11.5, color: theme.textTertiary, ...font(theme, 'body') },
  });
