import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';

interface Props {
  /** The group's letter, or `#` for names that do not start with one. */
  letter: string;
  /** How many plants sit under it. */
  count: number;
}

/**
 * A–Z divider in the browse list. Its height is fixed
 * (`CATALOG_SECTION_HEADER_HEIGHT`) because the screen builds a cumulative
 * offset table for `getItemLayout` across headers and rows.
 */
function CatalogSectionHeaderComponent({ letter, count }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.catalogSectionHeader}>
      <Text style={styles.catalogSectionLetter}>{letter}</Text>
      <Text style={styles.catalogSectionCount}>{count}</Text>
    </View>
  );
}

export const CatalogSectionHeader = React.memo(CatalogSectionHeaderComponent);
