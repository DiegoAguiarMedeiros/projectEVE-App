import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { BaseFormModal, FormInput } from 'src/shared/ui';
import {
  useCreateCreditCards,
  useDeleteCreditCards,
  useUpdateCreditCards,
} from 'src/features/settings/api/useSettingsApi';
import { allFlags, CreditCards, Flags } from 'src/types';

export interface CreditCardFormModalProps {
  visible: boolean;
  onClose: () => void;
  data?: CreditCards | null;
}

export const CreditCardFormModal: React.FC<CreditCardFormModalProps> = ({
  visible,
  onClose,
  data,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const createMutation = useCreateCreditCards();
  const updateMutation = useUpdateCreditCards();
  const deleteMutation = useDeleteCreditCards();

  const [name, setName] = useState('');
  const [flag, setFlag] = useState<Flags>('Visa');
  const [errName, setErrName] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(data?.name ?? '');
      setFlag(data?.flag ?? 'Visa');
      setErrName(null);
    }
  }, [visible, data]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrName(t('settings.credit_card.validation.name_required'));
      return;
    }
    setErrName(null);
    try {
      if (data) {
        await updateMutation.mutateAsync({
          id: data.id,
          name,
          flag,
          active: data.active,
          userId: data.userId,
        });
      } else {
        await createMutation.mutateAsync({ name, flag });
      }
      onClose();
    } catch {
      // handled by mutation onError toast
    }
  };

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={t('settings.credit_card.title')}
      onSubmit={handleSubmit}
      submitLabel={data ? t('common.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={
        data
          ? async () => {
              try {
                await deleteMutation.mutateAsync(data.id);
                onClose();
              } catch {
                // handled by mutation onError toast
              }
            }
          : undefined
      }
      deleteLoading={deleteMutation.isPending}
    >
      <FormInput
        testID="credit-card-name-input"
        label={t('settings.credit_card.name')}
        value={name}
        onChangeText={setName}
        error={errName}
      />
      <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
        {t('settings.credit_card.flag')}
      </Text>
      <View style={styles.chipsWrap}>
        {allFlags.map((f) => {
          const active = flag === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFlag(f)}
              style={[
                styles.optionChip,
                {
                  backgroundColor: active
                    ? colors.primary.main
                    : colors.background.neutral,
                  borderColor: active ? colors.primary.main : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? '#FFF' : colors.text.primary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BaseFormModal>
  );
};

const styles = StyleSheet.create({
  fieldTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
