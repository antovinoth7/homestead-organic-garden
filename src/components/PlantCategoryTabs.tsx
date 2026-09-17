import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { GardenIcon } from '@/components/GardenIcon';
import { CATALOG_GROUP_ICON_KEYS } from '@/config/iconRegistry';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { CATALOG_GROUP_ORDER } from '@/config/plants/catalogTaxonomy';
import { CATALOG_GROUP_LABELS } from '@/utils/plantLabels';
import type { CatalogGroup } from '@/types/database.types';

interface CategoryPillProps {
  group: CatalogGroup;
  label: string;
  count: number;
  isActive: boolean;
  onPress: (group: CatalogGroup) => void;
}

/**
 * One pill, split out so that tapping a sibling does not re-render the whole
 * row — and so each pill owns a stable handler rather than a fresh closure
 * built in the parent's JSX on every render.
 */
function CategoryPillComponent({
  group,
  label,
  count,
  isActive,
  onPress,
}: CategoryPillProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onPress(group), [onPress, group]);

  return (
    <TouchableOpacity
      style={[styles.categoryPill, isActive && styles.categoryPillActive]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${label}, ${count} ${count === 1 ? 'plant' : 'plants'}`}
    >
      <GardenIcon
        name={CATALOG_GROUP_ICON_KEYS[group]}
        size={14}
        color={isActive ? theme.primary : theme.textSecondary}
      />
      <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={[styles.categoryPillBadge, isActive && styles.categoryPillBadgeActive]}>
          <Text
            style={[styles.categoryPillBadgeText, isActive && styles.categoryPillBadgeTextActive]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const CategoryPill = React.memo(CategoryPillComponent);

interface Props {
  activeGroup: CatalogGroup;
  groupCounts: Record<CatalogGroup, number>;
  onGroupChange: (group: CatalogGroup) => void;
}

/**
 * The catalog's top-level pills — one per purpose group.
 *
 * Purpose, not growth habit: these used to be `PlantType` values, which mixed
 * "what you harvest" (vegetable, herb, flower) with "what shape it grows in"
 * (shrub, tree) and one single species (coconut_tree). A pill stays rendered at
 * a count of zero so a group whose entries were all deleted is still reachable —
 * the hidden-plants section that restores them lives inside it.
 *
 * Memoised, because this row sits in the catalog's list header and would
 * otherwise re-render on every keystroke in search and every sheet toggle.
 */
function PlantCategoryTabsComponent({
  activeGroup,
  groupCounts,
  onGroupChange,
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
      {CATALOG_GROUP_ORDER.map((group) => (
        <CategoryPill
          key={group}
          group={group}
          label={CATALOG_GROUP_LABELS[group]}
          count={groupCounts[group] ?? 0}
          isActive={activeGroup === group}
          onPress={onGroupChange}
        />
      ))}
    </ScrollView>
  );
}

export const PlantCategoryTabs = React.memo(PlantCategoryTabsComponent);
