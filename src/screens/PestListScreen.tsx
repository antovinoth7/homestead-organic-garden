import React, { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ReferenceListView } from '@/components/reference/ReferenceListView';
import type { ReferenceEntry, ReferenceGroup } from '@/components/reference/types';
import { getGroupedPestEntries, CATEGORY_DESCRIPTIONS } from '@/config/pests';
import { getPestImage } from '@/config/referenceAssets';
import type { PestListScreenNavigationProp } from '@/types/navigation.types';

export default function PestListScreen(): React.JSX.Element {
  const navigation = useNavigation<PestListScreenNavigationProp>();

  const groups: ReferenceGroup[] = useMemo(
    () =>
      getGroupedPestEntries().map((group) => ({
        category: group.category,
        label: group.label,
        entries: group.pests,
      })),
    []
  );

  const handleSelect = useCallback(
    (pestId: string) => {
      navigation.navigate('PestDetail', { pestId });
    },
    [navigation]
  );

  const getImage = useCallback(
    (entry: ReferenceEntry) => getPestImage(entry.id, entry.imageAsset),
    []
  );

  return (
    <ReferenceListView
      title="Pests"
      searchPlaceholder="What are you seeing?"
      itemNoun="pest"
      groups={groups}
      categoryDescriptions={CATEGORY_DESCRIPTIONS}
      getImage={getImage}
      onSelect={handleSelect}
      onBack={navigation.goBack}
    />
  );
}
