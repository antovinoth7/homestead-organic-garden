import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { createStyles } from '@/styles/offlineBannerStyles';

/**
 * Slim connectivity strip mounted above the navigator (App.tsx).
 * Offline: warns that changes are saved locally (with pending count).
 * Back online with queued writes: shows sync-in-progress until the queue
 * drains. Hidden entirely when online with nothing pending.
 */
function OfflineBanner(): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { isOnline, pendingCount } = useOfflineStatus();

  if (isOnline && pendingCount === 0) return null;

  // The status bar is translucent, so the banner absorbs the top inset itself
  const insetPadding = { paddingTop: insets.top + 6 };

  if (!isOnline) {
    const message =
      pendingCount > 0
        ? `Offline — ${pendingCount} change${pendingCount === 1 ? '' : 's'} will sync when connected`
        : 'Offline — showing saved data';
    return (
      <View style={[styles.banner, insetPadding]} accessibilityRole="alert" accessibilityLabel={message}>
        <Ionicons name="cloud-offline-outline" size={14} color={theme.warningDark} />
        <Text style={styles.text}>{message}</Text>
      </View>
    );
  }

  const syncingMessage = `Syncing ${pendingCount} change${pendingCount === 1 ? '' : 's'}…`;
  return (
    <View
      style={[styles.banner, styles.bannerSyncing, insetPadding]}
      accessibilityRole="alert"
      accessibilityLabel={syncingMessage}
    >
      <Ionicons name="cloud-upload-outline" size={14} color={theme.success} />
      <Text style={[styles.text, styles.textSyncing]}>{syncingMessage}</Text>
    </View>
  );
}

export default React.memo(OfflineBanner);
