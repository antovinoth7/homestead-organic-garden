import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/referenceBrowseStyles';
import { HeaderIconButton } from '@/components/header/HeaderIconButton';
import { HeaderSearchField } from '@/components/header/HeaderSearchField';

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
 * The buttons and the field are the shared `HeaderIconButton` and
 * `HeaderSearchField`, so this bar matches every other browse header.
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
        <HeaderSearchField
          value={query}
          onChangeText={onQueryChange}
          onClear={onClearQuery}
          onClose={onCloseSearch}
          placeholder={searchPlaceholder}
          accessibilityLabel={searchAccessibilityLabel}
        />
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
            <HeaderIconButton
              icon="search"
              onPress={onOpenSearch}
              accessibilityLabel={searchAccessibilityLabel}
              showDot={query.trim() !== ''}
            />
            <HeaderIconButton
              icon="funnel"
              onPress={onToggleFilters}
              accessibilityLabel={`Filter ${title.toLowerCase()}`}
              active={showFilters}
              badgeCount={activeFilterCount}
            />
          </View>
        </>
      )}
    </View>
  );
}

export const ReferenceBrowseHeader = React.memo(ReferenceBrowseHeaderComponent);
