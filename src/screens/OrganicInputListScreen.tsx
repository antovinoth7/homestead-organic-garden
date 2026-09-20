import React, { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  OrganicInputListView,
  type OrganicInputGroup,
} from '@/components/organicInput/OrganicInputListView';
import {
  getGroupedOrganicInputs,
  CATEGORY_DESCRIPTIONS,
  ORGANIC_RECIPES,
} from '@/config/organicInputs';
import { useLandCents } from '@/hooks/useLandCents';
import type { OrganicInputListScreenNavigationProp } from '@/types/navigation.types';

export default function OrganicInputListScreen(): React.JSX.Element {
  const navigation = useNavigation<OrganicInputListScreenNavigationProp>();
  const { landCents } = useLandCents();

  const groups: OrganicInputGroup[] = useMemo(
    () =>
      getGroupedOrganicInputs().map((group) => ({
        category: group.category,
        label: group.label,
        entries: group.inputs,
      })),
    []
  );

  const handleSelect = useCallback(
    (inputId: string) => {
      navigation.navigate('OrganicInputDetail', { inputId });
    },
    [navigation]
  );

  const handleOpenRecipes = useCallback(() => {
    navigation.navigate('InputRecipes', {});
  }, [navigation]);

  return (
    <OrganicInputListView
      groups={groups}
      categoryDescriptions={CATEGORY_DESCRIPTIONS}
      recipeCount={ORGANIC_RECIPES.length}
      landCents={landCents}
      onSelect={handleSelect}
      onOpenRecipes={handleOpenRecipes}
      onBack={navigation.goBack}
    />
  );
}
