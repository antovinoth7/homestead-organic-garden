import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { Skeleton, SkeletonBlock } from '@/components/skeleton';

interface Props {
  /** How many placeholder rows to draw — roughly one screenful. */
  count?: number;
}

/**
 * Placeholder rows shown while the catalog loads.
 *
 * Replaces a full-screen spinner, which blanked the list on every cold start
 * and told the user nothing about what was coming. These occupy the real row
 * metrics, so the list does not jump when the data lands. The pulse comes from
 * the shared `Skeleton`, so it matches every other loading screen.
 */
function CatalogSkeletonRowsComponent({ count = 8 }: Readonly<Props>): React.JSX.Element {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, fontScale), [theme, fontScale]);

  const rows = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <Skeleton style={styles.listContent} label="Loading catalog">
      <SkeletonBlock style={styles.skeletonHeader} />
      {rows.map((index) => (
        <View
          key={index}
          style={[
            styles.listCard,
            index === 0 && styles.listCardFirst,
            index === rows.length - 1 && styles.listCardLast,
          ]}
        >
          <View style={styles.plantRowCompact}>
            <SkeletonBlock style={styles.skeletonThumb} />
            <View style={styles.plantInfo}>
              <SkeletonBlock style={styles.skeletonLineWide} />
              <SkeletonBlock style={styles.skeletonLineNarrow} />
            </View>
          </View>
          {index !== rows.length - 1 && <View style={styles.rowDivider} />}
        </View>
      ))}
    </Skeleton>
  );
}

export const CatalogSkeletonRows = React.memo(CatalogSkeletonRowsComponent);
