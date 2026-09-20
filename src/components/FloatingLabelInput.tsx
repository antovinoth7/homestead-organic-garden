import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  NativeSyntheticEvent,
  TargetedEvent,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { createStyles } from '../styles/floatingLabelInputStyles';
import FieldHelp from './FieldHelp';
import FieldErrorText from './FieldErrorText';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  /** Whether the border turns green on focus (default true) */
  accentBorder?: boolean;
  helpText?: string;
  helpLabel?: string;
  /** Inline validation message shown below the field; also reddens the border. */
  errorText?: string;
}

export default function FloatingLabelInput({
  label,
  value,
  accentBorder = true,
  helpText,
  helpLabel,
  errorText,
  style,
  onFocus,
  onBlur,
  multiline,
  ...rest
}: FloatingLabelInputProps): React.JSX.Element {
  const theme = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [isFocused, setIsFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const hasHelp = !!helpText?.trim();

  const isFloated = isFocused || !!value;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isFloated ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFloated, anim]);

  const handleFocus = useCallback(
    (e: NativeSyntheticEvent<TargetedEvent>) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: NativeSyntheticEvent<TargetedEvent>) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const labelTop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [multiline ? 14 : 16, -9],
  });

  const labelBackground = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['transparent', 'transparent', theme.backgroundSecondary],
  });

  const labelFontSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const hasError = !!errorText;

  // An error outranks focus/accent so the field stays visibly invalid.
  const borderColor = hasError
    ? theme.error
    : isFocused && accentBorder
    ? theme.primary
    : theme.inputBorder;

  const labelColor = hasError
    ? theme.error
    : isFloated
    ? theme.textSecondary
    : theme.inputPlaceholder;

  const field = (
    <View
      style={[
        s.container,
        multiline && s.containerMultiline,
        hasHelp && s.containerWithHelp,
        { borderColor },
        isFocused && accentBorder && s.containerFocused,
        hasError && s.containerFlush,
      ]}
    >
      <Animated.Text
        style={[
          s.label,
          hasHelp && s.labelWithHelp,
          {
            top: labelTop,
            fontSize: labelFontSize,
            color: labelColor,
            backgroundColor: labelBackground,
          },
        ]}
        numberOfLines={1}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
      <TextInput
        {...rest}
        value={value}
        style={[
          s.input,
          multiline && s.inputMultiline,
          hasHelp && s.inputWithHelp,
          { color: theme.inputText },
          style,
        ]}
        multiline={multiline}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor="transparent"
      />
      {hasHelp ? (
        <View style={[s.helpSlot, multiline ? s.helpSlotMultiline : s.helpSlotSingle]}>
          <FieldHelp
            accessibilityLabel={`More information about ${helpLabel ?? label}`}
            compact
            description={helpText!}
            title={helpLabel ?? label}
          />
        </View>
      ) : null}
    </View>
  );

  if (!hasError) return field;

  return (
    <View style={s.errorWrapper}>
      {field}
      <FieldErrorText message={errorText} />
    </View>
  );
}
