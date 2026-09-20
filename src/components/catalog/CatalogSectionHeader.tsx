import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { MAX_CATALOG_FONT_SCALE } from '@/styles/catalogMetrics';

interface Props {
  /**
   * The section's name: a sub-group ("Gourds & Melons"), a season ("Annual — sow
   * each season") or, in A–Z mode, a letter or `#`.
   */
  title: string;
  /** How many plants sit under it. */
  count: number;
  /** The scale the list measured with — see `catalogSectionHeaderHeight()`. */
  fontScale?: number;
}

/**
 * Section divider in the browse list. Its height is fixed
 * (`CATALOG_SECTION_HEADER_HEIGHT`) because the screen builds a cumulative
 * offset table for `getItemLayout` across headers and rows — so the title is
 * capped to one line rather than wrapping and breaking the measurement.
 */
function CatalogSectionHeaderComponent({
  title,
  count,
  fontScale = 1,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, fontScale), [theme, fontScale]);

  return (
    <View style={styles.catalogSectionHeader}>
      <Text
        style={styles.catalogSectionLetter}
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_CATALOG_FONT_SCALE}
      >
        {title}
      </Text>
      <Text style={styles.catalogSectionCount}>{count}</Text>
    </View>
  );
}

export const CatalogSectionHeader = React.memo(CatalogSectionHeaderComponent);
