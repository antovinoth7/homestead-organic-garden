import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/screenHeaderStyles';

interface Props {
  title: string;
  /** When provided, a circular back button is rendered on the left. */
  onBack?: () => void;
  backIcon?: keyof typeof Ionicons.glyphMap;
  /** Action node rendered on the right (icons, badges, edit button…). */
  right?: React.ReactNode;
  titleNumberOfLines?: number;
}

/**
 * Shared top app-bar for the bed flow (list / detail / wizard). Fixed bar with a
 * primary circular back button, a flexible title, and an optional right action
 * slot. Owns its own safe-area top inset.
 */
export function ScreenHeader({
  title,
  onBack,
  backIcon = 'chevron-back',
  right,
  titleNumberOfLines = 1,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name={backIcon} size={22} color={theme.textInverse} />
        </TouchableOpacity>
      )}
      <Text style={styles.title} numberOfLines={titleNumberOfLines}>
        {title}
      </Text>
      {right !== undefined && <View style={styles.right}>{right}</View>}
    </View>
  );
}
