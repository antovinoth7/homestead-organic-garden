import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/segmentedTabsStyles';

export interface SegmentedTab<K extends string> {
  key: K;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

interface Props<K extends string> {
  tabs: readonly SegmentedTab<K>[];
  activeKey: K;
  onChange: (key: K) => void;
}

/**
 * Generic horizontally-scrollable segmented pill control. Decoupled from any
 * specific data source — callers supply the tab list and own the active state.
 */
export function SegmentedTabs<K extends string>({
  tabs,
  activeKey,
  onChange,
}: Props<K>): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onChange(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              {tab.icon && (
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isActive ? theme.primary : theme.textSecondary}
                />
              )}
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
