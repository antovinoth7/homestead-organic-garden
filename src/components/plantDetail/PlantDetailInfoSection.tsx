import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { createEnrichedSectionStyles } from '@/styles/enrichedSectionStyles';
import { DetailQuickInfoSection } from '@/components/DetailQuickInfoSection';
import { DetailCareGuidanceSection } from '@/components/DetailCareGuidanceSection';
import { CompanionPlantingSection } from '@/components/CompanionPlantingSection';

interface Props {
  plantType: string;
  plantVariety: string;
  companions: string[];
  incompatible: string[];
  /** Catalog-derived pet toxicity; the Info tab is its single in-app surface. */
  petToxic: boolean;
}

/** Species-reference guidance derived from the plant's type and variety. */
export function PlantDetailInfoSection({
  plantType,
  plantVariety,
  companions,
  incompatible,
  petToxic,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const enrichedStyles = useMemo(() => createEnrichedSectionStyles(theme), [theme]);

  return (
    <View style={styles.content}>
      {petToxic && (
        <View style={enrichedStyles.safetyBanner}>
          <View style={enrichedStyles.safetyIconWrap}>
            <Ionicons name="warning" size={20} color={theme.error} />
          </View>
          <View style={enrichedStyles.safetyContent}>
            <Text style={enrichedStyles.safetyTitle}>Toxic to Pets</Text>
            <Text style={enrichedStyles.safetyText}>
              {plantVariety || 'This plant'} can be harmful to cats and dogs if ingested. Keep out
              of reach of pets.
            </Text>
          </View>
        </View>
      )}

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
