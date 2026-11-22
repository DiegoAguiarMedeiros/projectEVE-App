import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useAppTheme } from 'src/theme';
import { usePreferencesStore } from 'src/store/usePreferencesStore';

export interface DatePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  testID?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  testID = 'date-picker-field',
}) => {
  const { colors, isDark } = useAppTheme();
  const dateFormat = usePreferencesStore((s) => s.dateFormat);
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.dateFieldWrapper}>
      <Text style={[styles.dateFieldLabel, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <TouchableOpacity
        testID={testID}
        accessibilityRole="button"
        activeOpacity={0.75}
        onPress={() => setOpen((prev) => !prev)}
        style={[
          styles.dateFieldBox,
          {
            backgroundColor: colors.background.neutral,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.dateFieldText, { color: colors.text.primary }]}>
          {dayjs(value).format(dateFormat)}
        </Text>
        <MaterialIcons
          name="calendar-today"
          size={19}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {open && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={handleChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dateFieldWrapper: {
    marginBottom: 14,
  },
  dateFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  dateFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  dateFieldText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
