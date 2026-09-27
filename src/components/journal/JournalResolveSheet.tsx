import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalSheetStyles';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import type { TreatmentEffectiveness } from '@/types/database.types';

interface Props {
  visible: boolean;
  /** Pest or disease name. */
  name: string;
  /** "Bed 1 · open 6 days". */
  subtitle: string;
  treatment: string;
  /** null = Skip: resolve without rating (keeps any earlier rating). */
  onAnswer: (effectiveness: TreatmentEffectiveness | null) => void;
  onClose: () => void;
}

/**
 * Asked when resolving a problem that has a treatment on record: how well did
 * it work? The answer is the farmer's own evidence for next time.
 */
export function JournalResolveSheet({
  visible,
  name,
  subtitle,
  treatment,
  onAnswer,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const handlers = useMemo(
    () => ({
      effective: () => onAnswer('effective'),
      partial: () => onAnswer('partially_effective'),
      ineffective: () => onAnswer('ineffective'),
      skip: () => onAnswer(null),
    }),
    [onAnswer]
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}
    >
      <SheetHandle onClose={onClose} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          Resolve {name}?
        </Text>
        {subtitle !== '' && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={styles.questionBox}>
          <Text style={styles.questionText}>
            How well did “{treatment}” work? It&apos;s saved as your own evidence for next time.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.actionRow, styles.actionRowPrimary]}
          onPress={handlers.effective}
          accessibilityRole="button"
        >
          <View style={[styles.answerDot, styles.answerDotEffective]} />
          <Text style={[styles.actionText, styles.actionTextOnPrimary]}>Worked well</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handlers.partial}
          accessibilityRole="button"
        >
          <View style={[styles.answerDot, styles.answerDotPartial]} />
          <Text style={styles.actionText}>Partly worked</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handlers.ineffective}
          accessibilityRole="button"
        >
          <View style={[styles.answerDot, styles.answerDotIneffective]} />
          <Text style={[styles.actionText, styles.actionTextDanger]}>Didn&apos;t work</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ghostButton}
          onPress={handlers.skip}
          accessibilityRole="button"
        >
          <Text style={styles.ghostButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
