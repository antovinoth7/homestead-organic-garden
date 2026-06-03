import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedListStyles';
import { BedType, SunlightLevel } from '@/types/database.types';
import { BedActiveFilters, BedSortOption } from '@/utils/filterAndSortBeds';
import { BED_TYPE_EMOJI } from '@/components/BedCard';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';

export interface BedCounts {
  type: Record<string, number>;
  sunlight: Record<string, number>;
  raised: number;
  inGround: number;
  resting: number;
  permanent: number;
}

interface Props {
  sortBy: BedSortOption;
  setSortBy: (value: BedSortOption) => void;
  filters: BedActiveFilters;
  updateFilter: <K extends keyof BedActiveFilters>(category: K, value: BedActiveFilters[K]) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  bedCounts: BedCounts;
  parentLocations: string[];
  childLocations: string[];
  onClose: () => void;
}

const SORT_OPTIONS: [BedSortOption, string][] = [
  ['newest', '🕐 Newest'],
  ['oldest', '⌛ Oldest'],
  ['name', 'A–Z'],
  ['area', '📐 Area'],
  ['plants', '🌱 Plants'],
  ['legume', '🫛 Legume'],
];

const BED_TYPE_LABELS: Record<BedType, string> = {
  leafy: 'Leafy',
  fruiting: 'Fruiting',
  spice: 'Spice',
  root_legume: 'Root/Legume',
  climber_trellis: 'Climber',
  three_sisters: 'Three Sisters',
  medicinal_guild: 'Medicinal',
};

const BED_TYPE_ORDER: BedType[] = [
  'leafy',
  'fruiting',
  'spice',
  'root_legume',
  'climber_trellis',
  'three_sisters',
  'medicinal_guild',
];

const SUNLIGHT_OPTIONS: [SunlightLevel, string][] = [
  ['full_sun', '☀️ Full Sun'],
  ['partial_sun', '⛅ Partial'],
  ['shade', '🌤️ Shade'],
];

export function BedFilterSheet({
  sortBy,
  setSortBy,
  filters,
  updateFilter,
  clearAllFilters,
  hasActiveFilters,
  bedCounts,
  parentLocations,
  childLocations,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[styles.sheetContainer, { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity activeOpacity={0.6} onPress={onClose} style={styles.sheetHandleArea}>
          <View style={styles.sheetHandle} />
        </TouchableOpacity>

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Sort & Filter</Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.sheetClearBtn}>
              <Text style={styles.sheetClearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.sheetScroll}
          bounces={false}
          nestedScrollEnabled
        >
          {/* Sort By */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="swap-vertical" size={14} color={theme.textSecondary} /> Sort By
          </Text>
          <View style={styles.sheetChipWrap}>
            {SORT_OPTIONS.map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, sortBy === val && styles.sheetChipActive]}
                onPress={() => setSortBy(val)}
              >
                <Text style={[styles.sheetChipText, sortBy === val && styles.sheetChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bed Type */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="apps" size={14} color={theme.textSecondary} /> Bed Type
          </Text>
          <View style={styles.sheetChipWrap}>
            <TouchableOpacity
              style={[styles.sheetChip, filters.type === 'all' && styles.sheetChipActive]}
              onPress={() => updateFilter('type', 'all')}
            >
              <Text
                style={[styles.sheetChipText, filters.type === 'all' && styles.sheetChipTextActive]}
              >
                All
              </Text>
            </TouchableOpacity>
            {BED_TYPE_ORDER.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.type === val && styles.sheetChipActive]}
                onPress={() => updateFilter('type', val)}
              >
                <Text
                  style={[styles.sheetChipText, filters.type === val && styles.sheetChipTextActive]}
                >
                  {BED_TYPE_EMOJI[val]} {BED_TYPE_LABELS[val]}
                  {bedCounts.type[val] ? ` (${bedCounts.type[val]})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sunlight */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="sunny" size={14} color={theme.textSecondary} /> Sunlight
          </Text>
          <View style={styles.sheetChipWrap}>
            <TouchableOpacity
              style={[styles.sheetChip, filters.sunlight === 'all' && styles.sheetChipActive]}
              onPress={() => updateFilter('sunlight', 'all')}
            >
              <Text
                style={[
                  styles.sheetChipText,
                  filters.sunlight === 'all' && styles.sheetChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {SUNLIGHT_OPTIONS.map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.sunlight === val && styles.sheetChipActive]}
                onPress={() => updateFilter('sunlight', val)}
              >
                <Text
                  style={[
                    styles.sheetChipText,
                    filters.sunlight === val && styles.sheetChipTextActive,
                  ]}
                >
                  {label}
                  {bedCounts.sunlight[val] ? ` (${bedCounts.sunlight[val]})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Construction */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="construct" size={14} color={theme.textSecondary} /> Construction
          </Text>
          <View style={styles.sheetChipWrap}>
            {(
              [
                ['all', 'All', 0],
                ['raised', '🪵 Raised', bedCounts.raised],
                ['in_ground', '🟫 In-Ground', bedCounts.inGround],
              ] as const
            ).map(([val, label, count]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.construction === val && styles.sheetChipActive]}
                onPress={() => updateFilter('construction', val)}
              >
                <Text
                  style={[
                    styles.sheetChipText,
                    filters.construction === val && styles.sheetChipTextActive,
                  ]}
                >
                  {label}
                  {val !== 'all' && count ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Status */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="time" size={14} color={theme.textSecondary} /> Status
          </Text>
          <View style={styles.sheetChipWrap}>
            {(
              [
                ['all', 'All', 0],
                ['resting', '💤 Resting', bedCounts.resting],
                ['permanent', '📌 Permanent', bedCounts.permanent],
              ] as const
            ).map(([val, label, count]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.status === val && styles.sheetChipActive]}
                onPress={() => updateFilter('status', val)}
              >
                <Text
                  style={[
                    styles.sheetChipText,
                    filters.status === val && styles.sheetChipTextActive,
                  ]}
                >
                  {label}
                  {val !== 'all' && count ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="location" size={14} color={theme.textSecondary} /> Location
          </Text>
          <View style={styles.sheetChipWrap}>
            <TouchableOpacity
              style={[styles.sheetChip, filters.parentLocation === '' && styles.sheetChipActive]}
              onPress={() => {
                updateFilter('parentLocation', '');
                updateFilter('childLocation', '');
              }}
            >
              <Text
                style={[
                  styles.sheetChipText,
                  filters.parentLocation === '' && styles.sheetChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {parentLocations.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.sheetChip, filters.parentLocation === loc && styles.sheetChipActive]}
                onPress={() => {
                  updateFilter('parentLocation', loc);
                  updateFilter('childLocation', '');
                }}
              >
                <Text
                  style={[
                    styles.sheetChipText,
                    filters.parentLocation === loc && styles.sheetChipTextActive,
                  ]}
                >
                  📍 {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {filters.parentLocation !== '' && childLocations.length > 0 && (
            <>
              <Text style={styles.sheetSubSectionTitle}>Direction</Text>
              <View style={styles.sheetChipWrap}>
                <TouchableOpacity
                  style={[styles.sheetChip, filters.childLocation === '' && styles.sheetChipActive]}
                  onPress={() => updateFilter('childLocation', '')}
                >
                  <Text
                    style={[
                      styles.sheetChipText,
                      filters.childLocation === '' && styles.sheetChipTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {childLocations.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.sheetChip,
                      filters.childLocation === loc && styles.sheetChipActive,
                    ]}
                    onPress={() => updateFilter('childLocation', loc)}
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        filters.childLocation === loc && styles.sheetChipTextActive,
                      ]}
                    >
                      ◉ {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={styles.filterBottomSpacer} />
        </ScrollView>
      </View>
    </View>
  );
}
