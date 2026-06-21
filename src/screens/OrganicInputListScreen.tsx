import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, SectionList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import FieldHelp from '@/components/FieldHelp';
import { getGroupedOrganicInputs, CATEGORY_DESCRIPTIONS, ORGANIC_RECIPES } from '@/config/organicInputs';
import { createStyles } from '@/styles/referenceListStyles';
import type { OrganicInputListScreenNavigationProp } from '@/types/navigation.types';
import type { OrganicInputEntry, OrganicInputCategory } from '@/types/database.types';

interface SectionData {
  title: string;
  category: OrganicInputCategory;
  data: OrganicInputEntry[];
}

/** Input ids that have a farm-scaled DIY recipe — deep-link these to the recipe calculator. */
const RECIPE_INPUT_IDS = new Set<string>(ORGANIC_RECIPES.map((r) => r.id));

export default function OrganicInputListScreen(): React.JSX.Element {
  const navigation = useNavigation<OrganicInputListScreenNavigationProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const sections: SectionData[] = useMemo(() => {
    const groups = getGroupedOrganicInputs();
    const query = search.trim().toLowerCase();

    return groups
      .map((g) => ({
        title: g.label,
        category: g.category,
        data: query
          ? g.inputs.filter(
              (i) =>
                i.name.toLowerCase().includes(query) ||
                (i.tamilName && i.tamilName.includes(query)) ||
                i.plantsIdeal.some((pl) => pl.toLowerCase().includes(query))
            )
          : g.inputs,
      }))
      .filter((s) => s.data.length > 0);
  }, [search]);

  const handlePress = useCallback(
    (inputId: string) => {
      // Inputs that have a farm-scaled DIY recipe (e.g. Jeevamrutha) open the
      // recipe calculator directly rather than the static reference card.
      if (RECIPE_INPUT_IDS.has(inputId)) {
        navigation.navigate('InputRecipes', { initialTab: inputId });
        return;
      }
      navigation.navigate('OrganicInputDetail', { inputId });
    },
    [navigation]
  );

  const handleOpenRecipes = useCallback(() => {
    navigation.navigate('InputRecipes', {});
  }, [navigation]);

  const renderListHeader = useCallback(
    () => (
      <TouchableOpacity
        style={styles.recipeBanner}
        onPress={handleOpenRecipes}
        activeOpacity={0.7}
      >
        <View style={styles.recipeBannerIcon}>
          <Ionicons name="flask" size={24} color={theme.primary} />
        </View>
        <View style={styles.recipeBannerContent}>
          <Text style={styles.recipeBannerTitle}>Make your own (Recipes)</Text>
          <Text style={styles.recipeBannerSubtitle} numberOfLines={2}>
            Jeevamrutha, Panchagavya &amp; more — ingredients scaled to your farm size
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.primary} />
      </TouchableOpacity>
    ),
    [styles, theme, handleOpenRecipes]
  );

  const renderItem = useCallback(
    ({ item }: { item: OrganicInputEntry }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePress(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.tamilName ? (
            <Text style={styles.cardCategory} numberOfLines={1}>
              {item.tamilName}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      </TouchableOpacity>
    ),
    [styles, theme, handlePress]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{section.title}</Text>
        <FieldHelp
          title={section.title}
          description={CATEGORY_DESCRIPTIONS[section.category]}
          compact
        />
      </View>
    ),
    [styles]
  );

  const keyExtractor = useCallback((item: OrganicInputEntry) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigation.goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Organic Inputs</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search inputs…"
          placeholderTextColor={theme.inputPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={search.trim() ? null : renderListHeader}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 },
        ]}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No inputs match your search</Text>
          </View>
        }
      />
    </View>
  );
}
