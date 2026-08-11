import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogRowStyles';
import FieldHelp from '@/components/FieldHelp';
import FieldErrorText from '@/components/FieldErrorText';

export type CatalogRowKind = 'picker' | 'text' | 'badge';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface Props {
  label: string;
  /** Falls back to an em-dash when empty, so every row keeps its shape. */
  value?: string;
  kind: CatalogRowKind;
  helpText?: string;
  /** FieldHelp popover title; defaults to `label`. */
  helpTitle?: string;
  /** Required for 'picker' and 'text' rows — opens the matching sheet. */
  onPress?: () => void;
  errorText?: string;
  /** Grey note under the row, e.g. the feeding-intensity suggestion. */
  hint?: string;
  /** 'badge' rows only — tints the read-only pill. */
  badgeTone?: BadgeTone;
  /** Leading glyph inside a badge value. */
  badgeIcon?: string;
  disabled?: boolean;
  /** Drops the bottom hairline on the last row of a card. */
  isLast?: boolean;
}

const EMPTY_VALUE = '—';

function useBadgeColors(tone: BadgeTone): { bg: string; border: string; fg: string } {
  const theme = useTheme();
  switch (tone) {
    case 'success':
      return { bg: theme.successLight, border: theme.successBorder, fg: theme.successDark };
    case 'warning':
      return { bg: theme.warningLight, border: theme.warningBorder, fg: theme.warningDark };
    case 'error':
      return { bg: theme.errorLight, border: theme.errorBorder, fg: theme.errorDark };
    case 'info':
      return { bg: theme.infoLight, border: theme.infoBorder, fg: theme.infoDark };
    default:
      return { bg: theme.background, border: theme.border, fg: theme.textSecondary };
  }
}

/**
 * One dense read-first row: label left, value right, tap to edit. The catalog
 * detail screen is a reference card first and a form second, so values are
 * displayed rather than sat in permanently-open inputs.
 */
export function CatalogDetailRow({
  label,
  value,
  kind,
  helpText,
  helpTitle,
  onPress,
  errorText,
  hint,
  badgeTone = 'neutral',
  badgeIcon,
  disabled = false,
  isLast = false,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const badgeColors = useBadgeColors(badgeTone);

  const isEmpty = !value;
  const interactive = kind !== 'badge' && !!onPress && !disabled;

  const body = (
    <>
      <View style={styles.labelWrap}>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        {helpText ? (
          <FieldHelp
            accessibilityLabel={`More information about ${helpTitle ?? label}`}
            compact
            description={helpText}
            title={helpTitle ?? label}
          />
        ) : null}
      </View>

      <View style={styles.valueWrap}>
        {kind === 'badge' ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeColors.bg, borderColor: badgeColors.border },
            ]}
          >
            {badgeIcon ? <Text style={styles.chipText}>{badgeIcon}</Text> : null}
            <Text style={[styles.badgeText, { color: badgeColors.fg }]}>
              {value ?? EMPTY_VALUE}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.value, isEmpty && styles.valuePlaceholder]}
            numberOfLines={2}
          >
            {isEmpty ? EMPTY_VALUE : value}
          </Text>
        )}
      </View>

      {interactive && (
        <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} />
      )}
    </>
  );

  return (
    <View style={[styles.rowGroup, isLast && styles.rowGroupLast, !!errorText && styles.rowError]}>
      {interactive ? (
        <TouchableOpacity
          style={styles.row}
          onPress={onPress}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${value || 'not set'}`}
        >
          {body}
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>{body}</View>
      )}
      {errorText ? (
        <View style={styles.errorWrap}>
          <FieldErrorText message={errorText} />
        </View>
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
