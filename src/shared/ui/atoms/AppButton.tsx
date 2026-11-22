import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from 'src/theme';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'error' | 'warning' | 'success';
  style?: ViewStyle;
  testID?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'contained',
  color = 'primary',
  style,
  testID,
}) => {
  const { colors } = useAppTheme();

  const paletteColor = colors[color].main;
  const isDisabled = disabled || loading;

  if (variant === 'text') {
    return (
      <TouchableOpacity
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.textBtn, style]}
      >
        <Text
          style={[
            styles.btnText,
            { color: isDisabled ? colors.text.disabled : paletteColor },
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'outlined') {
    return (
      <TouchableOpacity
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.btn,
          {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: isDisabled ? colors.text.disabled : paletteColor,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={paletteColor} />
        ) : (
          <Text
            style={[
              styles.btnText,
              { color: isDisabled ? colors.text.disabled : paletteColor },
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          backgroundColor: isDisabled ? colors.text.disabled : paletteColor,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <Text style={[styles.btnText, { color: '#FFF' }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  textBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
