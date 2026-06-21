/**
 * SeasonalAlmanacScreen (Phase C, C.4 / G15).
 *
 * Full 12-month Kanyakumari farmer's almanac, reachable from the dashboard
 * AlmanacHighlight "View full almanac" link. Pure config from `config/almanac`.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/seasonalAlmanacStyles';
import { ALMANAC } from '@/config/almanac';

export default function SeasonalAlmanacScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const currentMonth = new Date().getMonth() + 1;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Seasonal Almanac</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {ALMANAC.map((month) => (
          <View
            key={month.month}
            style={[styles.monthCard, month.month === currentMonth && styles.monthCardCurrent]}
          >
            <Text style={styles.monthIcon}>{month.icon}</Text>
            <View style={styles.monthBody}>
              <Text style={styles.monthLabel}>{month.label}</Text>
              <Text style={styles.monthHighlight}>{month.highlight}</Text>
              <Text style={styles.monthNote}>{month.note}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
