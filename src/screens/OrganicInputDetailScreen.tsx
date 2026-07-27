import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { OrganicInputHero } from '@/components/organicInput/OrganicInputHero';
import { InputStatStrip } from '@/components/organicInput/InputStatStrip';
import {
  getOrganicInputById,
  getCategoryLabel,
  getRecipeById,
  formatIdealFor,
} from '@/config/organicInputs';
import { createStyles } from '@/styles/organicInputDetailStyles';
import type {
  OrganicInputDetailScreenNavigationProp,
  OrganicInputDetailScreenRouteProp,
} from '@/types/navigation.types';

const HERO_HEIGHT = 250;
const STICKY_THRESHOLD = HERO_HEIGHT - 80;

export default function OrganicInputDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<OrganicInputDetailScreenNavigationProp>();
  const route = useRoute<OrganicInputDetailScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const input = useMemo(() => getOrganicInputById(route.params.inputId), [route.params.inputId]);
  const recipe = useMemo(() => getRecipeById(input?.recipeId), [input?.recipeId]);

  const handleOpenRecipe = useCallback(() => {
    if (!recipe) return;
    navigation.navigate('InputRecipes', { initialTab: recipe.id });
  }, [navigation, recipe]);

  const stickyBgOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD, STICKY_THRESHOLD + 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const stickyTitleOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD + 10, STICKY_THRESHOLD + 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (!input) {
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

  // Ingredients are stored lowercase ("cattle dung", "straw"); sentence-case
  // the joined list so the card reads as prose.
  const madeFromList = input.ingredients?.join(', ');
  const madeFrom = madeFromList
    ? madeFromList.charAt(0).toUpperCase() + madeFromList.slice(1)
    : undefined;

  return (
    <View style={styles.container}>
      {/* Sticky animated header */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.tabBarBackground,
            opacity: stickyBgOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.stickyBackButton}
          onPress={navigation.goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={theme.textInverse} />
        </TouchableOpacity>
        <Animated.Text style={[styles.stickyHeaderEmoji, { opacity: stickyTitleOpacity }]}>
          {input.emoji}
        </Animated.Text>
        <Animated.Text
          style={[styles.stickyHeaderTitle, { opacity: stickyTitleOpacity }]}
          numberOfLines={1}
        >
          {input.name}
        </Animated.Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 },
        ]}
      >
        <OrganicInputHero
          name={input.name}
          tamilName={input.tamilName}
          categoryLabel={getCategoryLabel(input.category)}
          emoji={input.emoji}
          topInset={insets.top}
          onBack={navigation.goBack}
        />

        <InputStatStrip
          rate={input.applicationRate}
          timing={input.applicationTiming}
          idealForCount={input.plantsIdeal.length}
        />

        <View style={styles.panel}>
          <Text style={styles.lead}>{input.description}</Text>

          {madeFrom || input.storageTips ? (
            <View style={styles.pairRow}>
              {madeFrom ? (
                <View style={styles.pairCard}>
                  <Text style={styles.microLabel}>MADE FROM</Text>
                  <Text style={styles.pairText}>{madeFrom}</Text>
                </View>
              ) : null}
              {input.storageTips ? (
                <View style={styles.pairCard}>
                  <Text style={styles.microLabel}>STORAGE</Text>
                  <Text style={styles.pairText}>{input.storageTips}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {input.benefits && input.benefits.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>What it does</Text>
              <View style={styles.listCard}>
                {input.benefits.map((benefit, index) => (
                  <View
                    key={benefit}
                    style={[styles.listRow, index === 0 && styles.listRowFirst]}
                  >
                    <Ionicons name="checkmark" size={14} color={theme.primary} />
                    <Text style={styles.listText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {input.precautions && input.precautions.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Watch out for</Text>
              <View style={styles.warnCard}>
                {input.precautions.map((precaution, index) => (
                  <View
                    key={precaution}
                    style={[styles.warnRow, index === 0 && styles.listRowFirst]}
                  >
                    <Ionicons name="alert-circle-outline" size={14} color={theme.accent} />
                    <Text style={styles.listText}>{precaution}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {input.plantsIdeal.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Ideal for</Text>
              <View style={styles.chipRow}>
                {input.plantsIdeal.map((plant) => (
                  <View key={plant} style={styles.idealChip}>
                    <Text style={styles.idealChipText}>{formatIdealFor(plant)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {recipe ? (
            <TouchableOpacity
              style={styles.recipeCta}
              onPress={handleOpenRecipe}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <View style={styles.recipeCtaIcon}>
                <Ionicons name="flask" size={21} color={theme.textInverse} />
              </View>
              <View style={styles.recipeCtaBody}>
                <Text style={styles.recipeCtaTitle}>Make your own</Text>
                <Text style={styles.recipeCtaSubtitle} numberOfLines={2}>
                  Ingredients and steps, scaled to your farm size
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textInverse} />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
