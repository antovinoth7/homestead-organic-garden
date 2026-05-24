import React, { useMemo, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { getOrganicInputById, getCategoryLabel } from '@/config/organicInputs';
import { createStyles } from '@/styles/referenceDetailStyles';
import type {
  OrganicInputDetailScreenNavigationProp,
  OrganicInputDetailScreenRouteProp,
} from '@/types/navigation.types';

export default function OrganicInputDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<OrganicInputDetailScreenNavigationProp>();
  const route = useRoute<OrganicInputDetailScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const input = useMemo(() => getOrganicInputById(route.params.inputId), [route.params.inputId]);

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

  const heroHeight = 160;
  const stickyThreshold = heroHeight - 60;

  const stickyBgOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold, stickyThreshold + 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const stickyTitleOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold + 10, stickyThreshold + 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

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
        >
          <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
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
        {/* Hero */}
        <View style={styles.heroContainer}>
          <View style={styles.emojiFallback}>
            <Text style={styles.emojiFallbackText}>{input.emoji}</Text>
          </View>
          <TouchableOpacity
            style={[styles.backButtonFloat, { top: insets.top + 10 }]}
            onPress={navigation.goBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Info block */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle} numberOfLines={2}>
            {input.name}
          </Text>
          <Text style={styles.infoSubtitle}>
            {getCategoryLabel(input.category)}
            {input.tamilName ? ` · ${input.tamilName}` : ''}
          </Text>
          <View style={styles.metaStrip}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                {input.emoji} {getCategoryLabel(input.category)}
              </Text>
            </View>
            {input.plantsIdeal.length > 0 && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>🌱 {input.plantsIdeal.length} plants</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.firstSection}>
          <Text style={styles.sectionTitle}>📝 Overview</Text>
          <View style={styles.seasonCard}>
            <Text style={styles.bodyText}>{input.description}</Text>
          </View>
        </View>

        {/* Application Rate */}
        {input.applicationRate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Application Rate</Text>
            <View style={styles.seasonCard}>
              <Text style={styles.bodyText}>{input.applicationRate}</Text>
            </View>
          </View>
        )}

        {/* Application Timing */}
        {input.applicationTiming && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏱️ Application Timing</Text>
            <View style={styles.seasonCard}>
              <Text style={styles.bodyText}>{input.applicationTiming}</Text>
            </View>
          </View>
        )}

        {/* Ingredients */}
        {input.ingredients && input.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Ingredients</Text>
            <View style={styles.seasonCard}>
              {input.ingredients.map((item, i) => (
                <Text key={i} style={styles.bulletItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Benefits */}
        {input.benefits && input.benefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Benefits</Text>
            <View style={styles.seasonCard}>
              {input.benefits.map((item, i) => (
                <Text key={i} style={styles.bulletItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Precautions */}
        {input.precautions && input.precautions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Precautions</Text>
            <View style={styles.seasonCard}>
              {input.precautions.map((item, i) => (
                <Text key={i} style={styles.bulletItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Storage Tips */}
        {input.storageTips && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Storage</Text>
            <View style={styles.seasonCard}>
              <Text style={styles.bodyText}>{input.storageTips}</Text>
            </View>
          </View>
        )}

        {/* Ideal Plants */}
        {input.plantsIdeal.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌱 Ideal For</Text>
            <View style={styles.seasonCard}>
              <View style={styles.plantTagsContainer}>
                {input.plantsIdeal.map((plant) => (
                  <View key={plant} style={styles.plantTag}>
                    <Text style={styles.plantTagText}>{plant}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}
