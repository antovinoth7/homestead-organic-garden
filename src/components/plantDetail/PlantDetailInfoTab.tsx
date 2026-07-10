import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { DetailQuickInfoSection } from '@/components/DetailQuickInfoSection';
import { DetailCareGuidanceSection } from '@/components/DetailCareGuidanceSection';
import { CompanionPlantingSection } from '@/components/CompanionPlantingSection';

interface Props {
  header: React.ReactNode;
  plantType: string;
  plantVariety: string;
  companions: string[];
  incompatible: string[];
}

/** Species-reference guidance derived from the plant's type and variety. */
export function PlantDetailInfoTab({
  header,
  plantType,
  plantVariety,
  companions,
  incompatible,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}
    >
      {header}
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
    </ScrollView>
  );
}
