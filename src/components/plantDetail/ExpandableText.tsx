import React, { useCallback, useMemo, useState } from 'react';
import type { NativeSyntheticEvent, TextLayoutEventData, StyleProp, TextStyle } from 'react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/expandableBlockStyles';

interface Props {
  children: string;
  /** Lines shown while clamped. */
  numberOfLines?: number;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Paragraph clamped to a few lines with a "Read more"/"Read less" toggle.
 * The toggle only appears when the text actually overflows the clamp; a
 * hidden one-shot copy measures the unclamped line count so the visible
 * text never flashes fully expanded.
 */
export function ExpandableText({
  children,
  numberOfLines = 3,
  textStyle,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [measured, setMeasured] = useState(false);

  const onMeasureLayout = useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      setOverflows(event.nativeEvent.lines.length > numberOfLines);
      setMeasured(true);
    },
    [numberOfLines]
  );

  return (
    <View>
      <Text style={textStyle} numberOfLines={expanded ? undefined : numberOfLines}>
        {children}
      </Text>
      {!measured && (
        <Text
          style={[textStyle, styles.measureHidden]}
          onTextLayout={onMeasureLayout}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {children}
        </Text>
      )}
      {overflows && (
        <TouchableOpacity
          onPress={() => setExpanded((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Read less' : 'Read more'}
        >
          <Text style={styles.readMore}>{expanded ? 'Read less' : 'Read more'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
