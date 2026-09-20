/**
 * SectionHeader — the dashboard's section heading.
 *
 * A 17px title with an optional right-aligned action link, sitting on the page
 * background above its content rather than inside a card. Sections that own a
 * horizontal rail use this so their heading lines up with the 16px page gutter
 * while the rail itself can still bleed off the right edge.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/sectionHeaderStyles';

interface Props {
  title: string;
  /** Omit both to render a title-only header. */
  actionLabel?: string;
  onPressAction?: () => void;
}

export const SectionHeader = React.memo(function SectionHeader({
  title,
  actionLabel,
  onPressAction,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {actionLabel !== undefined && onPressAction !== undefined && (
        <TouchableOpacity
          style={styles.action}
          onPress={onPressAction}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});
