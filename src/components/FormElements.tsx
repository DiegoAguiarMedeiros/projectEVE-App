import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from 'src/theme';

interface FormInputProps extends TextInputProps {
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
        <Text style={[styles.errorText, { color: colors.error.main }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'error' | 'success' | 'warning';
  style?: ViewStyle;
}

export const AppButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading,
  disabled,
  variant = 'contained',
  color = 'primary',
  style,
}) => {
  const { colors } = useAppTheme();

  const mainColor = colors[color].main;
  const isDisabled = disabled || loading;

  if (variant === 'text') {
    return (
      <TouchableOpacity
        disabled={isDisabled}
        onPress={onPress}
        style={[styles.textBtn, style, isDisabled && { opacity: 0.5 }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={mainColor} />
        ) : (
          <Text style={[styles.btnText, { color: mainColor }]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'outlined') {
    return (
      <TouchableOpacity
        disabled={isDisabled}
        onPress={onPress}
        style={[
          styles.btn,
          {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: isDisabled ? colors.border : mainColor,
          },
          style,
          isDisabled && { opacity: 0.5 },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={mainColor} />
        ) : (
          <Text
            style={[
              styles.btnText,
              { color: isDisabled ? colors.text.disabled : mainColor },
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
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.btn,
        { backgroundColor: mainColor },
        style,
        isDisabled && { opacity: 0.5 },
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

interface ChipTabsProps {
  tabs: {
    label: string;
    index: number;
    icon?: keyof typeof MaterialIcons.glyphMap;
  }[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export const ChipTabs: React.FC<ChipTabsProps> = ({
  tabs,
  activeIndex,
  onChange,
}) => {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});

  useEffect(() => {
    const layout = tabLayouts.current[activeIndex];
    if (layout) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, layout.x - 16),
        animated: true,
      });
    }
  }, [activeIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipTabsScroll}
      contentContainerStyle={styles.chipTabsContainer}
    >
      {tabs.map((tab) => {
        const active = tab.index === activeIndex;
        return (
          <TouchableOpacity
            key={tab.index}
            activeOpacity={0.75}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              tabLayouts.current[tab.index] = { x, width };
            }}
            onPress={() => onChange(tab.index)}
            style={[
              styles.chipTab,
              {
                backgroundColor: active
                  ? colors.primary.main
                  : colors.background.paper,
                borderColor: active ? colors.primary.main : colors.border,
              },
            ]}
          >
            {tab.icon && (
              <MaterialIcons
                name={tab.icon}
                size={16}
                color={active ? '#FFF' : colors.text.secondary}
              />
            )}
            <Text
              numberOfLines={1}
              style={{
                color: active ? '#FFF' : colors.text.secondary,
                fontWeight: active ? '700' : '600',
                fontSize: 13,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export const FloatingAddButton: React.FC<{
  onPress: () => void;
  style?: ViewStyle;
}> = ({ onPress, style }) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.floatingAddBtn,
        { backgroundColor: colors.primary.main },
        style,
      ]}
    >
      <MaterialIcons name="add" size={26} color="#FFF" />
    </TouchableOpacity>
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
    paddingHorizontal: 12,
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
  chipTabsScroll: {
    flexGrow: 0,
    marginHorizontal: -16,
    marginBottom: 8,
  },
  chipTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  chipTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  floatingAddBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
