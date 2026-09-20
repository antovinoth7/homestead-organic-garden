import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/expandableBlockStyles';

// Enable LayoutAnimation on Android only for the old architecture.
const isNewArchitectureEnabled =
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager != null;

if (Platform.OS === 'android' && !isNewArchitectureEnabled) {
  try {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  } catch {
    // Silently ignore if unavailable.
  }
}

export type ExpandableAccent = 'high' | 'medium' | 'low';

interface Props {
  title: string;
  /** One-line teaser shown while collapsed. */
  summary?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Urgency dot shown instead of the icon (error/warning/success tones). */
  accent?: ExpandableAccent;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

/**
 * Compact in-card accordion for reference content: a one-line header row that
 * expands in place. Lighter cousin of CollapsibleSection (no form badges),
 * sized to sit inside a DetailCard.
 */
export function ExpandableBlock({
  title,
  summary,
  icon,
  accent,
  defaultExpanded = false,
  children,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const accentStyle =
    accent === 'high' ? styles.accentHigh : accent === 'medium' ? styles.accentMedium : styles.accentLow;

  return (
    <View style={styles.block}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? `Collapse ${title}` : `Expand ${title}`}
      >
        {accent ? (
          <View style={[styles.accentDot, accentStyle]} />
        ) : icon ? (
          <Ionicons name={icon} size={16} color={theme.primary} />
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {!expanded && summary ? (
            <Text style={styles.summary} numberOfLines={1}>
              {summary}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}
