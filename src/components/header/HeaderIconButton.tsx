import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { AccessibilityState } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/headerActionStyles';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** What the button does, e.g. "Search journal". A badge count is appended. */
  accessibilityLabel: string;
  /** The control's own panel is open — accent fill, primary icon. */
  active?: boolean;
  /** Facets off default; 0 hides the badge. Hidden while `active`, since the facets are then on screen. */
  badgeCount?: number;
  /** A collapsed search still holding a query. */
  showDot?: boolean;
  accessibilityState?: AccessibilityState;
}

/**
 * The filled circle every browse header uses for search, filter and similar
 * actions. Applied filters show only as the badge — the fill changes for an
 * open panel and nothing else, so the two states never read as one.
 */
function HeaderIconButtonComponent({
  icon,
  onPress,
  accessibilityLabel,
  active = false,
  badgeCount = 0,
  showDot = false,
  accessibilityState,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const showBadge = badgeCount > 0 && !active;

  return (
    <TouchableOpacity
      style={[styles.iconBtn, active && styles.iconBtnActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        badgeCount > 0 ? `${accessibilityLabel}, ${badgeCount} active` : accessibilityLabel
      }
      accessibilityState={accessibilityState}
    >
      <Ionicons name={icon} size={20} color={active ? theme.primary : theme.textInverse} />
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>
            {badgeCount}
          </Text>
        </View>
      )}
      {showDot && !showBadge && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

export const HeaderIconButton = React.memo(HeaderIconButtonComponent);
