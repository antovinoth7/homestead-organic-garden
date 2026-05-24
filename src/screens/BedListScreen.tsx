import React, { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useBedData, BedWithCoverage } from '@/hooks/useBedData';
import { BedCard } from '@/components/BedCard';
import { AnimatedFAB } from '@/components/FloatingTabBar';
import { createStyles } from '@/styles/bedListStyles';
import type { BedListScreenNavigationProp } from '@/types/navigation.types';

export default function BedListScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BedListScreenNavigationProp>();
  const { beds, loading, error, refresh } = useBedData();

  const lowLegumeBeds = beds.filter((b) => b.legume_coverage_pct < 20 && b.plant_count > 0);

  const renderItem = ({ item }: { item: BedWithCoverage }): React.JSX.Element => (
    <BedCard bed={item} onPress={() => navigation.navigate('BedDetail', { bedId: item.id })} />
  );

  if (loading && beds.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error && beds.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Beds</Text>
        <Text style={styles.bedCount}>
          {beds.length > 0 ? `${beds.length} Bed${beds.length > 1 ? 's' : ''}` : ''}
        </Text>
      </View>

      {lowLegumeBeds.length > 0 && (
        <View style={styles.legumeBanner}>
          <Ionicons name="warning-outline" size={16} color={theme.warning ?? '#f59e0b'} />
          <Text style={styles.legumeBannerText}>
            {lowLegumeBeds.length} bed{lowLegumeBeds.length > 1 ? 's' : ''} under 20% legume
            coverage
          </Text>
        </View>
      )}

      {beds.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="grid-outline" size={56} color={theme.textSecondary} />
          <Text style={styles.emptyTitle}>No beds yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to create your first garden bed</Text>
        </View>
      ) : (
        <FlatList
          data={beds}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={loading}
        />
      )}

      <AnimatedFAB
        onPress={() => navigation.navigate('BedCreationWizard', undefined)}
        iconName="add"
      />
    </View>
  );
}
