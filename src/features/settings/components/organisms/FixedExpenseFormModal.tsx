import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { BaseFormModal, CurrencyInput, FormInput } from 'src/shared/ui';
import {
  useCreateFixedExpenses,
  useDeleteFixedExpenses,
  useUpdateFixedExpenses,
} from 'src/features/settings/api/useSettingsApi';
import { Envelopes, FixedExpenses } from 'src/types';

export interface FixedExpenseFormModalProps {
  visible: boolean;
  onClose: () => void;
  data?: FixedExpenses | null;
  envelopes: Envelopes[];
}

export const FixedExpenseFormModal: React.FC<FixedExpenseFormModalProps> = ({
  visible,
  onClose,
  data,
  envelopes,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const createMutation = useCreateFixedExpenses();
  const updateMutation = useUpdateFixedExpenses();
  const deleteMutation = useDeleteFixedExpenses();

  const selectableEnvelopes = envelopes.filter(
    (e) => e.name !== 'debts' && e.name !== 'goals'
  );

  const [envelopeId, setEnvelopeId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [errDesc, setErrDesc] = useState<string | null>(null);
  const [errAmount, setErrAmount] = useState<string | null>(null);
  const [errDay, setErrDay] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEnvelopeId(data?.envelopeId ?? selectableEnvelopes[0]?.id ?? '');
      setDescription(data?.description ?? '');
      setAmount(data?.amount ? String(data.amount) : '');
      setPaymentDay(data?.paymentDay ? String(data.paymentDay) : '');
      setErrDesc(null);
      setErrAmount(null);
      setErrDay(null);
    }
  }, [visible, data]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrDesc(t('settings.fixed_expense.validation.description_required'));
      return;
    }
    if (!amount.trim() || Number.isNaN(Number(amount))) {
      setErrAmount(t('settings.fixed_expense.validation.amount_required'));
      return;
    }
    const d = Number(paymentDay);
    if (!paymentDay.trim() || Number.isNaN(d) || d < 1 || d > 31) {
      setErrDay(t('settings.fixed_expense.validation.payment_day_range'));
      return;
    }

    if (data) {
      await updateMutation.mutateAsync({
        id: data.id,
        envelopeId,
        description,
        amount,
        paymentDay,
      });
    } else {
      await createMutation.mutateAsync({
        envelopeId,
        description,
        amount,
        paymentDay,
      });
    }
    onClose();
  };

  return (
    <BaseFormModal
      visible={visible}
      onClose={onClose}
      title={t('settings.fixed_expense.title')}
      onSubmit={handleSubmit}
      submitLabel={data ? t('common.save') : t('common.add')}
      loading={createMutation.isPending || updateMutation.isPending}
      onDelete={
        data
          ? async () => {
              await deleteMutation.mutateAsync(data.id);
              onClose();
            }
          : undefined
      }
      deleteLoading={deleteMutation.isPending}
    >
      <Text style={[styles.fieldTitle, { color: colors.text.secondary }]}>
        {t('settings.fixed_expense.envelope')}
      </Text>
      <View style={[styles.chipsWrap, { marginBottom: 14 }]}>
        {selectableEnvelopes.map((env) => {
          const active = env.id === envelopeId;
          return (
            <TouchableOpacity
              key={env.id}
              onPress={() => setEnvelopeId(env.id)}
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
                {t(env.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FormInput
        testID="fixed-expense-description-input"
        label={t('settings.fixed_expense.description')}
        value={description}
        onChangeText={setDescription}
        error={errDesc}
      />
      <CurrencyInput
        testID="fixed-expense-amount-input"
        label={t('settings.fixed_expense.amount')}
        value={amount}
        onChange={setAmount}
        error={!!errAmount}
        helperText={errAmount}
      />
      <FormInput
        testID="fixed-expense-day-input"
        label={t('settings.fixed_expense.payment_day')}
        value={paymentDay}
        onChangeText={setPaymentDay}
        keyboardType="numeric"
        placeholder="1 - 31"
        error={errDay}
      />
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
