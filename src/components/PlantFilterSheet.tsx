import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { SheetHandle } from './SheetHandle';
import { createStyles } from '../styles/plantsStyles';
import { HealthStatus, UNASSIGNED_PLOT_ID } from '../types/database.types';
import { UNASSIGNED_PLOT_NAME } from '../utils/plotGrouping';
import type { ActiveFilters, PlantFacetCounts } from '../utils/plantFilters';
import { TAB_BAR_HEIGHT } from '../components/FloatingTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEALTH_STATUS_LABELS, HEALTH_STATUS_TONE } from '../utils/plantLabels';
import type { StatusTone } from '../utils/plantLabels';

type SortOption = 'name' | 'newest' | 'oldest' | 'health' | 'age';

const HEALTH_STATUSES: HealthStatus[] = ['healthy', 'stressed', 'recovering', 'sick'];

const SORT_OPTIONS: readonly {
  value: SortOption;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { value: 'newest', label: 'Newest', icon: 'time-outline' },
  { value: 'oldest', label: 'Oldest', icon: 'hourglass-outline' },
  { value: 'name', label: 'A–Z', icon: 'text-outline' },
  { value: 'health', label: 'Health', icon: 'heart-outline' },
  { value: 'age', label: 'Age', icon: 'leaf-outline' },
];

/**
 * Tone -> the chip/text/dot style keys. Same tone quartet the edit form uses, so
 * a status is coloured identically whether you're filtering or editing.
 */
const TONE_STYLE_KEYS = {
  success: {
    chip: 'sheetChipActiveSuccess',
    text: 'sheetChipTextSuccess',
    dot: 'statusDotSuccess',
  },
  warning: {
    chip: 'sheetChipActiveWarning',
    text: 'sheetChipTextWarning',
    dot: 'statusDotWarning',
  },
  info: { chip: 'sheetChipActiveInfo', text: 'sheetChipTextInfo', dot: 'statusDotInfo' },
  error: { chip: 'sheetChipActiveError', text: 'sheetChipTextError', dot: 'statusDotError' },
} as const satisfies Record<StatusTone, { chip: string; text: string; dot: string }>;

/**
 * The " (n)" on a chip. Counts are taken against the other active filters, so a
 * zero is information — "picking this empties the list" — and has to be shown
 * rather than hidden, but muted so it doesn't read as an invitation.
 */
function FacetCount({
  count,
  styles,
}: {
  count: number;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return <Text style={count === 0 ? styles.sheetChipCountZero : undefined}> ({count})</Text>;
}

interface Props {
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  filters: ActiveFilters;
  updateFilter: <K extends keyof ActiveFilters>(category: K, value: ActiveFilters[K]) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  plantCounts: PlantFacetCounts;
  parentLocations: string[];
  childLocations: string[];
  onClose: () => void;
}

export function PlantFilterSheet({
  sortBy,
  setSortBy,
  filters,
  updateFilter,
  clearAllFilters,
  hasActiveFilters,
  plantCounts,
  parentLocations,
  childLocations,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  /** An active parent location the configured list has no chip for, if any. */
  const extraLocation = useMemo<string | null>(() => {
    const active = filters.parentLocation;
    if (active === '' || parentLocations.includes(active)) return null;
    return active === UNASSIGNED_PLOT_ID ? UNASSIGNED_PLOT_NAME : active;
  }, [filters.parentLocation, parentLocations]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.sheetContainer,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) },
        ]}
      >
        <SheetHandle onClose={onClose} />

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
            {SORT_OPTIONS.map(({ value, label, icon }) => {
              const isActive = sortBy === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => setSortBy(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons
                    name={icon}
                    size={14}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Plant Type */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="apps" size={14} color={theme.textSecondary} /> Plant Type
          </Text>
          <View style={styles.sheetChipWrap}>
            {(
              [
                ['all', 'All'],
                ['vegetable', '🥕 Vegetable'],
                ['fruit_tree', '🍇 Fruit'],
                ['coconut_tree', '🥥 Coconut'],
                ['herb', '🌿 Herb'],
                ['timber_tree', '🌳 Timber'],
                ['flower', '🌸 Flower'],
                ['shrub', '🪴 Shrub'],
              ] as const
            ).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.type === val && styles.sheetChipActive]}
                onPress={() => updateFilter('type', val)}
              >
                <Text
                  style={[styles.sheetChipText, filters.type === val && styles.sheetChipTextActive]}
                >
                  {label}
                  {val !== 'all' && (
                    <FacetCount count={plantCounts.type[val] ?? 0} styles={styles} />
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Health */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="fitness" size={14} color={theme.textSecondary} /> Health
          </Text>
          <View style={styles.sheetChipWrap}>
            <TouchableOpacity
              style={[styles.sheetChip, filters.health === 'all' && styles.sheetChipActive]}
              onPress={() => updateFilter('health', 'all')}
              accessibilityRole="button"
              accessibilityState={{ selected: filters.health === 'all' }}
            >
              <Text
                style={[
                  styles.sheetChipText,
                  filters.health === 'all' && styles.sheetChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {HEALTH_STATUSES.map((status) => {
              const isActive = filters.health === status;
              const tone = TONE_STYLE_KEYS[HEALTH_STATUS_TONE[status]];
              const count = plantCounts.health[status];
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.sheetChip, isActive && styles[tone.chip]]}
                  onPress={() => updateFilter('health', status)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.statusDot, styles[tone.dot]]} />
                  <Text style={[styles.sheetChipText, isActive && styles[tone.text]]}>
                    {HEALTH_STATUS_LABELS[status]}
                    <FacetCount count={count} styles={styles} />
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Space */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="cube" size={14} color={theme.textSecondary} /> Space Type
          </Text>
          <View style={styles.sheetChipWrap}>
            {(
              [
                ['all', 'All'],
                ['pot', 'Pot'],
                ['bed', 'Bed'],
                ['ground', 'Ground'],
              ] as const
            ).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.space === val && styles.sheetChipActive]}
                onPress={() => updateFilter('space', val)}
              >
                <Text
                  style={[
                    styles.sheetChipText,
                    filters.space === val && styles.sheetChipTextActive,
                  ]}
                >
                  {label}
                  {val !== 'all' && (
                    <FacetCount count={plantCounts.space[val] ?? 0} styles={styles} />
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sunlight */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="sunny" size={14} color={theme.textSecondary} /> Sunlight
          </Text>
          <View style={styles.sheetChipWrap}>
            {(
              [
                ['all', 'All', null],
                ['full_sun', 'Full Sun', 'sunny-outline'],
                ['partial_sun', 'Partial', 'partly-sunny-outline'],
                ['shade', 'Shade', 'cloudy-outline'],
              ] as const
            ).map(([val, label, icon]) => {
              const isActive = filters.sunlight === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => updateFilter('sunlight', val)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  {icon && (
                    <Ionicons
                      name={icon}
                      size={14}
                      color={isActive ? theme.primary : theme.textSecondary}
                    />
                  )}
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {label}
                    {val !== 'all' && (
                      <FacetCount count={plantCounts.sunlight[val] ?? 0} styles={styles} />
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Water */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="water" size={14} color={theme.textSecondary} /> Water Requirement
          </Text>
          <View style={styles.sheetChipWrap}>
            {(
              [
                ['all', 'All', 0],
                ['low', 'Low', 1],
                ['medium', 'Medium', 2],
                ['high', 'High', 3],
              ] as const
            ).map(([val, label, drops]) => {
              const isActive = filters.water === val;
              const count = val !== 'all' ? (plantCounts.water[val] ?? 0) : null;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => updateFilter('water', val)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={val === 'all' ? 'All' : `${label} water requirement`}
                >
                  {drops > 0 && (
                    <View style={styles.sheetChipIconGroup}>
                      {Array.from({ length: drops }, (_, i) => (
                        <Ionicons
                          key={i}
                          name="water"
                          size={14}
                          color={isActive ? theme.primary : theme.textSecondary}
                        />
                      ))}
                    </View>
                  )}
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {label}
                    {count !== null && <FacetCount count={count} styles={styles} />}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pest Status */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="bug" size={14} color={theme.textSecondary} /> Pest & Disease
          </Text>
          <View style={styles.sheetChipWrap}>
            {(
              [
                ['all', 'All', null],
                ['active_issues', 'Active Issues', 'bug-outline'],
                ['no_issues', 'No Issues', 'checkmark-circle-outline'],
              ] as const
            ).map(([val, label, icon]) => {
              const isActive = filters.pestStatus === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={() => updateFilter('pestStatus', val)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  {icon && (
                    <Ionicons
                      name={icon}
                      size={14}
                      color={isActive ? theme.primary : theme.textSecondary}
                    />
                  )}
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {label}
                    {val === 'active_issues' && (
                      <FacetCount count={plantCounts.pestActive} styles={styles} />
                    )}
                    {val === 'no_issues' && (
                      <FacetCount count={plantCounts.pestNone} styles={styles} />
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
            {/* A Today plot card can scope the list to a plot with no chip of its
                own — the unassigned bucket, or a plot renamed since its plants
                were placed. Shown so the filter is never invisible. */}
            {extraLocation !== null && (
              <TouchableOpacity
                style={[styles.sheetChip, styles.sheetChipActive]}
                onPress={() => {
                  updateFilter('parentLocation', '');
                  updateFilter('childLocation', '');
                }}
              >
                <Text style={[styles.sheetChipText, styles.sheetChipTextActive]}>
                  📍 {extraLocation}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {filters.parentLocation !== '' && (
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
                {childLocations
                  .filter((loc) => loc.trim())
                  .map((loc) => (
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
