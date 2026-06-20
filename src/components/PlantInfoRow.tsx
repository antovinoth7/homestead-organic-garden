import React from 'react';
import { View, Text } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { createStyles } from '@/styles/plantDetailStyles';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  text: React.ReactNode;
  textStyle?: StyleProp<TextStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Shared icon + label row used throughout the plant detail screen.
 * Replaces the hand-written `infoRow` pattern repeated across sections.
 */
export function PlantInfoRow({
  styles,
  icon,
  iconColor,
  text,
  textStyle,
  rowStyle,
  children,
}: Props): React.JSX.Element {
  return (
    <View style={rowStyle ? [styles.infoRow, rowStyle] : styles.infoRow}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={textStyle ? [styles.infoText, textStyle] : styles.infoText}>{text}</Text>
      {children}
    </View>
  );
}
