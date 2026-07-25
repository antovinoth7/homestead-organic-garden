import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/pickerFieldStyles';
import FieldErrorText from '@/components/FieldErrorText';

interface Props {
  label: string;
  /** Current value; empty/undefined renders the placeholder. */
  value?: string;
  placeholder: string;
  /** Emoji thumbnail shown when a value is selected (e.g. plant emoji). */
  emoji?: string;
  /** Ionicons fallback shown when no emoji applies (e.g. location field). */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Secondary line under the value (e.g. auto-filled category). */
  subtitle?: string;
  /** Small pill shown next to the value (e.g. a source label). */
  badge?: string;
  onPress: () => void;
  /** Inline validation message shown below the field; also reddens the border. */
  errorText?: string;
  /** Hides the chevron and blocks the press when the field can't be changed. */
  disabled?: boolean;
}

/**
 * Tappable field card that opens a bottom-sheet picker. Replaces dropdown
 * fields in the single-screen add-plant flow; reusable by the edit form.
 */
export function PickerField({
  label,
  value,
  placeholder,
  emoji,
  icon,
  subtitle,
  badge,
  onPress,
  errorText,
  disabled = false,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.field, !!errorText && styles.fieldError]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        {value && emoji ? (
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        ) : (
          <View style={styles.iconCircle}>
            <Ionicons name={icon ?? 'leaf-outline'} size={18} color={theme.primary} />
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.label}>{label}</Text>
          {value ? (
            <View style={styles.valueRow}>
              <Text style={styles.value} numberOfLines={1}>
                {value}
              </Text>
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
          {value && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {!disabled && <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />}
      </TouchableOpacity>
      <FieldErrorText message={errorText} />
    </View>
  );
}
