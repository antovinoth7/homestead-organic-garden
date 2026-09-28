import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalFormStyles';

interface Props {
  /** Open on mount — pass true when any folded field already has a value. */
  initiallyExpanded?: boolean;
  /** Short line shown beside the toggle while collapsed, e.g. "2 parts · Neem oil". */
  summary?: string;
  children: React.ReactNode;
}

/**
 * Inline "More details" disclosure for the journal form's optional fields.
 * Lighter than `CollapsibleSection` (a full card), so it can sit inside the
 * harvest / pest-disease cards without nesting one card in another.
 */
export function JournalMoreDetails({
  initiallyExpanded = false,
  summary,
  children,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <View style={styles.moreDetails}>
      <TouchableOpacity
        style={styles.moreToggle}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.moreToggleText}>{expanded ? 'Fewer details' : 'More details'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={theme.primary} />
        {!expanded && summary ? (
          <Text style={styles.moreSummary} numberOfLines={1}>
            {summary}
          </Text>
        ) : null}
      </TouchableOpacity>
      {expanded && <View style={styles.moreBody}>{children}</View>}
    </View>
  );
}
