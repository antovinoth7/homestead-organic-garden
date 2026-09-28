import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { DetailQuickInfoSection } from '@/components/DetailQuickInfoSection';
import { DetailCareGuidanceSection } from '@/components/DetailCareGuidanceSection';
import { useUserCareProfiles } from '@/hooks/useUserCareProfiles';

interface Props {
  plantType: string;
  plantVariety: string;
}

/**
 * Growing guide for the plant's species/variety: the growing profile
 * (days-to-harvest, spacing, germination, etc.) and care guidance
 * (description, pruning, common pests and diseases).
 *
 * Both sections layer the farmer's own catalog edits over the bundled
 * defaults. This used to pass `{}` for those edits, so a plant whose care
 * guidance had been corrected in the catalog still showed the bundled text
 * here. While the profiles load, `{}` is the correct value — the sections
 * fall back to the defaults on their own.
 */
export function PlantDetailGuideSection({
  plantType,
  plantVariety,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { careProfiles } = useUserCareProfiles();

  return (
    <View style={styles.content}>
      <DetailQuickInfoSection
        theme={theme}
        plantType={plantType}
        plantVariety={plantVariety}
        plantCareProfiles={careProfiles}
      />

      <DetailCareGuidanceSection
        theme={theme}
        plantType={plantType}
        plantVariety={plantVariety}
        plantCareProfiles={careProfiles}
      />
    </View>
  );
}
