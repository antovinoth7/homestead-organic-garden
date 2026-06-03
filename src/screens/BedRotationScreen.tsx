import React, { useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useBedData, BedWithCoverage } from '@/hooks/useBedData';
import { BedRotationView } from '@/components/BedRotationView';
import { createStyles } from '@/styles/bedRotationStyles';
import type { BedRotationScreenNavigationProp } from '@/types/navigation.types';

export default function BedRotationScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BedRotationScreenNavigationProp>();
  const { beds, loading } = useBedData();

  const openBed = useCallback(
    (bed: BedWithCoverage) => navigation.navigate('BedDetail', { bedId: bed.id }),
    [navigation]
  );

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.screenHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Crop rotation</Text>
      </View>

      {loading && beds.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : beds.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sync-outline" size={56} color={theme.textSecondary} />
          <Text style={styles.emptyTitle}>No beds to rotate</Text>
          <Text style={styles.emptySubtitle}>
            Create a garden bed to see its rotation status
          </Text>
        </View>
      ) : (
        <BedRotationView beds={beds} onOpenBed={openBed} />
      )}
    </View>
  );
}
