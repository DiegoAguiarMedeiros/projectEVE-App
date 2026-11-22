import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from 'src/theme';
import { getCurrencyConfig } from 'src/utils/format';
import { usePreferencesStore } from 'src/store/usePreferencesStore';

export interface CurrencyInputProps
  extends Omit<TextInputProps, 'value' | 'onChange' | 'onChangeText'> {
  label?: string;
  value: string | number;
  onChange: (rawValue: string) => void;
  error?: boolean;
  helperText?: string | null;
  rightElement?: React.ReactNode;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  rightElement,
  style,
  ...rest
}) => {
  const { colors } = useAppTheme();
  const numberFormat = usePreferencesStore((s) => s.numberFormat);
  const currencyCode = usePreferencesStore((s) => s.currencyCode);
  const { symbol } = getCurrencyConfig();

  const formattedDisplay = useMemo(() => {
    if (value === '' || value === null || value === undefined) return '';
    const num = Number(value);
    if (Number.isNaN(num)) return '';
    const cents = Math.round(num * 100);
    const str = String(cents).padStart(3, '0');
    const intPart = str.slice(0, -2);
    const decPart = str.slice(-2);

    if (numberFormat === 'dot-comma') {
      const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${grouped},${decPart}`;
    } else {
      const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `${grouped}.${decPart}`;
    }
  }, [value, numberFormat, currencyCode]);

  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (!digits) {
      onChange('');
      return;
    }
    const cents = parseInt(digits, 10);
    const decimalString = (cents / 100).toFixed(2);
    onChange(decimalString);
  };

  return (
    <View style={styles.wrapper}>
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
          styles.inputContainer,
          {
            backgroundColor: colors.background.neutral,
            borderColor: error ? colors.error.main : colors.border,
          },
        ]}
      >
        <Text style={[styles.symbol, { color: colors.text.secondary }]}>
          {symbol}
        </Text>
        <TextInput
          {...rest}
          value={formattedDisplay}
          onChangeText={handleChangeText}
          keyboardType="numeric"
          placeholder={numberFormat === 'dot-comma' ? '0,00' : '0.00'}
          placeholderTextColor={colors.text.disabled}
          style={[styles.input, { color: colors.text.primary }, style]}
        />
        {rightElement}
      </View>
      {helperText ? (
        <Text
          testID={rest.testID ? `${rest.testID}-helper` : undefined}
          style={[
            styles.helperText,
            { color: error ? colors.error.main : colors.text.secondary },
          ]}
        >
          {helperText}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  symbol: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
