import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { themeMeta, themes } from '@/theme/themes';
import type { ThemePalette } from '@/theme/themeStyle';
import { createPreviewStyles, createStyles } from '@/styles/themePaletteCardStyles';

interface Props {
  palette: ThemePalette;
  mode: 'light' | 'dark';
  selected: boolean;
  onSelect: (palette: ThemePalette) => void;
}

/** One palette choice in Settings > Appearance: thumbnail, name, note, radio. */
export function ThemePaletteCard({ palette, mode, selected, onSelect }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const preview = themes[palette][mode];
  const previewStyles = useMemo(() => createPreviewStyles(preview), [preview]);
  const meta = themeMeta[palette];

  const handlePress = useCallback(() => onSelect(palette), [onSelect, palette]);

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardActive]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${meta.name} theme`}
      accessibilityHint={meta.note}
    >
      <View style={previewStyles.frame}>
        <View style={previewStyles.inner}>
          <View style={previewStyles.line} />
          <View style={previewStyles.lineShort} />
          <View style={previewStyles.swatches}>
            <View style={previewStyles.primary} />
            <View style={previewStyles.accent} />
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{meta.name}</Text>
        <Text style={styles.note}>{meta.note}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected && <Ionicons name="checkmark" size={14} color={theme.textInverse} />}
      </View>
    </TouchableOpacity>
  );
}
