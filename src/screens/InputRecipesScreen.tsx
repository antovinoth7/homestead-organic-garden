import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { RecipeScaler } from '@/components/organicInput/RecipeScaler';
import { createStyles } from '@/styles/inputRecipesStyles';
import { ORGANIC_RECIPES } from '@/config/organicInputs';
import type { RecipeId, OrganicInputRecipe } from '@/config/organicInputs';
import { scaleRecipe, formatQuantity } from '@/utils/recipeQuantityEngine';
import { useLandCents } from '@/hooks/useLandCents';
import type { MoreStackParamList } from '@/types/navigation.types';

type InputRecipesRouteProp = RouteProp<MoreStackParamList, 'InputRecipes'>;

const SEASON_LABELS: Record<string, string> = {
  summer: 'Summer',
  sw_monsoon: 'SW Monsoon',
  ne_monsoon: 'NE Monsoon',
  cool_dry: 'Cool Dry',
};

/** Bounds for the manual land-size override. */
const MIN_CENTS = 1;
const MAX_CENTS = 100;
const CENTS_STEP = 5;

function RecipeTab({
  recipe,
  isActive,
  onPress,
  styles,
}: {
  recipe: OrganicInputRecipe;
  isActive: boolean;
  onPress: (id: RecipeId) => void;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const handlePress = useCallback(() => onPress(recipe.id), [onPress, recipe.id]);

  return (
    <TouchableOpacity
      style={[styles.tab, isActive && styles.tabActive]}
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{recipe.name}</Text>
    </TouchableOpacity>
  );
}

function RecipePanel({
  recipe,
  landCents,
  bottomInset,
  onIncrement,
  onDecrement,
  styles,
}: {
  recipe: OrganicInputRecipe;
  landCents: number;
  bottomInset: number;
  onIncrement: () => void;
  onDecrement: () => void;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const scaled = useMemo(() => scaleRecipe(recipe, landCents), [recipe, landCents]);

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.recipeTamilName}>{recipe.tamilName}</Text>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
      </View>

      <RecipeScaler
        cents={landCents}
        canDecrement={landCents > MIN_CENTS}
        canIncrement={landCents < MAX_CENTS}
        onDecrement={onDecrement}
        onIncrement={onIncrement}
      />

      <Text style={styles.sectionLabel}>Ingredients</Text>
      <View style={styles.ingredientCard}>
        {scaled.map((ing, index) => (
          <View
            key={ing.name}
            style={[styles.ingredientRow, index === 0 && styles.ingredientRowFirst]}
          >
            <View style={styles.ingredientBody}>
              <Text style={styles.ingredientName}>{ing.name}</Text>
              {ing.notes ? <Text style={styles.ingredientNote}>{ing.notes}</Text> : null}
            </View>
            <Text style={styles.ingredientQty}>{formatQuantity(ing.quantity, ing.unit)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Preparation</Text>
      <View style={styles.stepList}>
        {recipe.preparationSteps.map((step, idx) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{idx + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>When to apply</Text>
      <View style={styles.applyCard}>
        <Text style={styles.applyText}>{recipe.whenToApply}</Text>
        <View style={styles.badgeRow}>
          {recipe.frequencyDays > 0 ? (
            <View style={styles.frequencyBadge}>
              <Text style={styles.frequencyBadgeText}>Every {recipe.frequencyDays} days</Text>
            </View>
          ) : (
            <View style={styles.frequencyBadge}>
              <Text style={styles.frequencyBadgeText}>Per sowing</Text>
            </View>
          )}
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
  const { landCents: farmCents, loading } = useLandCents();

  const initialTab = route.params?.initialTab ?? 'jeevamrutha';
  const [activeTab, setActiveTab] = useState<RecipeId>(initialTab as RecipeId);

  // Seeded from the farm's recorded size, then overridable for this session so
  // a grower can price out a different patch without editing their profile.
  const [cents, setCents] = useState(farmCents);
  useEffect(() => {
    setCents(farmCents);
  }, [farmCents]);

  const handleTabPress = useCallback((id: RecipeId) => {
    setActiveTab(id);
  }, []);

  const handleIncrement = useCallback(() => {
    setCents((c) => Math.min(MAX_CENTS, c + CENTS_STEP));
  }, []);

  const handleDecrement = useCallback(() => {
    setCents((c) => Math.max(MIN_CENTS, c - CENTS_STEP));
  }, []);

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
      <View style={[styles.headerBlock, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={navigation.goBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={theme.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Make your own</Text>
            <Text style={styles.headerSubtitle}>
              {ORGANIC_RECIPES.length} recipes · scaled to your farm
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        keyboardShouldPersistTaps="handled"
      >
        {ORGANIC_RECIPES.map((recipe) => (
          <RecipeTab
            key={recipe.id}
            recipe={recipe}
            isActive={recipe.id === activeTab}
            onPress={handleTabPress}
            styles={styles}
          />
        ))}
      </ScrollView>

      <RecipePanel
        recipe={activeRecipe}
        landCents={cents}
        bottomInset={TAB_BAR_HEIGHT + Math.max(insets.bottom, 8)}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        styles={styles}
      />
    </View>
  );
}
