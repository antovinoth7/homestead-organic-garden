import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { PLANT_CATEGORIES } from '@/services/plantProfiles';
import { PlantType } from '@/types/database.types';
import { CATEGORY_LABELS } from '@/utils/plantLabels';

interface Props {
  activeCategory: PlantType;
  allCategoryCounts: Record<PlantType, number>;
  onCategoryChange: (category: PlantType) => void;
}

export function PlantCategoryTabs({
  activeCategory,
  allCategoryCounts,
  onCategoryChange,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryScrollContent}
    >
      {PLANT_CATEGORIES.map((category) => {
        const isActive = activeCategory === category;
        const count = allCategoryCounts[category] ?? 0;
        return (
          <TouchableOpacity
            key={category}
            style={[styles.categoryPill, isActive && styles.categoryPillActive]}
            onPress={() => onCategoryChange(category)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
              {CATEGORY_LABELS[category]}
            </Text>
            {count > 0 && (
              <View style={[styles.categoryPillBadge, isActive && styles.categoryPillBadgeActive]}>
                <Text
                  style={[
                    styles.categoryPillBadgeText,
                    isActive && styles.categoryPillBadgeTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
