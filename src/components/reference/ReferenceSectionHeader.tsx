import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/referenceBrowseStyles';

interface Props {
  /** A category ("Sap-Sucking"), a risk level ("High risk now") or a letter. */
  title: string;
  /** How many entries sit under it. */
  count: number;
}

/**
 * Section divider in the browse list.
 *
 * Unlike `CatalogSectionHeader` this carries no fixed-height contract: the
 * reference cards clamp their description to two lines at a height that varies
 * with the font scale, so neither list can use `getItemLayout` anyway. Over a
 * corpus of 36 entries that costs nothing and lets the title wrap.
 */
function ReferenceSectionHeaderComponent({ title, count }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

export const ReferenceSectionHeader = React.memo(ReferenceSectionHeaderComponent);
