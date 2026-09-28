import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/referenceBrowseStyles';

interface Props {
  /** Screen title — "Pests", "Diseases", "Organic inputs". */
  title: string;
  /** Zone line beneath it, e.g. "36 in the High Rainfall Zone". */
  subtitle: string;
  searchPlaceholder: string;
  /** Spoken label for the field, e.g. "Search pests". */
  searchAccessibilityLabel: string;
  query: string;
  searchActive: boolean;
  showFilters: boolean;
  /** Facets off default; 0 hides the badge. */
  activeFilterCount: number;
  onQueryChange: (next: string) => void;
  onClearQuery: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onToggleFilters: () => void;
  onBack: () => void;
}

/**
 * The browse header shared by the pest, disease and organic-input screens,
 * ported from `ManagePlantCatalogScreen` so all four read the same.
 *
 * Search used to be a field pinned under the title and the categories a pill
 * rail under that, which spent two permanent rows on controls that are touched
 * once a visit. Both collapse into this bar: the magnifier expands in place,
 * the funnel opens the sheet.
 *
 * Search and the filter sheet take over the header in turn, so the caller keeps
 * them mutually exclusive. The query itself survives collapsing the bar — that
 * is what the dot on the magnifier is for, since a filtered list with no
 * visible cause is the thing this layout risks.
 *
 * The field is inlined rather than reusing `CatalogSearchBar`, which is bound to
 * `managePlantCatalogStyles`.
 */
function ReferenceBrowseHeaderComponent({
  title,
  subtitle,
  searchPlaceholder,
  searchAccessibilityLabel,
  query,
  searchActive,
  showFilters,
  activeFilterCount,
  onQueryChange,
  onClearQuery,
  onOpenSearch,
  onCloseSearch,
  onToggleFilters,
  onBack,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      {searchActive ? (
        <View style={styles.searchExpandedRow}>
          <TouchableOpacity
            onPress={onCloseSearch}
            style={styles.searchBackBtn}
            accessibilityRole="button"
            accessibilityLabel="Close search"
          >
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={theme.textSecondary} />
            <TextInput
              autoFocus
              style={styles.searchInput}
              value={query}
              onChangeText={onQueryChange}
              placeholder={searchPlaceholder}
              placeholderTextColor={theme.inputPlaceholder}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel={searchAccessibilityLabel}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={onClearQuery}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={onOpenSearch}
              accessibilityRole="button"
              accessibilityLabel={searchAccessibilityLabel}
            >
              <Ionicons name="search" size={20} color={theme.textInverse} />
              {query.trim() !== '' && <View style={styles.headerActiveDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconBtn, showFilters && styles.headerIconBtnActive]}
              onPress={onToggleFilters}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${title.toLowerCase()}`}
            >
              <Ionicons
                name="funnel"
                size={20}
                color={showFilters ? theme.primary : theme.textInverse}
              />
              {activeFilterCount > 0 && !showFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export const ReferenceBrowseHeader = React.memo(ReferenceBrowseHeaderComponent);
