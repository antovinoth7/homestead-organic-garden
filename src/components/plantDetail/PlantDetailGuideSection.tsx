import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { DetailQuickInfoSection } from '@/components/DetailQuickInfoSection';
import { DetailCareGuidanceSection } from '@/components/DetailCareGuidanceSection';

interface Props {
  plantType: string;
  plantVariety: string;
}

/**
 * Growing guide for the plant's species/variety: the growing profile
 * (days-to-harvest, spacing, germination, etc.) and care guidance
 * (description, pruning, common pests and diseases).
 */
export function PlantDetailGuideSection({
  plantType,
  plantVariety,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.content}>
      <DetailQuickInfoSection
        theme={theme}
        plantType={plantType}
        plantVariety={plantVariety}
        plantCareProfiles={{}}
      />

      <DetailCareGuidanceSection
        theme={theme}
        plantType={plantType}
        plantVariety={plantVariety}
        plantCareProfiles={{}}
      />
    </View>
  );
}
