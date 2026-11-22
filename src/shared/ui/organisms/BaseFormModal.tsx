import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { AppButton } from '../atoms/AppButton';
import { KeyboardAvoidingContainer } from '../atoms/KeyboardAvoidingContainer';

export interface BaseFormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

export const BaseFormModal: React.FC<BaseFormModalProps> = ({
  visible,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel,
  loading,
  disabled,
  onDelete,
  deleteLoading,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const safeBottom =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 48 : 16;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingContainer
        testID="modal-keyboard-container"
        enabled={visible}
        style={styles.backdrop}
      >
        {({ isKeyboardVisible }) => (
          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.background.paper,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {title}
              </Text>
              <TouchableOpacity
                testID="modal-close-button"
                onPress={onClose}
                style={{ padding: 4 }}
              >
                <MaterialIcons
                  name="close"
                  size={22}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {children}
              {onDelete && (
                <View style={{ marginTop: 14 }}>
                  <AppButton
                    testID="modal-delete-button"
                    title={t('common.delete')}
                    variant="outlined"
                    color="error"
                    onPress={onDelete}
                    loading={deleteLoading}
                  />
                </View>
              )}
            </ScrollView>

            <View
              style={[
                styles.modalFooter,
                {
                  borderTopColor: colors.divider,
                  paddingBottom: isKeyboardVisible ? 16 : 16 + safeBottom,
                },
              ]}
            >
              <AppButton
                testID="modal-cancel-button"
                title={t('common.cancel')}
                variant="outlined"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <AppButton
                testID="modal-submit-button"
                title={submitLabel}
                onPress={onSubmit}
                loading={loading}
                disabled={disabled}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingContainer>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '90%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});
