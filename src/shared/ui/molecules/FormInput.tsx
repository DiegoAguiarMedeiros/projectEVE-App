import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from 'src/theme';

export interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  rightElement,
  containerStyle,
  style,
  editable = true,
  ...rest
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: error ? colors.error.main : colors.text.secondary },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: editable
              ? colors.background.neutral
              : colors.background.default,
            borderColor: error ? colors.error.main : colors.border,
            opacity: editable ? 1 : 0.65,
          },
        ]}
      >
        <TextInput
          {...rest}
          editable={editable}
          placeholderTextColor={colors.text.disabled}
          style={[styles.input, { color: colors.text.primary }, style]}
        />
        {rightElement}
      </View>
      {error ? (
        <Text
          testID={rest.testID ? `${rest.testID}-error` : undefined}
          style={[styles.errorText, { color: colors.error.main }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
