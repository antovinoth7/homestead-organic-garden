import React, { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ReferenceListView } from '@/components/reference/ReferenceListView';
import type { ReferenceEntry, ReferenceGroup } from '@/components/reference/types';
import { getGroupedDiseaseEntries, CATEGORY_DESCRIPTIONS } from '@/config/diseases';
import { getDiseaseImage } from '@/config/referenceAssets';
import type { DiseaseListScreenNavigationProp } from '@/types/navigation.types';

export default function DiseaseListScreen(): React.JSX.Element {
  const navigation = useNavigation<DiseaseListScreenNavigationProp>();

  const groups: ReferenceGroup[] = useMemo(
    () =>
      getGroupedDiseaseEntries().map((group) => ({
        category: group.category,
        label: group.label,
        entries: group.diseases,
      })),
    []
  );

  const handleSelect = useCallback(
    (diseaseId: string) => {
      navigation.navigate('DiseaseDetail', { diseaseId });
    },
    [navigation]
  );

  const getImage = useCallback(
    (entry: ReferenceEntry) => getDiseaseImage(entry.id, entry.imageAsset),
    []
  );

  return (
    <ReferenceListView
      title="Diseases"
      searchPlaceholder="What are you seeing?"
      itemNoun="disease"
      groups={groups}
      categoryDescriptions={CATEGORY_DESCRIPTIONS}
      getImage={getImage}
      onSelect={handleSelect}
      onBack={navigation.goBack}
    />
  );
}
