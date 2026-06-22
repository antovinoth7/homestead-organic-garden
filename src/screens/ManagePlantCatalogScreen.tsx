import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { MoreStackParamList } from '@/types/navigation.types';
import { PlantCategoryTabs } from '@/components/PlantCategoryTabs';
import { PlantCatalogRow } from '@/components/PlantCatalogRow';
import { usePlantCatalogManager } from '@/hooks/usePlantCatalogManager';

export default function ManagePlantCatalogScreen(): React.JSX.Element {
  const moreNav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const { activeCategory, setActiveCategory, loading, categoryData, allCategoryCounts } =
    usePlantCatalogManager();

  const keyExtractor = useCallback((name: string) => name, []);

  const onPlantPress = useCallback(
    (plantName: string) => {
      moreNav.navigate('CatalogPlantDetail', {
        plantName,
        plantType: activeCategory,
        isCreating: false,
      });
    },
    [moreNav, activeCategory]
  );

  const onAddPlant = useCallback(() => {
    moreNav.navigate('CatalogPlantDetail', {
      plantName: '',
      plantType: activeCategory,
      isCreating: true,
    });
  }, [moreNav, activeCategory]);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <PlantCatalogRow
        plantName={item}
        count={categoryData.counts[item] ?? 0}
        onPress={onPlantPress}
      />
    ),
    [categoryData.counts, onPlantPress]
  );

  const renderSeparator = useCallback(() => <View style={styles.rowDivider} />, [styles]);

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyWrapper}>
        <Text style={styles.emptyText}>No plants yet. Tap + to add one.</Text>
      </View>
    ),
    [styles]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => moreNav.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Plant Catalog</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <PlantCategoryTabs
            activeCategory={activeCategory}
            allCategoryCounts={allCategoryCounts}
            onCategoryChange={setActiveCategory}
          />

          <View style={styles.listCardWrap}>
            <FlatList
              data={categoryData.plantNames}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ItemSeparatorComponent={renderSeparator}
              ListEmptyComponent={listEmpty}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 80 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
            onPress={onAddPlant}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
