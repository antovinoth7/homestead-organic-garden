import React, { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/alertDialogStyles';

export interface AlertDialogAction {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** `primary` fills with the accent, `secondary` tints it, `ghost` is outlined. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Accent override — defaults to `theme.primary`. Ignored by `ghost`. */
  color?: string;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title: string;
  /** Emphasised line between title and message — what the dialog is about. */
  detail?: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'warning' | 'error' | 'info';
  /** Rendered stacked full-width in order; put the recommended action first. */
  actions: AlertDialogAction[];
  onDismiss: () => void;
}

const RISE_DURATION = 180;
const START_SCALE = 0.92;
const useNativeDriver = Platform.OS !== 'web';

/**
 * Themed replacement for `Alert.alert`. The OS alert ignores the app's theme
 * entirely — notably it stays light in dark mode — and caps out at three terse
 * buttons, so anything needing a real secondary action belongs here instead.
 */
export function AlertDialog({
  visible,
  title,
  detail,
  message,
  icon = 'alert-circle-outline',
  tone = 'warning',
  actions,
  onDismiss,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const enter = useRef(new Animated.Value(0)).current;

  const toneColors = {
    warning: { fg: theme.warning, bg: theme.warningLight },
    error: { fg: theme.error, bg: theme.errorLight },
    info: { fg: theme.info, bg: theme.infoLight },
  }[tone];

  // Started from `onShow` rather than an effect on `visible`: the Modal's own
  // window fade runs first, so an earlier start would spend the animation on
  // frames nobody sees. Same approach as BottomSheetModal.
  const handleShow = useCallback(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: RISE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start();
  }, [enter]);

  const actionColors = (action: AlertDialogAction): { background: string; text: string } => {
    const accent = action.color ?? theme.primary;
    switch (action.variant) {
      case 'primary':
        return { background: accent, text: theme.textInverse };
      case 'secondary':
        return { background: `${accent}20`, text: accent };
      default:
        return { background: 'transparent', text: theme.text };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onShow={handleShow}
      onRequestClose={onDismiss}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <Animated.View
          style={[
            styles.card,
            {
              opacity: enter,
              transform: [
                { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [START_SCALE, 1] }) },
              ],
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: toneColors.bg }]}>
            <Ionicons name={icon} size={30} color={toneColors.fg} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!detail && <Text style={styles.detail}>{detail}</Text>}
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {actions.map((action) => {
              const colors = actionColors(action);
              const ghost = (action.variant ?? 'ghost') === 'ghost';
              return (
                <TouchableOpacity
                  key={action.label}
                  style={[
                    styles.action,
                    ghost ? styles.actionGhost : { backgroundColor: colors.background },
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  {!!action.icon && <Ionicons name={action.icon} size={17} color={colors.text} />}
                  <Text style={[styles.actionText, { color: colors.text }]} numberOfLines={1}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
