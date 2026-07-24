import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/showMoreFooterStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  /** Items currently rendered. */
  visibleCount: number;
  /** Items available in total. */
  totalCount: number;
  /** Items beyond the current window. */
  remaining: number;
  /** True once the window has grown past its initial size. */
  canCollapse: boolean;
  onShowMore: () => void;
  onShowLess: () => void;
  /** Plural noun for the count caption, e.g. "photos". */
  itemNoun?: string;
}

/**
 * Progressive-disclosure footer for windowed lists. Pairs with
 * `paginateList` — the caller owns the window size, this owns the chrome.
 *
 * The caption always states the full total so the size of the dataset is
 * never hidden behind the button.
 */
export function ShowMoreFooter({
  visibleCount,
  totalCount,
  remaining,
  canCollapse,
  onShowMore,
  onShowLess,
  itemNoun = 'entries',
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleShowMore = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onShowMore();
  }, [onShowMore]);

  const handleShowLess = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onShowLess();
  }, [onShowLess]);

  if (remaining === 0 && !canCollapse) return null;

  return (
    <View style={styles.footer}>
      <Text style={styles.count}>
        Showing {visibleCount} of {totalCount} {itemNoun}
      </Text>
      <View style={styles.actions}>
        {canCollapse && (
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={handleShowLess}
            accessibilityRole="button"
            accessibilityLabel="Show less"
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Show less</Text>
            <Ionicons name="chevron-up" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        {remaining > 0 && (
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={handleShowMore}
            accessibilityRole="button"
            accessibilityLabel={`Show more, ${remaining} remaining`}
          >
            <Text style={styles.buttonText}>Show more ({remaining} more)</Text>
            <Ionicons name="chevron-down" size={14} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
