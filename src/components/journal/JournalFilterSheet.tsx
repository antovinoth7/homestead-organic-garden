import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalSheetStyles';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import { JournalEntryType } from '@/types/database.types';
import { JOURNAL_TYPE_OPTIONS } from '@/utils/journalEntryOptions';
import { locationKey } from '@/utils/locationHelpers';
import {
  JOURNAL_PERIOD_LABELS,
  JOURNAL_PERIODS,
  type JournalFilters,
} from '@/utils/journalListHelpers';

export interface JournalFilterCount {
  value: string;
  count: number;
}

interface Props {
  visible: boolean;
  filters: JournalFilters;
  onChange: (patch: Partial<JournalFilters>) => void;
  onClearAll: () => void;
  onClose: () => void;
  /** Funnel badge count — shows "Clear all" when above zero. */
  activeCount: number;
  /** Entries per type with the type filter left out; `value: ''` is the total. */
  typeCounts: readonly JournalFilterCount[];
  /** Open problems over all time. */
  openCount: number;
  /** Plots with entries, each counted with the plot filter left out. */
  plotCounts: readonly JournalFilterCount[];
  /** Tags in use, each counted with the tag filter left out. */
  tagCounts: readonly JournalFilterCount[];
  /** Name of the filtered bed or plant, null when none. */
  placeLabel: string | null;
  /** Plot of the filtered bed or plant, so picking another plot can drop it. */
  placePlot: string | null;
  onOpenPlacePicker: () => void;
  resultCount: number;
}

interface ChipProps {
  value: string;
  label: string;
  count?: number;
  active: boolean;
  onSelect: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
}

const FilterChip = React.memo(function FilterChip({
  value,
  label,
  count,
  active,
  onSelect,
  styles,
}: ChipProps): React.JSX.Element {
  const handlePress = useCallback(() => onSelect(value), [onSelect, value]);
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
      {count !== undefined && <Text style={styles.chipCount}>{count}</Text>}
    </TouchableOpacity>
  );
});

const countOf = (counts: readonly JournalFilterCount[], value: string): number =>
  counts.find((c) => c.value === value)?.count ?? 0;

/**
 * Filter journal: period, type (with the open-problems status under
 * Pest/Disease), plot chips, a searchable bed-or-plant row, and tags. Each
 * chip counts what picking it would show.
 */
export function JournalFilterSheet({
  visible,
  filters,
  onChange,
  onClearAll,
  onClose,
  activeCount,
  typeCounts,
  openCount,
  plotCounts,
  tagCounts,
  placeLabel,
  placePlot,
  onOpenPlacePicker,
  resultCount,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const selectPeriod = useCallback(
    (value: string) => onChange({ period: JOURNAL_PERIODS.find((p) => p === value) ?? 'all' }),
    [onChange]
  );
  const selectType = useCallback(
    (value: string) => {
      const type = JOURNAL_TYPE_OPTIONS.find((o) => o.value === value)?.value ?? null;
      // "Open only" belongs to Pest/Disease; any other type drops it.
      onChange({
        type,
        openOnly: type === JournalEntryType.PestDisease ? filters.openOnly : false,
      });
    },
    [onChange, filters.openOnly]
  );
  const selectStatus = useCallback(
    (value: string) => onChange({ openOnly: value === 'open' }),
    [onChange]
  );
  const selectPlot = useCallback(
    (value: string) => {
      if (!value) {
        onChange({ plot: null, location: null });
        return;
      }
      // A bed or plant on another plot would filter to nothing — drop it.
      const keepPlace = !placePlot || locationKey(placePlot) === locationKey(value);
      onChange({ plot: value, location: keepPlace ? filters.location : null });
    },
    [onChange, placePlot, filters.location]
  );
  const selectTag = useCallback((value: string) => onChange({ tag: value || null }), [onChange]);

  const placeHint = placeLabel
    ? 'Tap to change'
    : filters.plot
      ? `Search beds and plants in ${filters.plot}`
      : 'Search all beds and plants';

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={[
        styles.sheet,
        { maxHeight: windowHeight * 0.88, paddingBottom: Math.max(insets.bottom, 16) + 12 },
      ]}
    >
      <SheetHandle onClose={onClose} />
      <View style={styles.filterHeader}>
        <Text style={styles.title}>Filter journal</Text>
        {activeCount > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={onClearAll}
            accessibilityRole="button"
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.filterScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        bounces={false}
      >
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Period</Text>
          <View style={styles.chipWrap}>
            {JOURNAL_PERIODS.map((period) => (
              <FilterChip
                key={period}
                value={period}
                label={JOURNAL_PERIOD_LABELS[period]}
                active={filters.period === period}
                onSelect={selectPeriod}
                styles={styles}
              />
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.chipWrap}>
            <FilterChip
              value=""
              label="All"
              count={countOf(typeCounts, '')}
              active={!filters.type}
              onSelect={selectType}
              styles={styles}
            />
            {JOURNAL_TYPE_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                value={option.value}
                label={option.label}
                count={countOf(typeCounts, option.value)}
                active={filters.type === option.value}
                onSelect={selectType}
                styles={styles}
              />
            ))}
          </View>
        </View>

        {filters.type === JournalEntryType.PestDisease && (
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.chipWrap}>
              <FilterChip
                value="all"
                label="All problems"
                active={!filters.openOnly}
                onSelect={selectStatus}
                styles={styles}
              />
              <FilterChip
                value="open"
                label="Open only"
                count={openCount}
                active={filters.openOnly}
                onSelect={selectStatus}
                styles={styles}
              />
            </View>
          </View>
        )}

        {plotCounts.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.chipWrap}>
              <FilterChip
                value=""
                label="Anywhere"
                active={!filters.plot}
                onSelect={selectPlot}
                styles={styles}
              />
              {plotCounts.map((plot) => (
                <FilterChip
                  key={plot.value}
                  value={plot.value}
                  label={plot.value}
                  count={plot.count}
                  active={!!filters.plot && locationKey(filters.plot) === locationKey(plot.value)}
                  onSelect={selectPlot}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Bed or plant</Text>
          <TouchableOpacity
            style={[styles.placeRow, !!placeLabel && styles.placeRowActive]}
            onPress={onOpenPlacePicker}
            accessibilityRole="button"
          >
            <View style={styles.placeRowBody}>
              <Text
                style={[styles.placeRowLabel, !!placeLabel && styles.placeRowLabelActive]}
                numberOfLines={1}
              >
                {placeLabel ?? 'Any bed or plant'}
              </Text>
              <Text style={styles.placeRowHint} numberOfLines={1}>
                {placeHint}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {tagCounts.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Tag</Text>
            <View style={styles.chipWrap}>
              <FilterChip
                value=""
                label="Any tag"
                active={!filters.tag}
                onSelect={selectTag}
                styles={styles}
              />
              {tagCounts.map((tag) => (
                <FilterChip
                  key={tag.value}
                  value={tag.value}
                  label={tag.value.replace(/_/g, ' ')}
                  count={tag.count}
                  active={filters.tag === tag.value}
                  onSelect={selectTag}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.showButton} onPress={onClose} accessibilityRole="button">
        <Text style={styles.showButtonText}>
          Show {resultCount} {resultCount === 1 ? 'entry' : 'entries'}
        </Text>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}
