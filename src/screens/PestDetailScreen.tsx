import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { ReferenceDetailView } from '@/components/reference/ReferenceDetailView';
import { getPestById, getCategoryLabel } from '@/config/pests';
import { getPestImage } from '@/config/referenceAssets';
import { createStyles } from '@/styles/pestDiseaseDetailStyles';
import type {
  PestDetailScreenNavigationProp,
  PestDetailScreenRouteProp,
} from '@/types/navigation.types';

export default function PestDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<PestDetailScreenNavigationProp>();
  const route = useRoute<PestDetailScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const pest = useMemo(() => getPestById(route.params.pestId), [route.params.pestId]);
  const heroImage = useMemo(
    () => (pest ? getPestImage(pest.id, pest.imageAsset) : undefined),
    [pest]
  );

  // The create-task form lives on the Care Plan tab, which already owns the
  // plant/bed data it needs — hop there with the spray type preselected rather
  // than duplicating that load here.
  const handleAddToTasks = useCallback(() => {
    navigation.navigate('Care Plan', { openCreateTask: true, prefillTaskType: 'spray' });
  }, [navigation]);

  if (!pest) {
    return (
      <View style={styles.container}>
        <View style={[styles.fallbackHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.fallbackBackButton} onPress={navigation.goBack}>
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
          </TouchableOpacity>
          <Text style={styles.fallbackTitle}>Not Found</Text>
        </View>
      </View>
    );
  }

  return (
    <ReferenceDetailView
      entry={pest}
      categoryLabel={getCategoryLabel(pest.category)}
      image={heroImage}
      onBack={navigation.goBack}
      onAddToTasks={handleAddToTasks}
    />
  );
}
