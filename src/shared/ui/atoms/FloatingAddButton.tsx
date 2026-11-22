import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from 'src/theme';

export interface FloatingAddButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  onPress,
  style,
  testID = 'floating-add-button',
}) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
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
