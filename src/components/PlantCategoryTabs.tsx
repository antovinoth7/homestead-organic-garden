import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import { CATALOG_GROUP_ICON_KEYS } from '@/config/iconRegistry';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { CATALOG_GROUP_ORDER } from '@/config/plants/catalogTaxonomy';
import { CATALOG_GROUP_LABELS } from '@/utils/plantLabels';
import type { CatalogGroup } from '@/types/database.types';

interface Props {
  /** The selected group, or `'sow_now'` for the leading seasonal view. */
  activeGroup: CatalogGroup | 'sow_now';
  groupCounts: Record<CatalogGroup, number>;
  onGroupChange: (group: CatalogGroup | 'sow_now') => void;
}

/**
 * The catalog's top-level pills — one per purpose group.
 *
 * A leading Sow Now pill answers the question that beats every category: what
 * can go in the ground this month. Then the groups.
 *
 * Purpose, not growth habit: these used to be `PlantType` values, which mixed
 * "what you harvest" (vegetable, herb, flower) with "what shape it grows in"
 * (shrub, tree) and one single species (coconut_tree). A pill stays rendered at
 * a count of zero so a group whose entries were all deleted is still reachable —
 * the hidden-plants section that restores them lives inside it.
 */
export function PlantCategoryTabs({
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
      <TouchableOpacity
        key="sow_now"
        style={[styles.categoryPill, activeGroup === 'sow_now' && styles.categoryPillActive]}
        onPress={() => onGroupChange('sow_now')}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeGroup === 'sow_now' }}
        accessibilityLabel="Sow now, this month's sowing windows"
      >
        <Ionicons
          name="calendar-outline"
          size={14}
          color={activeGroup === 'sow_now' ? theme.primary : theme.textSecondary}
        />
        <Text
          style={[
            styles.categoryPillText,
            activeGroup === 'sow_now' && styles.categoryPillTextActive,
          ]}
        >
          Sow Now
        </Text>
      </TouchableOpacity>

      {CATALOG_GROUP_ORDER.map((group) => {
        const isActive = activeGroup === group;
        const count = groupCounts[group] ?? 0;
        const label = CATALOG_GROUP_LABELS[group];
        return (
          <TouchableOpacity
            key={group}
            style={[styles.categoryPill, isActive && styles.categoryPillActive]}
            onPress={() => onGroupChange(group)}
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
