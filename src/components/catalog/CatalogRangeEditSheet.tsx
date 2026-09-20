import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogSheetStyles';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import { sanitizeDecimal, sanitizeNum } from '@/utils/catalogDraft';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  min: string;
  max: string;
  minLabel?: string;
  maxLabel?: string;
  /** Allows a decimal point (pH, temperature) instead of whole numbers. */
  decimal?: boolean;
  onCommit: (min: string, max: string) => void;
  helpText?: string;
}

/** Min/max editor behind a `CatalogRangeRow`. Commits on Done and on dismissal. */
export function CatalogRangeEditSheet({
  visible,
  onClose,
  title,
  min,
  max,
  minLabel = 'Min',
  maxLabel = 'Max',
  decimal = false,
  onCommit,
  helpText,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [minDraft, setMinDraft] = useState(min);
  const [maxDraft, setMaxDraft] = useState(max);

  useEffect(() => {
    if (visible) {
      setMinDraft(min);
      setMaxDraft(max);
    }
  }, [visible, min, max]);

  const sanitize = decimal ? sanitizeDecimal : sanitizeNum;

  const handleMinChange = useCallback((raw: string) => setMinDraft(sanitize(raw)), [sanitize]);
  const handleMaxChange = useCallback((raw: string) => setMaxDraft(sanitize(raw)), [sanitize]);

  const commitAndClose = useCallback(() => {
    onCommit(minDraft, maxDraft);
    onClose();
  }, [onCommit, minDraft, maxDraft, onClose]);

  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={commitAndClose}
      keyboardAvoiding
      sheetStyle={[styles.sheet, { paddingBottom: bottomInset }]}
    >
      <SheetHandle onClose={commitAndClose}>
        <Text style={styles.sheetTitle}>{title}</Text>
      </SheetHandle>
      {helpText ? <Text style={styles.helpText}>{helpText}</Text> : null}
      <View style={styles.rangeFields}>
        <View style={styles.rangeField}>
          <FloatingLabelInput
            label={minLabel}
            value={minDraft}
            onChangeText={handleMinChange}
            keyboardType={decimal ? 'decimal-pad' : 'numeric'}
            autoFocus
          />
        </View>
        <View style={styles.rangeField}>
          <FloatingLabelInput
            label={maxLabel}
            value={maxDraft}
            onChangeText={handleMaxChange}
            keyboardType={decimal ? 'decimal-pad' : 'numeric'}
          />
        </View>
      </View>
      <TouchableOpacity style={styles.doneButton} onPress={commitAndClose} activeOpacity={0.85}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}
