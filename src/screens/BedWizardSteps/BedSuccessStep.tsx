import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedCreationWizardStyles';

interface Props {
  onDone: () => void;
}

export function BedSuccessStep({ onDone }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.stepContainer, styles.successContainer]}>
      <Ionicons name="checkmark-circle" size={72} color={theme.primary} />
      <Text style={styles.successTitle}>Bed created!</Text>
      <Text style={styles.successSubtitle}>
        Bed-level tasks have been scheduled. You can now add plants, view rotation health, and track
        tasks.
      </Text>
      <TouchableOpacity style={styles.doneButton} onPress={onDone}>
        <Text style={styles.doneButtonText}>View Beds</Text>
      </TouchableOpacity>
    </View>
  );
}
