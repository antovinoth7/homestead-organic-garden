import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { DetailQuickInfoSection } from '@/components/DetailQuickInfoSection';
import { DetailCareGuidanceSection } from '@/components/DetailCareGuidanceSection';
import { CompanionPlantingSection } from '@/components/CompanionPlantingSection';

interface Props {
  plantType: string;
  plantVariety: string;
  companions: string[];
  incompatible: string[];
}

/** Species-reference guidance derived from the plant's type and variety. */
export function PlantDetailInfoSection({
  plantType,
  plantVariety,
  companions,
  incompatible,
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

      <CompanionPlantingSection
        styles={styles}
        companions={companions}
        incompatible={incompatible}
      />
    </View>
  );
}
