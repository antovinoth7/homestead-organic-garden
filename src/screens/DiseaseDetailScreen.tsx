import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { ReferenceDetailView } from '@/components/reference/ReferenceDetailView';
import { getDiseaseById, getCategoryLabel } from '@/config/diseases';
import { getDiseaseImage } from '@/config/referenceAssets';
import { createStyles } from '@/styles/pestDiseaseDetailStyles';
import type {
  DiseaseDetailScreenNavigationProp,
  DiseaseDetailScreenRouteProp,
} from '@/types/navigation.types';

export default function DiseaseDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<DiseaseDetailScreenNavigationProp>();
  const route = useRoute<DiseaseDetailScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const disease = useMemo(
    () => getDiseaseById(route.params.diseaseId),
    [route.params.diseaseId]
  );
  const heroImage = useMemo(
    () => (disease ? getDiseaseImage(disease.id, disease.imageAsset) : undefined),
    [disease]
  );

  // The create-task form lives on the Care Plan tab, which already owns the
  // plant/bed data it needs — hop there with the spray type preselected rather
  // than duplicating that load here.
  const handleAddToTasks = useCallback(() => {
    navigation.navigate('Care Plan', { openCreateTask: true, prefillTaskType: 'spray' });
  }, [navigation]);

  if (!disease) {
    return (
      <View style={styles.container}>
        <View style={[styles.fallbackHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.fallbackBackButton} onPress={navigation.goBack}>
            <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
          </TouchableOpacity>
          <Text style={styles.fallbackTitle}>Not Found</Text>
        </View>
      </View>
    );
  }

  return (
    <ReferenceDetailView
      entry={disease}
      categoryLabel={getCategoryLabel(disease.category)}
      image={heroImage}
      onBack={navigation.goBack}
      onAddToTasks={handleAddToTasks}
    />
  );
}
