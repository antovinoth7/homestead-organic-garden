import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/theme/colors';
import type { GrowthStage } from '@/types/database.types';
import type { createStyles } from '@/styles/plantDetailStyles';

type DetailStyles = ReturnType<typeof createStyles>;

const GROWTH_STAGES: GrowthStage[] = [
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'dormant',
  'mature',
];

const GROWTH_STAGE_ICONS: Record<GrowthStage, React.ComponentProps<typeof Ionicons>['name']> = {
  seedling: 'leaf-outline',
  vegetative: 'nutrition-outline',
  flowering: 'flower-outline',
  fruiting: 'basket-outline',
  dormant: 'moon-outline',
  mature: 'checkmark-circle-outline',
};

interface Props {
  visible: boolean;
  styles: DetailStyles;
  theme: Theme;
  onClose: () => void;
  onSelect: (stage: GrowthStage) => void;
}

/** Bottom-sheet picker for manually pinning a plant's growth stage. */
export function PinGrowthStageModal({
  visible,
  styles,
  theme,
  onClose,
  onSelect,
}: Props): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.pinModalOverlay}>
        <TouchableOpacity style={styles.pinModalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.pinModalSheet}>
          <View style={styles.pinModalHeader}>
            <Text style={styles.pinModalTitle}>Pin Growth Stage</Text>
            <TouchableOpacity style={styles.pinModalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
          {GROWTH_STAGES.map((s, index) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.pinModalItem,
                index === GROWTH_STAGES.length - 1 && styles.pinModalItemLast,
              ]}
              onPress={() => onSelect(s)}
            >
              <Ionicons name={GROWTH_STAGE_ICONS[s]} size={20} color={theme.primary} />
              <Text style={styles.pinModalItemText}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}
