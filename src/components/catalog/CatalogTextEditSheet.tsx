import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogSheetStyles';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import VoiceDictation from '@/components/VoiceDictation';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onCommit: (next: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  /** Applied on every keystroke — pass sanitizeNum / sanitizeDecimal / sanitizeName. */
  sanitize?: (raw: string) => string;
  placeholder?: string;
  helpText?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  /** Renders the தமிழ்/English + mic control above the input. */
  dictation?: boolean;
}

/**
 * Single-field editor for a dense catalog row.
 *
 * Commits on Done *and* on dismissal, so a typed value is never silently lost
 * by a backdrop tap — the row it came from shows the value, not an input, and
 * a dropped edit would be invisible.
 */
export function CatalogTextEditSheet({
  visible,
  onClose,
  title,
  value,
  onCommit,
  keyboardType = 'default',
  sanitize,
  placeholder,
  helpText,
  maxLength,
  autoCapitalize = 'sentences',
  dictation = false,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [draft, setDraft] = useState(value);

  // Re-seed whenever the sheet opens for a (possibly different) field.
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const handleChange = useCallback(
    (raw: string) => setDraft(sanitize ? sanitize(raw) : raw),
    [sanitize]
  );

  const commitAndClose = useCallback(() => {
    onCommit(draft);
    onClose();
  }, [onCommit, draft, onClose]);

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
      {/* Feeds `draft`, not `value` — the sheet commits its own copy, and
          `handleChange` keeps dictated text under the same sanitizer as typing. */}
      {dictation && <VoiceDictation value={draft} onChangeText={handleChange} />}
      <FloatingLabelInput
        label={title}
        value={draft}
        onChangeText={handleChange}
        keyboardType={keyboardType}
        placeholder={placeholder}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={commitAndClose}
      />
      <TouchableOpacity style={styles.doneButton} onPress={commitAndClose} activeOpacity={0.85}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}
