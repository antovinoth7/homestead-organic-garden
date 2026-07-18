import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { createStyles } from '../../styles/photoSourceModalStyles';

type PhotoSourceModalProps = {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
};

/** Bottom action sheet for picking a photo source (camera / album). */
export default function PhotoSourceModal({
  visible,
  onClose,
  onCamera,
  onLibrary,
}: PhotoSourceModalProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const sheetPaddingBottom = Math.max(insets.bottom, 12);

  const handleAction = (action: () => void): void => {
    onClose();
    setTimeout(action, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: sheetPaddingBottom }]}>
          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleAction(onCamera)}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <Ionicons name="camera-outline" size={20} color={theme.primary} />
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleAction(onLibrary)}
              accessibilityRole="button"
              accessibilityLabel="Choose from album"
            >
              <Ionicons name="images-outline" size={20} color={theme.primary} />
              <Text style={styles.optionText}>Choose from album</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
