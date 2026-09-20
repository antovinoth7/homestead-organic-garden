import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/sheetHandleStyles';

interface Props {
  onClose: () => void;
  /** Sheet title rendered inside the same tap target, styled by the calling sheet. */
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

/**
 * The tappable drag bar every bottom sheet shares. Tapping the pill (or the
 * title passed as children) closes the sheet — without this the bar looks
 * draggable but does nothing.
 */
export function SheetHandle({
  onClose,
  children,
  accessibilityLabel = 'Close',
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={styles.handleArea}
      activeOpacity={0.6}
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
    >
      <View style={styles.handle} />
      {children}
    </TouchableOpacity>
  );
}
