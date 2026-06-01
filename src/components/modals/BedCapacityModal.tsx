import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedCapacityModalStyles';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  overflowCm: number;
  onClose: () => void;
}

export function BedCapacityModal({
  visible,
  title,
  message,
  overflowCm,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={32} color={theme.warning} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.overflowBadge}>
            <Ionicons name="resize-outline" size={16} color={theme.warningDark} />
            <Text style={styles.overflowLabel}>Over by </Text>
            <Text style={styles.overflowBadgeText}>{Math.round(overflowCm)} cm</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle-outline" size={18} color={theme.textInverse} />
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
