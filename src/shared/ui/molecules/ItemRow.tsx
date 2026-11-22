import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from 'src/theme';

export type ItemAction = {
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  color?: 'error' | 'warning' | 'success' | 'primary';
};

export interface ItemRowProps {
  avatarBg: string;
  avatarIcon: keyof typeof MaterialIcons.glyphMap;
  avatarIconColor: string;
  title: string;
  subtitle?: React.ReactNode;
  amount: React.ReactNode;
  inlineAction?: React.ReactNode;
  menuActions?: ItemAction[];
  onPress?: () => void;
  hideDivider?: boolean;
  testID?: string;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  avatarBg,
  avatarIcon,
  avatarIconColor,
  title,
  subtitle,
  amount,
  inlineAction,
  menuActions,
  onPress,
  hideDivider,
  testID,
}) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const safeBottom =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 48 : 16;
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasMenu = !onPress && !!menuActions && menuActions.length > 0;
  const isClickable = !!onPress || hasMenu;

  const getActionColor = (c?: ItemAction['color']) => {
    switch (c) {
      case 'error':
        return colors.error.main;
      case 'warning':
        return colors.warning.main;
      case 'success':
        return colors.success.main;
      case 'primary':
        return colors.primary.main;
      default:
        return colors.text.primary;
    }
  };

  return (
    <>
      <TouchableOpacity
        testID={testID}
        accessibilityRole={isClickable ? 'button' : undefined}
        activeOpacity={isClickable ? 0.65 : 1}
        onPress={
          onPress ? onPress : hasMenu ? () => setSheetOpen(true) : undefined
        }
        style={styles.row}
      >
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <MaterialIcons name={avatarIcon} size={18} color={avatarIconColor} />
        </View>

        <View style={styles.middle}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: colors.text.primary }]}
          >
            {title}
          </Text>
          {subtitle ? <View style={styles.subtitleRow}>{subtitle}</View> : null}
        </View>

        <View style={styles.right}>
          {amount}
          {inlineAction}
        </View>
      </TouchableOpacity>

      {!hideDivider && (
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      )}

      {hasMenu && (
        <Modal
          visible={sheetOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setSheetOpen(false)}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setSheetOpen(false)}
          >
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.background.paper,
                  paddingBottom: 16 + safeBottom,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.handleWrapper}>
                <View
                  style={[styles.handle, { backgroundColor: colors.divider }]}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[styles.sheetTitle, { color: colors.text.primary }]}
              >
                {title}
              </Text>
              <View
                style={[styles.divider, { backgroundColor: colors.divider }]}
              />
              {menuActions!.map((action, idx) => {
                const actionColor = getActionColor(action.color);
                return (
                  <TouchableOpacity
                    key={idx}
                    testID={testID ? `${testID}-action-${idx}` : undefined}
                    style={styles.sheetItem}
                    onPress={() => {
                      setSheetOpen(false);
                      action.onPress();
                    }}
                  >
                    <MaterialIcons
                      name={action.iconName}
                      size={20}
                      color={actionColor}
                      style={{ marginRight: 14 }}
                    />
                    <Text
                      style={[
                        styles.sheetItemText,
                        { color: actionColor },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  sheetItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
