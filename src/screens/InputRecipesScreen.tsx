import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/inputRecipesStyles';
import { ORGANIC_RECIPES } from '@/config/organicInputs';
import type { RecipeId, OrganicInputRecipe } from '@/config/organicInputs';
import { scaleRecipe, formatQuantity } from '@/utils/recipeQuantityEngine';
import { useFarmCapacity } from '@/hooks/useFarmCapacity';
import type { MoreStackParamList } from '@/types/navigation.types';

type InputRecipesRouteProp = RouteProp<MoreStackParamList, 'InputRecipes'>;

const SEASON_LABELS: Record<string, string> = {
  summer: 'Summer',
  sw_monsoon: 'SW Monsoon',
  ne_monsoon: 'NE Monsoon',
  cool_dry: 'Cool Dry',
};

function RecipePanel({
  recipe,
  landCents,
  bottomInset,
  styles,
}: {
  recipe: OrganicInputRecipe;
  landCents: number;
  bottomInset: number;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const scaled = useMemo(() => scaleRecipe(recipe, landCents), [recipe, landCents]);

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.recipeTamilName}>{recipe.tamilName}</Text>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
      </View>

      {/* Scaling banner */}
      <View style={styles.scalingBanner}>
        <Ionicons
          name="resize-outline"
          size={16}
          color={(styles.scalingText as TextStyle).color as string}
        />
        <Text style={styles.scalingText}>
          Quantities scaled for your farm: {landCents} cent{landCents !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {scaled.map((ing) => (
          <View key={ing.name}>
            <View style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>{ing.name}</Text>
              <Text style={styles.ingredientQty}>{formatQuantity(ing.quantity, ing.unit)}</Text>
            </View>
            {ing.notes ? <Text style={styles.ingredientNote}>{ing.notes}</Text> : null}
          </View>
        ))}
      </View>

      {/* Preparation steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preparation</Text>
        {recipe.preparationSteps.map((step, idx) => (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{idx + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* When to apply */}
      <View style={styles.section}>
        <View style={styles.applyCard}>
          <Text style={styles.applyLabel}>WHEN TO APPLY</Text>
          <Text style={styles.applyText}>{recipe.whenToApply}</Text>
        </View>

        {recipe.frequencyDays > 0 ? (
          <View style={styles.frequencyBadge}>
            <Ionicons
              name="repeat-outline"
              size={14}
              color={(styles.frequencyValue as TextStyle).color as string}
            />
            <Text style={styles.frequencyText}>Apply every</Text>
            <Text style={styles.frequencyValue}>{recipe.frequencyDays} days</Text>
          </View>
        ) : null}

        <View style={styles.seasonRow}>
          {recipe.seasonMapping.map((s) => (
            <View key={s} style={styles.seasonBadge}>
              <Text style={styles.seasonBadgeText}>{SEASON_LABELS[s] ?? s}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

export default function InputRecipesScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<InputRecipesRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { config, loading } = useFarmCapacity();

  const initialTab = route.params?.initialTab ?? 'jeevamrutha';
  const [activeTab, setActiveTab] = useState<RecipeId>(initialTab as RecipeId);

  const handleTabPress = useCallback((id: RecipeId) => {
    setActiveTab(id);
  }, []);

  const landCents = config?.land_cents ?? 5;
  const activeRecipe = ORGANIC_RECIPES.find((r) => r.id === activeTab) ?? ORGANIC_RECIPES[0]!;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Input Recipes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {ORGANIC_RECIPES.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            style={[styles.tab, activeTab === recipe.id && styles.tabActive]}
            onPress={() => handleTabPress(recipe.id)}
          >
            <Text style={[styles.tabText, activeTab === recipe.id && styles.tabTextActive]}>
              {recipe.name.length > 8 ? recipe.name.slice(0, 7) + '…' : recipe.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active recipe panel */}
      <RecipePanel
        recipe={activeRecipe}
        landCents={landCents}
        bottomInset={insets.bottom}
        styles={styles}
      />
    </View>
  );
}
