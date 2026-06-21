/**
 * TipStrip (Phase C, C.14).
 *
 * Dismissible daily advice strip. Dismissal is persisted per calendar day
 * (AsyncStorage `tip_dismissed_YYYY-MM-DD`) so the same tip doesn't reappear
 * the same day but returns the next day.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeGetItem, safeSetItem } from '@/utils/safeStorage';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/tipStripStyles';

interface Props {
  tip: string | null;
  icon?: string;
}

function todayKey(): string {
  return `tip_dismissed_${new Date().toISOString().slice(0, 10)}`;
}

export const TipStrip = React.memo(function TipStrip({
  tip,
  icon = '💡',
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    safeGetItem(todayKey()).then((stored) => {
      if (active && stored === 'true') setDismissed(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    void safeSetItem(todayKey(), 'true');
  }, []);

  if (!tip || dismissed) return null;

  return (
    <View style={styles.strip}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text}>{tip}</Text>
      <TouchableOpacity
        style={styles.close}
        onPress={dismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
});
